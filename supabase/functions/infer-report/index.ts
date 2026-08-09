// Edge Function: infer-report
// Recibe un report_id, lee el reporte de la DB, infiere severidad
// via AWS Bedrock (DeepSeek v3.2), y actualiza el reporte en Supabase.
// Solo modifica el campo severity; el description del usuario se conserva.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "npm:@aws-sdk/client-bedrock-runtime";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Report {
  id: string;
  type: string;
  target_id: string;
  description: string;
  metadata: Record<string, unknown>;
}

interface Station {
  id: number;
  name: string;
}

function formatName(raw: string): string {
  const c = raw.toLowerCase().replace(/-/g, " ");
  return c.charAt(0).toUpperCase() + c.slice(1);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let reportId: string;
  try {
    const body = await req.json();
    reportId = body.reportId;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!reportId || typeof reportId !== "string") {
    return new Response(JSON.stringify({ error: "reportId required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: report, error } = await supabase
    .from("reports")
    .select("id, type, target_id, description, metadata")
    .eq("id", reportId)
    .single();

  if (error || !report) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const r = report as Report;
  const meta = (r.metadata ?? {}) as Record<string, unknown>;

  // Consultar nombres de estaciones para enriquecer el prompt
  let stationNames: Record<number, string> = {};
  if (r.type === "incident" || r.type === "station") {
    const ids: number[] = [];
    if (typeof meta.station1Id === "number") ids.push(meta.station1Id);
    if (typeof meta.station2Id === "number") ids.push(meta.station2Id);
    if (typeof meta.stationId === "number") ids.push(meta.stationId);
    const targetNum = Number(r.target_id);
    if (!Number.isNaN(targetNum) && targetNum > 0) ids.push(targetNum);

    if (ids.length > 0) {
      const { data: sts } = await supabase
        .from("stations")
        .select("id, name")
        .in("id", ids);
      for (const s of (sts ?? []) as Station[]) {
        stationNames[s.id] = formatName(s.name);
      }
    }
  }

  // Construir prompt segun tipo
  const parts: string[] = [];
  parts.push(`Tipo de reporte: ${r.type}`);

  if (r.type === "incident") {
    const s1Label = stationNames[meta.station1Id as number] ?? `#${meta.station1Id}`;
    const s2Label = stationNames[meta.station2Id as number] ?? `#${meta.station2Id}`;
    parts.push(`Tramo: ${s1Label} y ${s2Label}`);

    if (meta.incidentType) {
      const typeLabels: Record<string, string> = {
        delay: "Demora",
        incident: "Incidente",
        closure: "Cierre",
        other: "Otro",
      };
      parts.push(`Tipo de incidente: ${typeLabels[meta.incidentType as string] ?? meta.incidentType}`);
    }
  } else if (r.type === "station") {
    const sLabel = stationNames[Number(r.target_id)] ?? `#${r.target_id}`;
    parts.push(`Estacion: ${sLabel}`);

    if (meta.lineId) {
      parts.push(`Linea de bus esperada: ${meta.lineId}`);
    }
    if (meta.direction) {
      parts.push(
        `Direccion: ${meta.direction === "norte" ? "Norte a Sur" : "Sur a Norte"}`,
      );
    }
    if (typeof meta.queueLevel === "number" && meta.queueLevel > 0) {
      parts.push(`Nivel de cola: ${meta.queueLevel}/10`);
    }
    if (typeof meta.occupancyLevel === "number" && meta.occupancyLevel > 0) {
      parts.push(`Nivel de llenado de la estacion: ${meta.occupancyLevel}/10`);
    }
  }

  if (r.description && r.description.trim()) {
    parts.push(`Comentario del usuario: ${r.description.trim()}`);
  }

  parts.push("");
  parts.push(
    "Analiza el reporte e infiere la severidad (ok, warning, o critical). " +
      "Responde UNICAMENTE con un objeto JSON con el campo severity.",
  );

  const prompt = parts.join("\n");

  try {
    const bedrock = new BedrockRuntimeClient({
      region: Deno.env.get("AWS_REGION") ?? "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") ?? "",
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") ?? "",
      },
    });

    const modelId = Deno.env.get("BEDROCK_MODEL_ID") ?? "us.deepseek.v3.2-v1:0";

    const cmd = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          { role: "user", content: prompt },
        ],
        max_tokens: 80,
        temperature: 0.3,
      }),
    });

    const response = await bedrock.send(cmd);
    const bodyText = new TextDecoder().decode(response.body);

    // Extraer severity del JSON de respuesta
    const jsonMatch = bodyText.match(/"severity"\s*:\s*"(ok|warning|critical)"/);
    const severity = jsonMatch ? jsonMatch[1] : "ok";

    // Solo actualizar severity, nunca sobrescribir el description del usuario
    await supabase.from("reports").update({ severity }).eq("id", reportId);

    return new Response(JSON.stringify({ severity }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Bedrock error:", err);
    return new Response(JSON.stringify({ severity: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});