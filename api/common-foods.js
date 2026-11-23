// api/common-foods.js — adminsida för listan med vanliga livsmedel.
// Öppna https://<din-sida>/api/common-foods, skriv in ditt IMPORT_SECRET och:
//   1. "Bygg listan"  — kopplar varje vanligt livsmedel till rätt rad i databasen (AI väljer en gång, sparas i common_foods)
//   2. "Kör testet"   — kör ~100 vanliga inmatningar genom exakt samma kod som appen och visar vad som väljs
// Kräver SUPABASE_SECRET_KEY, IMPORT_SECRET och ANTHROPIC_API_KEY i Vercel, och tabellen common_foods (se SQL).

import { COMMON } from "./_lib/common-list.js";
import { searchAll, aiPick, normalizeAlias, supabase, resolveFood } from "./_lib/food.js";

export const config = { maxDuration: 60 };
const BUILD_BATCH = 4;
const TEST_BATCH = 4;

// ---------- testfall: [språk, det användaren skrev, sökordet efter att mängden tagits bort] ----------
const TESTS = [
  ["sv", "2 ägg", "ägg"], ["sv", "ägg", "ägg"], ["en", "2 eggs", "eggs"], ["en", "boiled egg", "boiled egg"],
  ["en", "scrambled eggs", "scrambled eggs"], ["sv", "stekt ägg", "stekt ägg"],
  ["sv", "ett glas mjölk", "mjölk"], ["en", "a glass of milk", "milk"], ["sv", "havremjölk", "havremjölk"], ["en", "oat milk", "oat milk"],
  ["sv", "en skål havregrynsgröt", "havregrynsgröt"], ["en", "a bowl of oatmeal", "oatmeal"], ["en", "porridge", "porridge"],
  ["sv", "havregryn 40 g", "havregryn"], ["en", "40 g oats", "oats"],
  ["sv", "150 g ris", "ris"], ["en", "150 g rice", "rice"], ["en", "brown rice", "brown rice"], ["sv", "basmatiris", "basmatiris"],
  ["sv", "pasta 200 g", "pasta"], ["en", "200 g pasta", "pasta"], ["en", "spaghetti", "spaghetti"],
  ["sv", "kycklingfilé 150 g", "kycklingfilé"], ["en", "150 g chicken breast", "chicken breast"], ["en", "grilled chicken", "grilled chicken"],
  ["sv", "kyckling", "kyckling"], ["sv", "kycklinglår", "kycklinglår"],
  ["sv", "nötfärs", "nötfärs"], ["en", "ground beef", "ground beef"], ["en", "steak", "steak"], ["sv", "lax", "lax"], ["en", "salmon", "salmon"],
  ["sv", "tonfisk", "tonfisk"], ["en", "tuna", "tuna"], ["sv", "räkor", "räkor"], ["sv", "köttbullar", "köttbullar"], ["en", "bacon", "bacon"],
  ["sv", "banan", "banan"], ["en", "banana", "banana"], ["sv", "2 äpplen", "äpplen"], ["en", "an apple", "apple"],
  ["sv", "blåbär", "blåbär"], ["en", "strawberries", "strawberries"], ["sv", "apelsin", "apelsin"], ["en", "grapes", "grapes"],
  ["sv", "broccoli", "broccoli"], ["sv", "gurka", "gurka"], ["en", "cherry tomatoes", "cherry tomatoes"], ["en", "avocado", "avocado"],
  ["sv", "potatis", "potatis"], ["en", "potatoes", "potatoes"], ["en", "fries", "fries"], ["sv", "sötpotatis", "sötpotatis"],
  ["sv", "knäckebröd", "knäckebröd"], ["sv", "2 skivor bröd", "bröd"], ["en", "toast", "toast"], ["en", "bagel", "bagel"],
  ["sv", "ost", "ost"], ["en", "cheese", "cheese"], ["sv", "keso", "keso"], ["en", "greek yogurt", "greek yogurt"], ["sv", "kvarg", "kvarg"],
  ["sv", "smör", "smör"], ["en", "peanut butter", "peanut butter"], ["sv", "mandlar", "mandlar"], ["en", "olive oil", "olive oil"],
  ["sv", "kaffe", "kaffe"], ["en", "coffee", "coffee"], ["en", "latte", "latte"], ["sv", "te", "te"], ["en", "orange juice", "orange juice"],
  ["sv", "läsk", "läsk"], ["en", "coke zero", "coke zero"], ["sv", "öl", "öl"], ["en", "beer", "beer"], ["en", "red wine", "red wine"],
  ["sv", "mörk choklad", "mörk choklad"], ["en", "ice cream", "ice cream"], ["sv", "kanelbulle", "kanelbulle"], ["en", "chips", "chips"],
  ["sv", "pizza", "pizza"], ["en", "burger", "burger"], ["sv", "kebab", "kebab"], ["en", "sushi", "sushi"],
  ["sv", "spagetti bolognese", "spagetti bolognese"], ["en", "spaghetti bolognese", "spaghetti bolognese"], ["sv", "tacos", "tacos"],
  ["sv", "pannkakor", "pannkakor"], ["en", "pancakes", "pancakes"],
  // utanför listan — här får AI:n välja
  ["sv", "halloumi", "halloumi"], ["sv", "falafel", "falafel"], ["sv", "skyr", "skyr"], ["sv", "fiskgratäng", "fiskgratäng"],
  ["sv", "pasta carbonara", "pasta carbonara"], ["sv", "korvstroganoff", "korvstroganoff"], ["en", "mac and cheese", "mac and cheese"],
  ["en", "chicken nuggets", "chicken nuggets"], ["en", "turkey sandwich", "turkey sandwich"], ["en", "greek salad", "greek salad"],
  ["en", "overnight oats", "overnight oats"], ["en", "avocado toast", "avocado toast"], ["sv", "oliver", "oliver"], ["sv", "kokosvatten", "kokosvatten"],
];

