// api/food-lookup.js — söker livsmedel åt appen.
//  POST { query, country }  → { results: [...] }   (egen databas först, sedan märkesvaror från Open Food Facts)
//  POST { barcode }         → { product: {...} }   (streckkod via Open Food Facts)
// Alla värden är per 100 g, direkt från källan. Inget uppskattas här.

const SUPABASE_URL = "https://clwdczzwsvowsfpaijjm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DJZHyFLJcCW3Ii4HlXgjOw_rbEZkh4s";
const OFF_HEADERS = { "User-Agent": "DOT/1.0 (karna-pied.vercel.app)", Accept: "application/json" };
const DB_LIMIT = 30;   // hämtas från databasen, sorteras om, visas högst 15
const SHOW_LIMIT = 15;
const OFF_LIMIT = 5;

const SOURCE_LABELS = { slv: "Livsmedelsverkets livsmedelsdatabas", usda: "USDA FoodData Central" };
// landskod → Open Food Facts landnamn (för märkesvaror från ditt land)
const OFF_COUNTRIES = {
  SE: "sweden", NO: "norway", DK: "denmark", FI: "finland", DE: "germany", GB: "united-kingdom",
  US: "united-states", ES: "spain", FR: "france", IT: "italy", NL: "netherlands", PL: "poland",
};

