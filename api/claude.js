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

  // trim: tar bort mellanslag/radbrytningar som lätt följer med när nyckeln klistras in
  const apiKey = String(process.env.ANTHROPIC_API_KEY || "").replace(/\s+/g, "");
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
    console.error("[claude] inloggningskontroll misslyckades:", e && e.message);
    return res.status(502).json({ error: "Kunde inte kontrollera inloggningen: " + (e && e.message) });
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
    if (!r.ok) console.error("[claude] Anthropic svarade", r.status, JSON.stringify(data).slice(0, 500));
    return res.status(r.status).json(data);
  } catch (e) {
    console.error("[claude] anropet till Anthropic kraschade:", e && e.message, e && e.cause && e.cause.message);
    return res.status(502).json({ error: "Kunde inte nå AI:n: " + (e && e.message) });
  }
}
