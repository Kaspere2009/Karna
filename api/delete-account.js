// Raderar ett konto HELT: all data, alla progressbilder och själva inloggningskontot.
// Krävs av App Store och Google Play. Använder SUPABASE_SECRET_KEY (finns redan i Vercel).

const SUPABASE_URL = "https://clwdczzwsvowsfpaijjm.supabase.co";
const SUPABASE_KEY = "sb_publishable_DJZHyFLJcCW3Ii4HlXgjOw_rbEZkh4s"; // publik nyckel, samma som i appen
const USER_TABLES = [
  ["daily_logs", "user_id"], ["day_info", "user_id"], ["saved_meals", "user_id"],
  ["food_choices", "user_id"], ["profiles", "id"],
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "Servern saknar SUPABASE_SECRET_KEY." });

  // 1. vem är det som frågar? (kontrolleras mot användarens egen inloggning — ingen kan radera någon annan)
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Inte inloggad." });
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!who.ok) return res.status(401).json({ error: "Inloggningen har gått ut — logga in igen och försök på nytt." });
  const user = await who.json();
  const uid = user && user.id;
  if (!uid) return res.status(401).json({ error: "Kunde inte identifiera kontot." });

  const admin = { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json" };

  try {
    // 2. progressbilder i fillagringen
    const list = await fetch(`${SUPABASE_URL}/storage/v1/object/list/progress-photos`, {
      method: "POST", headers: admin, body: JSON.stringify({ prefix: `${uid}/`, limit: 1000 }),
    });
    if (list.ok) {
      const files = await list.json();
      const paths = (Array.isArray(files) ? files : []).filter((f) => f && f.name).map((f) => `${uid}/${f.name}`);
      if (paths.length) {
        await fetch(`${SUPABASE_URL}/storage/v1/object/progress-photos`, {
          method: "DELETE", headers: admin, body: JSON.stringify({ prefixes: paths }),
        });
      }
    }

    // 3. all data i tabellerna
    for (const [table, column] of USER_TABLES) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${uid}`, { method: "DELETE", headers: admin });
      if (!r.ok && r.status !== 404) throw new Error(`Kunde inte radera ${table} (${r.status})`);
    }

    // 4. själva inloggningskontot
    const del = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, { method: "DELETE", headers: admin });
    if (!del.ok) throw new Error(`Kunde inte radera kontot (${del.status}): ${await del.text()}`);

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
