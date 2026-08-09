// Genera un token Portal para un usuario anonimo (UUID).
// El token se firma con la secret key de Portal (sk_).
// GET /portal-token?userId=uuid

const PORTAL_SECRET = Deno.env.get("PORTAL_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return new Response(JSON.stringify({ error: "userId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const token = await generatePortalToken(userId);
  return new Response(JSON.stringify({ token }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

async function generatePortalToken(userId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PORTAL_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 horas
  };

  const enc = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerEnc = enc(header);
  const payloadEnc = enc(payload);
  const signingInput = `${headerEnc}.${payloadEnc}`;

  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const sigEnc = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${signingInput}.${sigEnc}`;
}
