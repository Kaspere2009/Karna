// Fyller tabellen "foods" i Supabase med data från Livsmedelsverket och USDA.
// Öppna https://<din-sida>/api/import-foods i webbläsaren, skriv in ditt IMPORT_SECRET och tryck på knapparna.
// Kräver miljövariablerna SUPABASE_SECRET_KEY, IMPORT_SECRET och USDA_API_KEY i Vercel.

export const config = { maxDuration: 60 };

const SUPABASE_URL = "https://clwdczzwsvowsfpaijjm.supabase.co";
const SLV_API = "https://dataportal.livsmedelsverket.se/livsmedel/api/v1";
const SLV_BATCH = 40;     // livsmedel per anrop (varje livsmedel kräver ett eget näringsvärdes-anrop)
const USDA_PAGE = 200;    // livsmedel per anrop

// ---------- hjälpfunktioner ----------
const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const TO_MG = { g: 1000, mg: 1, "µg": 0.001, ug: 0.001, mcg: 0.001 };

function convertMass(value, fromUnit, toUnit) {
  const f = TO_MG[String(fromUnit || "").toLowerCase()];
  if (f === undefined || typeof value !== "number") return null;
  const mg = value * f;
  return toUnit === "µg" ? mg * 1000 : toUnit === "g" ? mg / 1000 : mg;
}

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch (e) { /* försök igen */ }
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  throw new Error("Kunde inte hämta " + url.split("?")[0]);
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

