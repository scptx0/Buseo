// Edge Function: generate-feed
// Lee reportes agrupados, si >= 4 identicos → Bedrock genera resumen → INSERT feed_posts.
// Invocar via pg_cron o POST manual cada 5 min.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/rest\/v1\/?$/, "");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BEDROCK_MODEL_ID = Deno.env.get("BEDROCK_MODEL_ID") || "deepseek.v3.2";
const AWS_REGION = Deno.env.get("AWS_REGION")!;
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID")!;
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY")!;
const PORTAL_KEY = Deno.env.get("PORTAL_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ClusterRow {
  target_type: string;
  target_id: string;
  report_type: string;
  count: number;
  sample_descriptions: string[];
}

async function sha256hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: ArrayBuffer, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
}

async function bedrockInvoke(body: string): Promise<unknown> {
  const url = new URL(`https://bedrock-runtime.${AWS_REGION}.amazonaws.com/model/${BEDROCK_MODEL_ID}/invoke`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);
  const payloadHash = await sha256hex(body);
  const canonicalHeaders = `content-type:application/json\nhost:${url.hostname}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaderNames = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `POST\n${url.pathname}\n\n${canonicalHeaders}\n${signedHeaderNames}\n${payloadHash}`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/${AWS_REGION}/bedrock/aws4_request\n${await sha256hex(canonicalRequest)}`;
  const kSecret = new TextEncoder().encode("AWS4" + AWS_SECRET_ACCESS_KEY);
  const kDate = await hmac(kSecret, dateStamp);
  const kRegion = await hmac(kDate, AWS_REGION);
  const kService = await hmac(kRegion, "bedrock");
  const kSigning = await hmac(kService, "aws4_request");
  const sigBuf = await hmac(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  const auth = `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY_ID}/${dateStamp}/${AWS_REGION}/bedrock/aws4_request, SignedHeaders=${signedHeaderNames}, Signature=${signature}`;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Host: url.hostname, "X-Amz-Date": amzDate, "X-Amz-Content-Sha256": payloadHash, Authorization: auth }, body });
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: clusters, error } = await supabase.rpc("get_report_clusters", { p_min_reports: 2, p_window_hours: 0.5, p_dedup_minutes: 30 });
  if (error) return new Response(JSON.stringify({ error: error.message, step: "rpc" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!clusters || clusters.length === 0) return new Response(JSON.stringify({ generated: 0, reason: "no-clusters" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const results: Array<{ post_id?: string; title?: string }> = [];

  for (const cluster of (clusters as ClusterRow[])) {
    const descriptions = cluster.sample_descriptions.filter(Boolean).slice(0, 5).join("; ");
    const targetName = cluster.target_type === 'bus' ? 'la linea ' + cluster.target_id : 'la estacion ' + cluster.target_id;
    const prompt = `Eres un asistente del Metropolitano de Lima. ${cluster.count} usuarios reportaron problemas en ${targetName}. Comentarios: "${descriptions}". Genera un aviso breve en JSON: {"title":"titulo max 60 chars","content":"2-3 lineas informativas","tags":["#tag1"],"severity":"info|warning|critical"}. Solo responde con el JSON.`;

    try {
      const resp = await bedrockInvoke(JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150, temperature: 0.3,
      })) as { choices?: Array<{ message?: { content?: string } }> };

      const raw = resp.choices?.[0]?.message?.content || "";
      if (!raw) continue;

      let clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      if (!clean.startsWith("{")) {
        const match = clean.match(/\{[\s\S]*\}/);
        clean = match ? match[0] : clean;
      }
      const json = JSON.parse(clean);
      if (!json.title || !json.content) continue;

      const { data: post, error: postErr } = await supabase
        .from("feed_posts")
        .insert({ title: json.title, content: json.content, tags: [...(json.tags || []), cluster.target_id], created_at: new Date().toISOString() })
        .select("id").single();

      if (postErr || !post) continue;
      results.push({ post_id: post.id, title: json.title });
    } catch {
      continue;
    }
  }

  return new Response(JSON.stringify({ generated: results.length, posts: results }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
