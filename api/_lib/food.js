// api/_lib/food.js — gemensam kod för livsmedelssökning. Används av api/food-lookup.js (appen)
// och api/common-foods.js (adminsidan med testet), så att testet visar exakt det appen gör.
// Mappar som börjar med "_" blir inga egna adresser hos Vercel.

const SUPABASE_URL = "https://clwdczzwsvowsfpaijjm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DJZHyFLJcCW3Ii4HlXgjOw_rbEZkh4s";
const OFF_HEADERS = { "User-Agent": "DOT/1.0 (karna-pied.vercel.app)", Accept: "application/json" };
const DB_LIMIT = 60;   // hämtas från databasen, sorteras om, visas högst 25
const SHOW_LIMIT = 25;
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

function rowToCandidate(r, lang) {
  const extra = r.extra_micros && Object.keys(r.extra_micros).length ? r.extra_micros : null;
  const micros = { ...(extra || {}), ...(r.micros || {}) };
  return {
    id: r.id,
    source: (SOURCE_LABELS[r.source] || r.source) + (extra ? ", kompletterat med USDA FoodData Central" : ""),
    name: lang === "en" ? r.name_en || r.name_sv : r.name_sv || r.name_en,
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
// ovanliga former (torkat, pulver, fryst, barnmat …) hamnar sist inom sin grupp, om man inte sökt på dem
const ODD_FORMS = /\b(dried|dry|powder|powdered|frozen|dehydrated|substitute|babyfood|baby food|mix|torkad|torkat|pulver|fryst|barnmat)\b/i;
function rerank(list, query) {
  const askedOdd = ODD_FORMS.test(query);
  return list
    .map((c, i) => ({ c, i, s: rankScore(c.name, query) + (!askedOdd && ODD_FORMS.test(c.name) ? 0.5 : 0) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.c);
}

// engelska plural → singular, så att "eggs" hittar "Egg, boiled" och "tomatoes" hittar "Tomato"
function singularize(query) {
  return query.split(/\s+/).map((w) => {
    if (w.length <= 3) return w;
    if (/ies$/i.test(w)) return w.slice(0, -3) + "y";
    if (/(sh|ch|x|ss|o)es$/i.test(w)) return w.slice(0, -2);
    if (/s$/i.test(w) && !/ss$/i.test(w)) return w.slice(0, -1);
    return w;
  }).join(" ");
}

// ---------- egen databas (Supabase) ----------
async function searchDatabase(query, country, lang) {
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
  return (Array.isArray(rows) ? rows : []).filter((r) => r && r.id && (r.name_sv || r.name_en)).map((r) => rowToCandidate(r, lang));
}

// ---------- Open Food Facts (märkesvaror) ----------
const OFF_MICROS = [
  // [OFF-fält (gram per 100 g), appens nyckel, faktor till appens enhet]
  ["sodium_100g", "sodium", 1000], ["calcium_100g", "calcium", 1000], ["iron_100g", "iron", 1000],
  ["potassium_100g", "potassium", 1000], ["magnesium_100g", "magnesium", 1000], ["zinc_100g", "zinc", 1000],
  ["vitamin-c_100g", "vit_c", 1000], ["vitamin-d_100g", "vit_d", 1e6], ["vitamin-a_100g", "vit_a", 1e6],
  ["vitamin-b12_100g", "b12", 1e6], ["iodine_100g", "iodine", 1e6],
];
function offToCandidate(p, lang) {
  const n = p && p.nutriments;
  if (!n) return null;
  const kcal = n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : undefined);
  if (typeof kcal !== "number" && isNaN(Number(kcal))) return null;
  const name = String((lang === "en" ? p.product_name_en : p.product_name_sv) || p.product_name || p.generic_name || "").trim();
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

const OFF_FIELDS = "code,product_name,product_name_sv,product_name_en,generic_name,brands,nutriments,serving_quantity";

async function searchOpenFoodFacts(query, country, lang) {
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
    return (data.products || []).map((p) => offToCandidate(p, lang)).filter(Boolean).slice(0, OFF_LIMIT);
  } catch (e) {
    return []; // Open Food Facts är långsam ibland — då visas bara databasträffarna
  }
}

async function lookupBarcode(code, lang) {
  const clean = String(code || "").replace(/\D/g, "");
  if (!clean) return null;
  try {
    const res = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${OFF_FIELDS}`, { headers: OFF_HEADERS }, 6000
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return offToCandidate({ ...data.product, code: data.product.code || clean }, lang);
  } catch (e) {
    return null;
  }
}

// ---------- AI (Claude) ----------
const MODEL = "claude-haiku-5-5";

export async function callAnthropic(system, userText, maxTokens = 300) {
  const apiKey = String(process.env.ANTHROPIC_API_KEY || "").replace(/\s+/g, "");
  if (!apiKey) throw new Error("AI är inte aktiverad.");
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens, thinking: { type: "disabled" },
      system, messages: [{ role: "user", content: userText }],
    }),
  }, 15000);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Anthropic " + res.status + ": " + JSON.stringify(data).slice(0, 200));
  const block = (data.content || []).find((b) => b.type === "text");
  return block ? block.text : "";
}

export function parseJsonLoose(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  const start = clean.search(/[[{]/);
  const end = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  return JSON.parse(start >= 0 && end > start ? clean.slice(start, end + 1) : clean);
}

const PICK_RULES =
  "Regler: 1) Om användaren inte skrivit okokt/torr/rå: välj tillagad variant (kokt ris/pasta, kokt ägg, stekt/kokt kött). " +
  "2) Välj ALDRIG barnmat, konserv, pulver, torkat, fryst färdigrätt, mix eller kylvara om användaren inte nämnt det — välj hellre hemlagad eller den vanligaste neutrala varianten. " +
  "3) Välj ALDRIG eko-variant, glutenfri, laktosfri, extrasaltad, osaltad, specialkost (\"reduced fat\", \"special dietary\", \"low sodium\"), snabbmatskedja (\"Fast Food\", \"Pizza Chain\") eller märkesvara om användaren inte nämnt det. " +
  "4) Raden ska vara samma livsmedel, inte en rätt som bara innehåller det (\"ägg\" är inte \"våffla m. ägg\", \"oatmeal\" är inte \"oatmeal cookies\"). " +
  "5) Skrev användaren bara ett enkelt livsmedel, välj den enklaste vanliga formen: \"ägg\"/\"eggs\" = kokt ägg (inte äggröra eller omelett), " +
  "\"gröt\"/\"oatmeal\" = havregrynsgröt kokt på vatten, \"kyckling\" = kycklingfilé/bröst tillagad, \"mjölk\" = vanlig mellanmjölk/standardmjölk. Rätter bara om de nämns. " +
  "Raderna kan vara på svenska eller engelska — det spelar ingen roll vilket språk användaren skrev på.";

// väljer bästa raden för det användaren skrev, eller null
export async function aiPick(userText, candidates, wantHint = "", { preferSwedish = false } = {}) {
  if (!candidates || !candidates.length) return null;
  const src = (c) => (String(c.id).startsWith("slv-") ? " [Livsmedelsverket]" : String(c.id).startsWith("usda-") ? " [USDA]" : "");
  const list = candidates.slice(0, 40).map((c, i) => `${i}: ${c.name} (${Math.round(c.per100.kcal)} kcal/100 g)${src(c)}`).join("\n");
  const system =
    "Du väljer vilken rad i en livsmedelsdatabas som bäst motsvarar det användaren åt. Svara ENDAST med JSON: " +
    '{"index": number} där index är radens nummer. Välj ALLTID den mest sannolika raden — svara -1 bara om ingen rad alls är samma livsmedel. ' +
    PICK_RULES +
    (preferSwedish ? " Finns både en [Livsmedelsverket]-rad och en [USDA]-rad som passar lika bra, välj [Livsmedelsverket] (den har svenskt namn)." : "");
  const text = `Användaren skrev: "${userText}"${wantHint ? `\nDet som söks: ${wantHint}` : ""}\n\nRader:\n${list}`;
  const parsed = parseJsonLoose(await callAnthropic(system, text, 150));
  const i = Number(parsed.index);
  return Number.isInteger(i) && i >= 0 && i < candidates.length ? candidates[i] : null;
}

// andra sökord att prova när inget passar (t.ex. det svenska namnet för en engelsk sökning)
export async function aiAlternatives(userText) {
  const system =
    'Svara ENDAST med JSON: {"queries": [string]}. Ge 2–3 korta sökord för livsmedlet som det kan heta i en livsmedelsdatabas: ' +
    "minst ett på svenska och ett på engelska, med tillagningssätt om det är vanligt (t.ex. \"havregrynsgröt\", \"oats cooked\", \"ägg kokt\").";
  const parsed = parseJsonLoose(await callAnthropic(system, userText, 120));
  return (parsed.queries || []).map(String).filter(Boolean).slice(0, 3);
}

// ---------- vanliga livsmedel (tabellen common_foods) ----------
export function normalizeAlias(text) {
  return String(text || "").toLowerCase().normalize("NFC").replace(/[.,!?"]/g, " ").replace(/\s+/g, " ").trim();
}
function secretKey() {
  return process.env.SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY;
}
export async function supabase(path, { method = "GET", body, prefer } = {}) {
  const key = secretKey();
  const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }, 8000);
  if (!res.ok) throw new Error("Supabase " + res.status + ": " + (await res.text()).slice(0, 200));
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}
export async function fetchFoodById(id, lang) {
  const rows = await supabase(`foods?id=eq.${encodeURIComponent(id)}&select=*`);
  return rows && rows[0] ? rowToCandidate(rows[0], lang) : null;
}
// slår upp ett ord i listan över vanliga livsmedel. Returnerar raden eller null.
export async function aliasLookup(text, lang) {
  const a = normalizeAlias(text);
  if (!a) return null;
  const tries = [...new Set([a, singularize(a)])]; // listan innehåller bara riktiga ord, så "ri" träffar aldrig fel
  try {
    const rows = await supabase(`common_foods?alias=in.(${tries.map((t) => `"${t.replace(/"/g, "")}"`).join(",")})&select=alias,food_id`);
    if (!rows || !rows.length) return null;
    return await fetchFoodById(rows[0].food_id, lang);
  } catch (e) {
    console.error("[food] common_foods:", e.message);
    return null; // tabellen finns inte än → fortsätt som vanligt
  }
}

// söker i databasen + märkesvaror, slår ihop och sorterar
export async function searchAll(query, country, lang, { withOff = true } = {}) {
  const single = lang === "en" ? singularize(query) : query; // "ris" ska inte bli "ri"
  const dbErr = (e) => { console.error("[food] databasfel:", e.message); return []; };
  const [db, dbSingle, off] = await Promise.all([
    searchDatabase(query, country, lang).catch(dbErr),
    single !== query ? searchDatabase(single, country, lang).catch(dbErr) : Promise.resolve([]),
    withOff ? searchOpenFoodFacts(query, country, lang) : Promise.resolve([]),
  ]);
  const seen = new Set();
  const merged = [...dbSingle, ...db].filter((c) => (seen.has(c.id) ? false : seen.add(c.id)));
  return [...rerank(merged, single).slice(0, SHOW_LIMIT), ...off];
}

// hela kedjan: vanliga livsmedel → sökning + AI-val → andra sökord + AI-val
// returnerar { results, pick, via }  (via: "common" | "ai" | "ai-alt" | null)
export async function resolveFood({ query, original, country, lang }) {
  const common = await aliasLookup(query, lang);
  const results = await searchAll(query, country, lang);
  if (common) {
    return { results: [common, ...results.filter((r) => r.id !== common.id)], pick: common, via: "common" };
  }
  const userText = original || query;
  let pick = null;
  const pref = { preferSwedish: lang === "sv" };
  try { pick = results.length ? await aiPick(userText, results, "", pref) : null; } catch (e) { console.error("[food] aiPick:", e.message); }
  if (pick) return { results, pick, via: "ai" };
  // inget passade → prova andra sökord
  let extra = [];
  try {
    const alts = (await aiAlternatives(userText)).filter((q) => normalizeAlias(q) !== normalizeAlias(query));
    for (const q of alts) {
      const common2 = await aliasLookup(q, lang);
      if (common2) return { results: [common2, ...results], pick: common2, via: "common" };
      const more = await searchAll(q, country, lang, { withOff: false });
      if (!more.length) continue;
      const p = await aiPick(userText, more, "", pref);
      if (p) return { results: [...more, ...results.filter((r) => !more.some((m) => m.id === r.id))], pick: p, via: "ai-alt" };
      extra = [...extra, ...more];
    }
  } catch (e) { console.error("[food] alternativ:", e.message); }
  const seen = new Set();
  return { results: [...extra, ...results].filter((c) => (seen.has(c.id) ? false : seen.add(c.id))), pick: null, via: null };
}

export { searchDatabase, searchOpenFoodFacts, lookupBarcode, rerank, singularize, rowToCandidate, SUPABASE_URL };
