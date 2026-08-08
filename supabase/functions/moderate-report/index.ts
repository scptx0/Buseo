const AWS_REGION = Deno.env.get("AWS_REGION")!;
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID")!;
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY")!;
const BEDROCK_MODEL_ID = Deno.env.get("BEDROCK_MODEL_ID") || "deepseek.v3.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Eres un moderador estricto de contenido para una app de transporte publico en Lima, Peru.
Analiza el texto del usuario y determina si contiene ALGUNO de estos elementos:
- Insultos, groserias o lenguaje obsceno
- Discurso de odio, racismo, xenofobia, homofobia
- Spam, publicidad, enlaces o promocion
- Contenido sexual o inapropiado
- Amenazas, acoso o intimidacion
- Informacion personal de terceros
- Cualquier contenido ajeno a reportar estado de bus, estacion o incidente
Responde UNICAMENTE con ALLOWED o BLOCKED: <razon breve en español>.`;

async function sha256hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: ArrayBuffer, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
}

async function buildSig(method: string, url: URL, body: string): Promise<Headers> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);
  const region = AWS_REGION;
  const service = "bedrock";
  const host = url.hostname;

  // Task 1: Create canonical request
  const payloadHash = await sha256hex(body);
  const headers = new Map([
    ["host", host],
    ["content-type", "application/json"],
    ["x-amz-date", amzDate],
    ["x-amz-content-sha256", payloadHash],
  ]);
  const signedHeaderNames = Array.from(headers.keys()).sort().join(";");
  const canonicalHeaders = Array.from(headers.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v.trim()}\n`).join("");
  const canonicalRequest = `${method}\n${url.pathname}\n\n${canonicalHeaders}\n${signedHeaderNames}\n${payloadHash}`;
  const canonicalRequestHash = await sha256hex(canonicalRequest);

  // Task 2: Create string to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  // Task 3: Calculate signature
  const kSecret = new TextEncoder().encode("AWS4" + AWS_SECRET_ACCESS_KEY);
  const kDate = await hmac(kSecret, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  const sigBuf = await hmac(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

  // Task 4: Build Auth header
  const authHeader = `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`;

  const result = new Headers();
  result.set("host", host);
  result.set("content-type", "application/json");
  result.set("x-amz-date", amzDate);
  result.set("x-amz-content-sha256", payloadHash);
  result.set("authorization", authHeader);
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let body: { text: string };
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!body.text?.trim()) return new Response(JSON.stringify({ allowed: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const reqBody = JSON.stringify({
    messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: body.text.trim() }],
    max_tokens: 30, temperature: 0,
  });

  const url = new URL(`https://bedrock-runtime.${AWS_REGION}.amazonaws.com/model/${BEDROCK_MODEL_ID}/invoke`);

  try {
    const headers = await buildSig("POST", url, reqBody);
    const res = await fetch(url, { method: "POST", headers, body: reqBody });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const result = (data.choices?.[0]?.message?.content || "").trim();
    if (result.startsWith("ALLOWED")) return new Response(JSON.stringify({ allowed: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const reason = result.replace(/^BLOCKED:\s*/i, "").trim();
    return new Response(JSON.stringify({ allowed: false, reason: reason || "Contenido no permitido" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    return new Response(JSON.stringify({ allowed: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