async function upsertFoods(rows) {
  const key = process.env.SUPABASE_SECRET_KEY;
  for (let i = 0; i < rows.length; i += 200) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/foods`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows.slice(i, i + 200)),
    });
    if (!res.ok) throw new Error("Supabase svarade " + res.status + ": " + (await res.text()));
  }
}

// ---------- Livsmedelsverket ----------
// förkortning → [appens fält, appens enhet]
const SLV_MACROS = { PROT: "protein_g", CHO: "carbs_g", SUGAR: "sugar_g", FIBT: "fiber_g", FAT: "fat_g", FASAT: "satfat_g", FATRN: "transfat_g" };
const SLV_MICROS = {
  VITA: ["vit_a", "µg"], VITD: ["vit_d", "µg"], VITE: ["vit_e", "mg"], VITK: ["vit_k", "µg"], VITC: ["vit_c", "mg"],
  THIACLHCL: ["b1", "mg"], THIA: ["b1", "mg"], RIBF: ["b2", "mg"], NIA: ["b3", "mg"], VITB6: ["b6", "mg"],
  FOL: ["b9", "µg"], VITB12: ["b12", "µg"],
  CA: ["calcium", "mg"], FE: ["iron", "mg"], MG: ["magnesium", "mg"], K: ["potassium", "mg"], P: ["phosphorus", "mg"],
  ZN: ["zinc", "mg"], SE: ["selenium", "µg"], ID: ["iodine", "µg"], NA: ["sodium", "mg"],
  // "bra ämnen"
  "F20:5": ["epa", "mg"], "F22:6": ["dha", "mg"], "F22:5": ["dpa", "mg"], "F18:3": ["ala", "mg"],
  CARTBTOT: ["beta_carotene", "µg"], CARTB: ["beta_carotene", "µg"], WHOLET: ["wholegrain", "g"],
  // fler värden
  "F18:2": ["la", "mg"], "F20:4": ["aa", "mg"], CHORL: ["cholesterol", "mg"], FAMS: ["mufa", "g"], FAPU: ["pufa", "g"],
  SUGAD: ["added_sugar", "g"], ALC: ["alcohol", "g"], WATER: ["water", "g"],
};

// slår ihop fettsyrorna till omega-3 (ALA + EPA + DHA) och EPA + DHA
function finishBonus(micros) {
  const { epa, dha, dpa, ala, la, aa } = micros;
  if (epa !== undefined || dha !== undefined || ala !== undefined || dpa !== undefined) {
    micros.omega3 = round((epa || 0) + (dha || 0) + (dpa || 0) + (ala || 0));
    micros.epa_dha = round((epa || 0) + (dha || 0));
  }
  if (la !== undefined || aa !== undefined) micros.omega6 = round((la || 0) + (aa || 0));
  delete micros.epa; delete micros.dha; delete micros.dpa; delete micros.ala; delete micros.la; delete micros.aa;
  return micros;
}

function slvRow(nummer, nameSv, nameEn, naringsvarden) {
  const row = {
    id: `slv-${nummer}`, source: "slv", country: "SE",
    name_sv: nameSv || null, name_en: nameEn || null,
    search_text: [nameSv, nameEn].filter(Boolean).join(" | ").toLowerCase(),
    kcal: 0, protein_g: 0, carbs_g: 0, sugar_g: 0, fiber_g: 0, fat_g: 0, satfat_g: 0, transfat_g: 0,
    micros: {}, updated_at: new Date().toISOString(),
  };
  for (const n of naringsvarden || []) {
    if (typeof n.varde !== "number") continue;
    const code = n.forkortning;
    const unit = String(n.enhet || "").split("/").pop(); // "RE/µg" → "µg"
    if (code === "ENERC" && String(n.enhet).toLowerCase() === "kcal") row.kcal = n.varde;
    else if (SLV_MACROS[code]) row[SLV_MACROS[code]] = Math.max(0, n.varde);
    else if (SLV_MICROS[code]) {
      const [key, appUnit] = SLV_MICROS[code];
      const v = convertMass(n.varde, unit, appUnit);
      if (v !== null && v >= 0 && row.micros[key] === undefined) row.micros[key] = round(v);
    }
  }
  finishBonus(row.micros);
  return row;
}

async function importSlv(offset) {
  const [sv, en] = await Promise.all([
    getJson(`${SLV_API}/livsmedel?offset=${offset}&limit=${SLV_BATCH}&sprak=1`),
    getJson(`${SLV_API}/livsmedel?offset=${offset}&limit=${SLV_BATCH}&sprak=2`),
  ]);
  const foods = (sv && sv.livsmedel) || [];
  const total = sv && sv._meta ? sv._meta.totalRecords : 0;
  const enNames = Object.fromEntries(((en && en.livsmedel) || []).map((f) => [f.nummer, f.namn]));

  const rows = await mapLimit(foods, 8, async (f) => {
    const nv = await getJson(`${SLV_API}/livsmedel/${f.nummer}/naringsvarden?sprak=2`);
    return slvRow(f.nummer, (f.namn || "").trim(), (enNames[f.nummer] || "").trim(), nv);
  });
  if (rows.length) await upsertFoods(rows);

  const nextCursor = offset + foods.length;
  return { imported: rows.length, nextCursor, total, done: foods.length === 0 || nextCursor >= total };
}

// ---------- USDA (SR Legacy, ca 7 800 vanliga livsmedel) ----------
// nutrientnummer → appens fält/nyckel och enhet
const USDA_MACROS = { "203": "protein_g", "205": "carbs_g", "269": "sugar_g", "291": "fiber_g", "204": "fat_g", "606": "satfat_g", "605": "transfat_g" };
const USDA_MICROS = {
  "320": ["vit_a", "µg"], "328": ["vit_d", "µg"], "323": ["vit_e", "mg"], "430": ["vit_k", "µg"], "401": ["vit_c", "mg"],
  "404": ["b1", "mg"], "405": ["b2", "mg"], "406": ["b3", "mg"], "410": ["b5", "mg"], "415": ["b6", "mg"],
  "435": ["b9", "µg"], "418": ["b12", "µg"], "421": ["choline", "mg"],
  "301": ["calcium", "mg"], "303": ["iron", "mg"], "304": ["magnesium", "mg"], "305": ["phosphorus", "mg"],
  "306": ["potassium", "mg"], "307": ["sodium", "mg"], "309": ["zinc", "mg"], "312": ["copper", "mg"],
  "315": ["manganese", "mg"], "317": ["selenium", "µg"], "313": ["fluoride", "mg"],
  // "bra ämnen"
  "629": ["epa", "mg"], "621": ["dha", "mg"], "631": ["dpa", "mg"], "851": ["ala", "mg"], "619": ["ala", "mg"],
  "321": ["beta_carotene", "µg"], "337": ["lycopene", "µg"], "338": ["lutein", "µg"],
  // fler värden
  "618": ["la", "mg"], "855": ["aa", "mg"], "601": ["cholesterol", "mg"], "645": ["mufa", "g"], "646": ["pufa", "g"],
  "262": ["caffeine", "mg"], "263": ["theobromine", "mg"], "221": ["alcohol", "g"], "255": ["water", "g"],
  // essentiella aminosyror
  "501": ["trp", "mg"], "502": ["thr", "mg"], "503": ["ile", "mg"], "504": ["leu", "mg"], "505": ["lys", "mg"],
  "506": ["met", "mg"], "508": ["phe", "mg"], "510": ["val", "mg"], "512": ["his", "mg"],
};

function usdaRow(food) {
  const name = (food.description || "").trim();
  const row = {
    id: `usda-${food.fdcId}`, source: "usda", country: null,
    name_sv: null, name_en: name, search_text: name.toLowerCase(),
    kcal: 0, protein_g: 0, carbs_g: 0, sugar_g: 0, fiber_g: 0, fat_g: 0, satfat_g: 0, transfat_g: 0,
    micros: {}, updated_at: new Date().toISOString(),
  };
  for (const n of food.foodNutrients || []) {
    const num = String(n.number ?? n.nutrientNumber ?? (n.nutrient && n.nutrient.number) ?? "");
    const value = n.amount ?? n.value;
    const unit = String(n.unitName ?? (n.nutrient && n.nutrient.unitName) ?? "");
    if (typeof value !== "number") continue;
    if (num === "208" && unit.toUpperCase() === "KCAL") row.kcal = value;
    else if (USDA_MACROS[num]) row[USDA_MACROS[num]] = Math.max(0, value);
    else if (USDA_MICROS[num]) {
      const [key, appUnit] = USDA_MICROS[num];
      const v = convertMass(value, unit, appUnit);
      if (v !== null && v >= 0 && (row.micros[key] === undefined || num !== "619")) row.micros[key] = round(v);
    }
  }
  finishBonus(row.micros);
  return row;
}

// USDA:s lista skickar en förkortad version utan fettsyror/karotenoider — de hämtas separat, 20 livsmedel per anrop
const USDA_BONUS_NUMBERS = [ // max 25 per anrop
  629, 621, 631, 851, 321, 337, 338,
  618, 855, 601, 645, 646, 262, 263, 221, 255,
  501, 502, 503, 504, 505, 506, 508, 510, 512,
];

async function fetchUsdaBonus(ids, key) {
  const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods?api_key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fdcIds: ids, format: "abridged", nutrients: USDA_BONUS_NUMBERS }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function importUsda(page) {
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const data = await getJson(
    `https://api.nal.usda.gov/fdc/v1/foods/list?dataType=SR%20Legacy&pageSize=${USDA_PAGE}&pageNumber=${page}&api_key=${key}`
  );
  const foods = Array.isArray(data) ? data : [];

  // komplettera varje livsmedel med omega-3, betakaroten, lykopen och lutein
  const ids = foods.filter((f) => f.fdcId).map((f) => f.fdcId);
  const chunks = [];
  for (let i = 0; i < ids.length; i += 20) chunks.push(ids.slice(i, i + 20));
  const extra = (await mapLimit(chunks, 5, (c) => fetchUsdaBonus(c, key).catch(() => []))).flat();
  const extraById = new Map(extra.map((f) => [f.fdcId, f.foodNutrients || []]));
  foods.forEach((f) => {
    const more = extraById.get(f.fdcId);
    if (more && more.length) f.foodNutrients = [...(f.foodNutrients || []), ...more];
  });

  const rows = foods.filter((f) => f.fdcId && f.description).map(usdaRow);
  if (rows.length) await upsertFoods(rows);
  return { imported: rows.length, nextCursor: page + 1, done: foods.length < USDA_PAGE };
}