const PAGE = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DOT – vanliga livsmedel</title>
<style>body{font-family:system-ui,sans-serif;background:#0e1913;color:#f1f4ee;max-width:900px;margin:30px auto;padding:0 16px}
input,button{font-size:15px;padding:10px 14px;border-radius:10px;border:1px solid #2c3a30;background:#16231b;color:#f1f4ee}
button{background:#8fd9a8;color:#0c1f14;font-weight:600;cursor:pointer;margin:6px 6px 0 0;border:none}button:disabled{opacity:.5}
#log{margin-top:14px;font-family:monospace;font-size:13px;color:#9aa79c;white-space:pre-wrap}
table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}td,th{text-align:left;padding:6px 6px;border-bottom:1px solid #2c3a30;vertical-align:top}
th{color:#8fd9a8}.bad{color:#f28c8c}.common{color:#8fd9a8}.ai{color:#f2c063}.muted{color:#7d8a80}</style></head>
<body><h2>Vanliga livsmedel</h2>
<p>Skriv in ditt IMPORT_SECRET. <b>1.</b> Bygg listan (en gång, och igen om listan ändras). <b>2.</b> Kör testet och skicka en skärmdump.</p>
<input id="secret" type="password" placeholder="IMPORT_SECRET" style="width:100%;box-sizing:border-box"><br>
<button onclick="run('build')">1. Bygg listan</button><button onclick="run('test')">2. Kör testet</button>
<div id="log"></div><table id="tbl"></table>
<script>
const log=(t)=>{document.getElementById('log').textContent=t;};
const esc=(s)=>String(s??'').replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function run(action){
  const secret=document.getElementById('secret').value.trim(); if(!secret){alert('Skriv in IMPORT_SECRET först');return;}
  document.querySelectorAll('button').forEach(b=>b.disabled=true);
  const tbl=document.getElementById('tbl');
  tbl.innerHTML= action==='build'
    ? '<tr><th>#</th><th>Livsmedel</th><th>Vald rad i databasen</th><th>kcal/100 g</th></tr>'
    : '<tr><th>Språk</th><th>Inmatning</th><th>Hur</th><th>Vald rad</th><th>kcal/100 g</th></tr>';
  let cursor=0, n=0, bad=0, errors=0;
  while(true){
    try{
      const r=await fetch('/api/common-foods?action='+action+'&cursor='+cursor,{headers:{'x-import-secret':secret}});
      const d=await r.json();
      if(!r.ok){log('Fel: '+(d.error||r.status)); if(r.status===401||++errors>3) break; continue;}
      for(const row of d.rows){
        n++;
        if(action==='build'){
          if(!row.food) bad++;
          tbl.insertAdjacentHTML('beforeend','<tr><td class="muted">'+n+'</td><td>'+esc(row.entry)+'</td><td class="'+(row.food?'':'bad')+'">'+esc(row.food||'INGEN TRÄFF')+'</td><td>'+esc(row.kcal??'')+'</td></tr>');
        } else {
          if(!row.food) bad++;
          const how=row.via==='common'?'<span class="common">listan</span>':row.via?'<span class="ai">AI</span>':'<span class="bad">du väljer</span>';
          tbl.insertAdjacentHTML('beforeend','<tr><td class="muted">'+row.lang+'</td><td>'+esc(row.text)+'</td><td>'+how+'</td><td class="'+(row.food?'':'bad')+'">'+esc(row.food||'—')+'</td><td>'+esc(row.kcal??'')+'</td></tr>');
        }
      }
      log((action==='build'?'Bygger… ':'Testar… ')+n+' av '+d.total+(bad?' · '+bad+' utan träff':''));
      if(d.done){log('Klart! '+n+' st'+(bad?' · '+bad+' utan träff':' · alla fick en träff')+'.');break;}
      cursor=d.next; errors=0;
    }catch(e){log('Nätverksfel, försöker igen…'); if(++errors>3) break; await new Promise(s=>setTimeout(s,2000));}
  }
  document.querySelectorAll('button').forEach(b=>b.disabled=false);
}
</script></body></html>`;

async function buildEntry([sv, en, want]) {
  const [a, b, c] = await Promise.all([
    searchAll(sv[0], "SE", "sv", { withOff: false }),
    searchAll(en[0], null, "en", { withOff: false }),
    sv[1] ? searchAll(sv[1], "SE", "sv", { withOff: false }) : Promise.resolve([]),
  ]);
  const seen = new Set();
  const candidates = [...a, ...c, ...b].filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));
  const pick = await aiPick(`${sv[0]} / ${en[0]}`, candidates, want);
  if (pick) {
    const rows = [...new Set([...sv, ...en].map(normalizeAlias))].map((alias) => ({
      alias, entry: sv[0], food_id: pick.id, food_name: pick.name, kcal: Math.round(pick.per100.kcal), updated_at: new Date().toISOString(),
    }));
    await supabase("common_foods", { method: "POST", body: rows, prefer: "resolution=merge-duplicates,return=minimal" });
  }
  return { entry: `${sv[0]} / ${en[0]}`, food: pick ? pick.name : null, kcal: pick ? Math.round(pick.per100.kcal) : null };
}

async function runTest([lang, text, query]) {
  const r = await resolveFood({ query, original: text, country: lang === "sv" ? "SE" : null, lang });
  return { lang, text, via: r.via, food: r.pick ? r.pick.name : null, kcal: r.pick ? Math.round(r.pick.per100.kcal) : null };
}

export default async function handler(req, res) {
  const { action, cursor } = req.query || {};
  if (!action) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(PAGE);
  }
  if (!process.env.IMPORT_SECRET || req.headers["x-import-secret"] !== process.env.IMPORT_SECRET) {
    return res.status(401).json({ error: "Fel IMPORT_SECRET (eller så är den inte inlagd i Vercel)." });
  }
  if (!process.env.SUPABASE_SECRET_KEY) return res.status(500).json({ error: "SUPABASE_SECRET_KEY saknas i Vercel." });
  const start = Number(cursor) || 0;
  try {
    if (action === "build") {
      const batch = COMMON.slice(start, start + BUILD_BATCH);
      const rows = await Promise.all(batch.map((e) => buildEntry(e).catch((err) => ({ entry: e[0][0], food: null, error: err.message }))));
      const next = start + batch.length;
      return res.status(200).json({ rows, next, total: COMMON.length, done: next >= COMMON.length });
    }
    if (action === "test") {
      const batch = TESTS.slice(start, start + TEST_BATCH);
      const rows = await Promise.all(batch.map((t) => runTest(t).catch((err) => ({ lang: t[0], text: t[1], food: null, error: err.message }))));
      const next = start + batch.length;
      return res.status(200).json({ rows, next, total: TESTS.length, done: next >= TESTS.length });
    }
    return res.status(400).json({ error: "Okänd åtgärd." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
