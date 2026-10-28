// api/claude.js — skickar AI-anrop från appen vidare till Anthropic.
// Säkerhet: modellen och maxlängden bestäms HÄR (inte i appen), och bara inloggade
// användare får anropa, så att ingen utomstående kan använda upp dina krediter.

const SUPABASE_URL = "https://clwdczzwsvowsfpaijjm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DJZHyFLJcCW3Ii4HlXgjOw_rbEZkh4s";
const MODEL = "claude-haiku-5-5";
const MAX_TOKENS = 1000;
const MAX_BODY_CHARS = 4000000; // ca 4 MB (räcker för en bild)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Endast POST." });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI är inte aktiverad än." });

  // bara inloggade användare
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Du måste vara inloggad." });
  try {
    const check = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!check.ok) return res.status(401).json({ error: "Inloggningen är ogiltig, logga in igen." });
  } catch (e) {
    return res.status(502).json({ error: "Kunde inte kontrollera inloggningen." });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch (e) { return res.status(400).json({ error: "Ogiltig förfrågan." }); }
  }
  const { system, messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Inga meddelanden skickades." });
  }
  if (JSON.stringify(messages).length + String(system || "").length > MAX_BODY_CHARS) {
    return res.status(413).json({ error: "För stor förfrågan (bilden är för stor?)." });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(Number(body.max_tokens) || MAX_TOKENS, MAX_TOKENS),
        ...(system ? { system: String(system) } : {}),
        messages,
      }),
    });
    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: "Kunde inte nå AI:n just nu." });
  }
}
