import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "npm:@aws-sdk/client-bedrock-runtime";

const AWS_REGION = Deno.env.get("AWS_REGION")!;
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID")!;
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY")!;
const BEDROCK_MODEL_ID = Deno.env.get("BEDROCK_MODEL_ID") || "deepseek.r1-v1:0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const client = new BedrockRuntimeClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const SYSTEM_PROMPT = `Eres un moderador estricto de contenido para una app de transporte publico en Lima, Peru.
Analiza el siguiente texto y determina si contiene ALGUNO de estos elementos:

- Insultos, groserias o lenguaje obsceno
- Discurso de odio, racismo, xenofobia, homofobia
- Spam, publicidad, enlaces o promocion
- Contenido sexual o inapropiado
- Amenazas, acoso o intimidacion
- Informacion personal de terceros (nombres, telefonos, direcciones)
- Cualquier contenido que no sea util para reportar el estado de un bus, estacion o incidente

Responde UNICAMENTE con una de estas dos opciones exactas, sin texto adicional:
ALLOWED
BLOCKED: <razon breve en español explicando que regla violo>`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { text: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.text || !body.text.trim()) {
    return new Response(JSON.stringify({ allowed: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const prompt = `${SYSTEM_PROMPT}\n\nTexto a analizar: "${body.text.trim()}"`;

  try {
    const cmd = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt,
        max_tokens: 50,
        temperature: 0,
      }),
    });

    const response = await client.send(cmd);
    const decoded = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(decoded);
    const result = (parsed.completion || parsed.generation || "").trim();

    if (result.startsWith("ALLOWED")) {
      return new Response(JSON.stringify({ allowed: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reason = result.replace(/^BLOCKED:\s*/i, "").trim();
    return new Response(
      JSON.stringify({ allowed: false, reason: reason || "Contenido no permitido" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Bedrock error:", err);
    return new Response(JSON.stringify({ allowed: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