// ---------- hjälpfunktioner ----------
async function fetchWithTimeout(url, options = {}, ms = 4000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

const num = (v) => (typeof v === "number" && isFinite(v) ? v : Number(v) || 0);
const norm = (s) => String(s || "").toLowerCase().normalize("NFC").trim();

function rowToCandidate(r) {
  const extra = r.extra_micros && Object.keys(r.extra_micros).length ? r.extra_micros : null;
  const micros = { ...(extra || {}), ...(r.micros || {}) };
  return {
    id: r.id,
    source: (SOURCE_LABELS[r.source] || r.source) + (extra ? ", kompletterat med USDA FoodData Central" : ""),
    name: r.name_sv || r.name_en,
    per100: {
      kcal: num(r.kcal), protein_g: num(r.protein_g), carbs_g: num(r.carbs_g), sugar_g: num(r.sugar_g),
      fiber_g: num(r.fiber_g), fat_g: num(r.fat_g), satfat_g: num(r.satfat_g), transfat_g: num(r.transfat_g),
    },
    micros100: Object.keys(micros).length ? micros : null,
  };
}

// vanliga livsmedel först: "mjölk" ska ge "Mjölk fett 3%" före "Mjölkchoklad"
function rankScore(name, query) {
  const n = norm(name);
  const q = norm(query);
  if (!q) return 3;
  const words = n.split(/[\s,.;:()/|-]+/).filter(Boolean);
  if (n === q) return 0;
  if (words[0] === q || n.startsWith(q + " ") || n.startsWith(q + ",")) return 1;
  if (words.includes(q)) return 2;
  return 3;
}
function rerank(list, query) {
  return list
    .map((c, i) => ({ c, i, s: rankScore(c.name, query) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.c);
}

// ---------- egen databas (Supabase) ----------
async function searchDatabase(query, country) {
  const key = process.env.SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY;
  const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rpc/search_foods`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, p_country: country || null, p_limit: DB_LIMIT }),
  }, 6000);
  if (!res.ok) {
    console.error("[food-lookup] search_foods svarade", res.status, (await res.text()).slice(0, 300));
    return [];
  }
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).filter((r) => r && r.id && (r.name_sv || r.name_en)).map(rowToCandidate);
}

// ---------- Open Food Facts (märkesvaror) ----------
const OFF_MICROS = [
  // [OFF-fält (gram per 100 g), appens nyckel, faktor till appens enhet]
  ["sodium_100g", "sodium", 1000], ["calcium_100g", "calcium", 1000], ["iron_100g", "iron", 1000],
  ["potassium_100g", "potassium", 1000], ["magnesium_100g", "magnesium", 1000], ["zinc_100g", "zinc", 1000],
  ["vitamin-c_100g", "vit_c", 1000], ["vitamin-d_100g", "vit_d", 1e6], ["vitamin-a_100g", "vit_a", 1e6],
  ["vitamin-b12_100g", "b12", 1e6], ["iodine_100g", "iodine", 1e6],
];
function offToCandidate(p) {
  const n = p && p.nutriments;
  if (!n) return null;
  const kcal = n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : undefined);
  if (typeof kcal !== "number" && isNaN(Number(kcal))) return null;
  const name = String(p.product_name_sv || p.product_name || p.generic_name || "").trim();
  if (!name) return null;
  const micros = {};
  for (const [field, key, factor] of OFF_MICROS) {
    const v = Number(n[field]);
    if (n[field] !== undefined && n[field] !== "" && isFinite(v) && v >= 0) micros[key] = Math.round(v * factor * 1000) / 1000;
  }
  const serving = Number(p.serving_quantity);
  return {
    id: `off-${p.code || p._id}`,
    source: "Open Food Facts",
    name,
    brand: String(p.brands || "").split(",")[0].trim() || null,
    per100: {
      kcal: num(kcal), protein_g: num(n.proteins_100g), carbs_g: num(n.carbohydrates_100g), sugar_g: num(n.sugars_100g),
      fiber_g: num(n.fiber_100g), fat_g: num(n.fat_100g), satfat_g: num(n["saturated-fat_100g"]), transfat_g: num(n["trans-fat_100g"]),
    },
    micros100: Object.keys(micros).length ? micros : null,
    servingGrams: serving > 0 && serving < 2000 ? Math.round(serving) : null,
  };
}

const OFF_FIELDS = "code,product_name,product_name_sv,generic_name,brands,nutriments,serving_quantity";

async function searchOpenFoodFacts(query, country) {
  const params = new URLSearchParams({
    search_terms: query, search_simple: "1", action: "process", json: "1",
    page_size: String(OFF_LIMIT * 2), fields: OFF_FIELDS,
  });
  const offCountry = OFF_COUNTRIES[country];
  if (offCountry) {
    params.set("tagtype_0", "countries");
    params.set("tag_contains_0", "contains");
    params.set("tag_0", offCountry);
  }
  try {
    const res = await fetchWithTimeout(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, { headers: OFF_HEADERS }, 3500);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).map(offToCandidate).filter(Boolean).slice(0, OFF_LIMIT);
  } catch (e) {
    return []; // Open Food Facts är långsam ibland — då visas bara databasträffarna
  }
}

async function lookupBarcode(code) {
  const clean = String(code || "").replace(/\D/g, "");
  if (!clean) return null;
  try {
    const res = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${OFF_FIELDS}`, { headers: OFF_HEADERS }, 6000
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return offToCandidate({ ...data.product, code: data.product.code || clean });
  } catch (e) {
    return null;
  }
}

// ---------- handler ----------
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Endast POST." });
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; }
  }

  try {
    if (body.barcode) {
      return res.status(200).json({ product: await lookupBarcode(body.barcode) });
    }

    const query = String(body.query || "").trim().slice(0, 100);
    if (query.length < 2) return res.status(200).json({ results: [] });
    const country = body.country ? String(body.country).toUpperCase().slice(0, 5) : null;

    const [db, off] = await Promise.all([
      searchDatabase(query, country).catch((e) => { console.error("[food-lookup] databasfel:", e.message); return []; }),
      searchOpenFoodFacts(query, country),
    ]);
    const results = [...rerank(db, query).slice(0, SHOW_LIMIT), ...off];
    return res.status(200).json({ results });
  } catch (e) {
    console.error("[food-lookup] fel:", e.message);
    return res.status(200).json({ results: [], error: e.message });
  }
}