// ---------- adminsida ----------
const PAGE = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>kärna – import av livsmedel</title>
<style>body{font-family:system-ui,sans-serif;background:#0e1913;color:#f1f4ee;max-width:640px;margin:40px auto;padding:0 20px}
input,button{font-size:15px;padding:10px 14px;border-radius:10px;border:1px solid #2c3a30;background:#16231b;color:#f1f4ee}
button{background:#8fd9a8;color:#0c1f14;font-weight:600;cursor:pointer;margin:6px 6px 0 0;border:none}
button:disabled{opacity:.5}#log{margin-top:20px;white-space:pre-wrap;font-family:monospace;font-size:13px;color:#9aa79c}</style></head>
<body><h2>Import av livsmedel</h2>
<p>Skriv in ditt IMPORT_SECRET och tryck på en knapp i taget. Låt fliken vara öppen tills det står <b>Klart</b>.</p>
<input id="secret" type="password" placeholder="IMPORT_SECRET" style="width:100%;box-sizing:border-box"><br>
<button onclick="run('slv')">1. Importera Livsmedelsverket</button>
<button onclick="run('usda')">2. Importera USDA</button>
<div id="log"></div>
<script>
const log=(t)=>{const el=document.getElementById('log');el.textContent+=t+"\\n";window.scrollTo(0,document.body.scrollHeight);};
async function run(source){
  const secret=document.getElementById('secret').value.trim();
  if(!secret){alert('Skriv in IMPORT_SECRET först');return;}
  document.querySelectorAll('button').forEach(b=>b.disabled=true);
  let cursor=source==='usda'?1:0, total=0, errors=0;
  log('Startar '+(source==='usda'?'USDA':'Livsmedelsverket')+'…');
  while(true){
    try{
      const r=await fetch('/api/import-foods?source='+source+'&cursor='+cursor,{headers:{'x-import-secret':secret}});
      const d=await r.json();
      if(!r.ok){log('Fel: '+(d.error||r.status));if(r.status===401)break;if(++errors>5)break;await new Promise(s=>setTimeout(s,3000));continue;}
      errors=0; total+=d.imported;
      log('  '+total+' livsmedel inlagda'+(d.total?' av '+d.total:''));
      if(d.done){log('Klart! '+total+' livsmedel från '+(source==='usda'?'USDA':'Livsmedelsverket')+'.');break;}
      cursor=d.nextCursor;
    }catch(e){log('Nätverksfel, försöker igen…');if(++errors>5)break;await new Promise(s=>setTimeout(s,3000));}
  }
  document.querySelectorAll('button').forEach(b=>b.disabled=false);
}
</script></body></html>`;

export default async function handler(req, res) {
  const { source, cursor } = req.query || {};
  if (!source) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(PAGE);
  }
  if (!process.env.IMPORT_SECRET || req.headers["x-import-secret"] !== process.env.IMPORT_SECRET) {
    return res.status(401).json({ error: "Fel IMPORT_SECRET (eller så är den inte inlagd i Vercel)." });
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    return res.status(500).json({ error: "SUPABASE_SECRET_KEY saknas i Vercel." });
  }
  try {
    if (source === "slv") return res.status(200).json(await importSlv(Number(cursor) || 0));
    if (source === "usda") return res.status(200).json(await importUsda(Number(cursor) || 1));
    return res.status(400).json({ error: "Okänd källa." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
