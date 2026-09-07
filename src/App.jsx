aimport { useState, useRef, useEffect } from "react";
import {
  Terminal, Camera, Keyboard, Loader2, Send, Sparkles,
  Check, X, ChevronRight, ChevronLeft, Flame, Dot, ChevronDown, Mail, LayoutGrid, TrendingUp, Home,
  CalendarDays, BookOpen, Plus, Trash2, Settings, User, Crown, Ruler, Bell, ShieldCheck, HelpCircle, Info, LogOut
} from "lucide-react";

// fields the user can optionally fill in per 100g, matching a package label
const KNOWN_FIELDS = [
  { key: "kcal", label: "Kalorier", unit: "kcal" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "carbs_g", label: "Kolhydrater", unit: "g" },
  { key: "sugar_g", label: "varav sockerarter", unit: "g", sub: true },
  { key: "fiber_g", label: "varav fibrer", unit: "g", sub: true },
  { key: "fat_g", label: "Fett", unit: "g" },
  { key: "satfat_g", label: "varav mättat", unit: "g", sub: true },
  { key: "transfat_g", label: "varav transfett", unit: "g", sub: true },
];

// ---------- design tokens ----------
const C = {
  bg: "#0B1712",
  bgGradient: "radial-gradient(120% 90% at 15% 0%, #1c2e22 0%, #0e1913 45%, #0a120e 100%)",
  surface: "rgba(255,255,255,0.045)",
  surfaceRaised: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#F1F4EE",
  textDim: "#9AA79C",
  textFaint: "#5F6D62",
  accent: "#8FD9A8",         // soft mint-green — primary
  accentDim: "rgba(143,217,168,0.14)",
  estimate: "#F2C063",       // warm amber — "AI estimated"
  estimateDim: "rgba(242,192,99,0.14)",
  vitamin: "#B9A6F2",        // violet — vitamins page
  vitaminDim: "rgba(185,166,242,0.14)",
  mineral: "#F2A93B",        // amber — minerals page
  mineralDim: "rgba(242,169,59,0.14)",
  bonus: "#F28FA3",          // rose — bonus substances page
  bonusDim: "rgba(242,143,163,0.14)",
  // reference-inspired macro ring colors
  ringKcal: "#6FA8F5",
  ringProtein: "#FF7A56",
  ringCarbs: "#F2B23B",
  ringFat: "#7ED08A",
};

function dateKey(d) { return d.toISOString().slice(0, 10); }
function getMonday(d) { const day = d.getDay() || 7; const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(d.getDate() - day + 1); return m; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtDayNum(d) { return d.getDate(); }

// weight/height are always stored internally in kg/cm — these only convert for display & input
function kgToLbs(kg) { return Math.round(kg * 2.20462 * 10) / 10; }
function lbsToKg(lbs) { return Math.round((lbs / 2.20462) * 10) / 10; }
function cmToIn(cm) { return Math.round((cm / 2.54) * 10) / 10; }
function inToCm(inch) { return Math.round(inch * 2.54 * 10) / 10; }
function displayWeight(kg, unit) { if (kg === "" || kg === undefined || isNaN(Number(kg))) return ""; return unit === "lbs" ? kgToLbs(Number(kg)) : Number(kg); }
function displayHeight(cm, unit) { if (cm === "" || cm === undefined || isNaN(Number(cm))) return ""; return unit === "ft" ? cmToIn(Number(cm)) : Number(cm); }
function parseWeightInput(val, unit) { const n = Number(val); if (isNaN(n)) return ""; return String(unit === "lbs" ? lbsToKg(n) : n); }
function parseHeightInput(val, unit) { const n = Number(val); if (isNaN(n)) return ""; return String(unit === "ft" ? inToCm(n) : n); }

// ---------- Supabase (via REST API — no SDK needed) ----------
const SUPABASE_URL = "https://clwdczzwsvowsfpaijjm.supabase.co";
const SUPABASE_KEY = "sb_publishable_DJZHyFLJcCW3Ii4HlXgjOw_rbEZkh4s";

async function supabaseAuth(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || data.error || "Något gick fel med kontot.");
  return data;
}

async function supabaseRest(path, { method = "GET", body, accessToken, params, upsert } = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_KEY}`,
  };
  if (method === "POST" || method === "PATCH") headers.Prefer = upsert ? "resolution=merge-duplicates,return=representation" : "return=representation";
  const res = await fetch(url.toString(), { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Kunde inte nå databasen.");
  }
  if (res.status === 204) return null;
  return res.json();
}

const glass = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 12px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
};

const DAILY_TARGETS = { kcal: 2400, protein_g: 150, carbs_g: 280, fat_g: 80 };

// canonical lists — always shown in full on the dashboard, even at 0
const VITAMINS = [
  { key: "vit_a", name: "Vitamin A", unit: "µg", rdi: 800, blurb: "Viktigt för syn, hud och immunförsvar." },
  { key: "vit_c", name: "Vitamin C", unit: "mg", rdi: 80, blurb: "Antioxidant som stöttar immunförsvar och kollagenbildning." },
  { key: "vit_d", name: "Vitamin D", unit: "µg", rdi: 5, blurb: "Viktigt för kalciumupptag och starka ben." },
  { key: "vit_e", name: "Vitamin E", unit: "mg", rdi: 12, blurb: "Antioxidant som skyddar celler mot oxidativ stress." },
  { key: "vit_k", name: "Vitamin K", unit: "µg", rdi: 75, blurb: "Behövs för blodkoagulering och benhälsa." },
  { key: "b1", name: "B1 (Tiamin)", unit: "mg", rdi: 1.1, blurb: "Hjälper kroppen omvandla mat till energi." },
  { key: "b2", name: "B2 (Riboflavin)", unit: "mg", rdi: 1.4, blurb: "Viktigt för energiproduktion och cellfunktion." },
  { key: "b3", name: "B3 (Niacin)", unit: "mg", rdi: 16, blurb: "Stöttar ämnesomsättning och nervsystem." },
  { key: "b5", name: "B5 (Pantotensyra)", unit: "mg", rdi: 6, blurb: "Hjälper till att bryta ner fett och kolhydrater till energi." },
  { key: "b6", name: "B6", unit: "mg", rdi: 1.4, blurb: "Viktigt för protein-ämnesomsättning och immunförsvar." },
  { key: "b7", name: "B7 (Biotin)", unit: "µg", rdi: 50, blurb: "Stöttar hår, hud och ämnesomsättning." },
  { key: "b9", name: "B9 (Folat)", unit: "µg", rdi: 200, blurb: "Viktigt för celldelning, extra viktigt vid graviditet." },
  { key: "b12", name: "B12", unit: "µg", rdi: 2.5, blurb: "Behövs för nervsystem och röda blodkroppar." },
  { key: "choline", name: "Kolin", unit: "mg", rdi: 400, blurb: "Viktigt för lever-, muskel- och hjärnfunktion." },
];
const MINERALS = [
  { key: "calcium", name: "Kalcium", unit: "mg", rdi: 800, blurb: "Bygger och underhåller starka ben och tänder." },
  { key: "iron", name: "Järn", unit: "mg", rdi: 14, blurb: "Behövs för att bilda röda blodkroppar och transportera syre." },
  { key: "magnesium", name: "Magnesium", unit: "mg", rdi: 375, blurb: "Viktigt för muskel- och nervfunktion." },
  { key: "zinc", name: "Zink", unit: "mg", rdi: 10, blurb: "Stöttar immunförsvar och sårläkning." },
  { key: "potassium", name: "Kalium", unit: "mg", rdi: 2000, blurb: "Reglerar vätskebalans och muskelfunktion, inklusive hjärtat." },
  { key: "phosphorus", name: "Fosfor", unit: "mg", rdi: 700, blurb: "Bygger ben och tänder, viktigt för energiomsättning." },
  { key: "selenium", name: "Selen", unit: "µg", rdi: 55, blurb: "Antioxidant som skyddar celler och stöttar sköldkörteln." },
  { key: "copper", name: "Koppar", unit: "mg", rdi: 1, blurb: "Behövs för bindväv och järnomsättning." },
  { key: "manganese", name: "Mangan", unit: "mg", rdi: 2, blurb: "Stöttar benbildning och ämnesomsättning." },
  { key: "iodine", name: "Jod", unit: "µg", rdi: 150, blurb: "Behövs för att bilda sköldkörtelhormoner." },
  { key: "sodium", name: "Natrium", unit: "mg", rdi: 2400, blurb: "Reglerar vätskebalans och nervsignaler, men lätt att få i överflöd." },
  { key: "chloride", name: "Klorid", unit: "mg", rdi: 2300, blurb: "Hjälper till att reglera vätskebalans och bildar magsyra." },
  { key: "chromium", name: "Krom", unit: "µg", rdi: 40, blurb: "Kan stötta insulinets funktion och blodsockerreglering." },
  { key: "molybdenum", name: "Molybden", unit: "µg", rdi: 50, blurb: "Behövs som kofaktor i flera viktiga enzymer." },
  { key: "fluoride", name: "Fluorid", unit: "mg", rdi: 3, blurb: "Stärker tandemaljen och motverkar karies." },
  { key: "sulfur", name: "Svavel", unit: "mg", rdi: 900, blurb: "Ingår i aminosyror och behövs för protein- och bindvävsuppbyggnad." },
  { key: "cobalt", name: "Kobolt", unit: "µg", rdi: 5, blurb: "Ingår i B12-molekylen och behövs för nervsystem och blodbildning." },
  { key: "boron", name: "Bor", unit: "mg", rdi: 1, blurb: "Kan stötta benhälsa och kalciumomsättning. Inget officiellt fastställt RDI, värdet är en uppskattad rimlig nivå." },
  { key: "nickel", name: "Nickel", unit: "µg", rdi: 35, blurb: "Ultra-trace-mineral, misstänkt roll i vissa enzymfunktioner. Inget officiellt fastställt RDI, värdet är en uppskattad rimlig nivå." },
];
const MICRO_KEYS = [...VITAMINS, ...MINERALS].map((m) => m.key);

const HEALTH_CATEGORIES = [
  { key: "energi", label: "Energi", emoji: "⚡", color: "#F2C063",
    blurb: "Baserat på järn, B-vitaminer och kolhydrater mot ditt dagsmål.",
    factors: [{ t: "mineral", k: "iron" }, { t: "vitamin", k: "b1" }, { t: "vitamin", k: "b2" }, { t: "vitamin", k: "b3" }, { t: "vitamin", k: "b12" }, { t: "macro", k: "carbs_g" }] },
  { key: "maende", label: "Mående", emoji: "😊", color: "#8FD9A8",
    blurb: "Baserat på D-vitamin, B6, folat och magnesium.",
    factors: [{ t: "vitamin", k: "vit_d" }, { t: "vitamin", k: "b6" }, { t: "vitamin", k: "b9" }, { t: "mineral", k: "magnesium" }] },
  { key: "somn", label: "Sömn", emoji: "😴", color: "#7FA8D9",
    blurb: "Baserat på magnesium, kalcium och B6.",
    factors: [{ t: "mineral", k: "magnesium" }, { t: "mineral", k: "calcium" }, { t: "vitamin", k: "b6" }] },
  { key: "hjarna", label: "Hjärna & fokus", emoji: "🧠", color: "#C08FE0",
    blurb: "Baserat på B12, järn, D-vitamin, zink och kolin.",
    factors: [{ t: "vitamin", k: "b12" }, { t: "mineral", k: "iron" }, { t: "vitamin", k: "vit_d" }, { t: "mineral", k: "zinc" }, { t: "vitamin", k: "choline" }] },
  { key: "immun", label: "Immunförsvar", emoji: "🛡️", color: "#6FD1D9",
    blurb: "Baserat på C-vitamin, zink, D-vitamin och protein.",
    factors: [{ t: "vitamin", k: "vit_c" }, { t: "mineral", k: "zinc" }, { t: "vitamin", k: "vit_d" }, { t: "macro", k: "protein_g" }] },
  { key: "hud", label: "Hud & hår", emoji: "✨", color: "#F2A9C0",
    blurb: "Baserat på C-vitamin, E-vitamin, zink och biotin.",
    factors: [{ t: "vitamin", k: "vit_c" }, { t: "vitamin", k: "vit_e" }, { t: "mineral", k: "zinc" }, { t: "vitamin", k: "b7" }] },
  { key: "matsmaltning", label: "Matsmältning", emoji: "🌿", color: "#9ED97F",
    blurb: "Baserat på fibrer mot ett dagsmål på ca 30g.",
    factors: [{ t: "fiber" }] },
  { key: "hjarta", label: "Hjärta", emoji: "❤️", color: "#E08F8F",
    blurb: "Baserat på kalium, magnesium, fibrer och lågt natriumintag.",
    factors: [{ t: "mineral", k: "potassium" }, { t: "mineral", k: "magnesium" }, { t: "fiber" }, { t: "mineral", k: "sodium", inverse: true }] },
  { key: "hormon", label: "Hormonbalans", emoji: "⚖️", color: "#D9B36F",
    blurb: "Baserat på zink, D-vitamin, magnesium och sunt fettintag — visar näringsstöd, inte faktiska hormonnivåer.",
    factors: [{ t: "mineral", k: "zinc" }, { t: "vitamin", k: "vit_d" }, { t: "mineral", k: "magnesium" }, { t: "macro", k: "fat_g" }] },
  { key: "muskler", label: "Muskler", emoji: "💪", color: "#E0A05C",
    blurb: "Baserat på protein mot ditt mål, magnesium och zink.",
    factors: [{ t: "macro", k: "protein_g" }, { t: "mineral", k: "magnesium" }, { t: "mineral", k: "zinc" }] },
];

function calcHealthScore(cat, dailyLog, targets) {
  if (dailyLog.length === 0) return 0; // nothing logged yet — no category can score until there's real data
  const vitaminTotals = sumMicroAmounts(dailyLog, VITAMINS);
  const mineralTotals = sumMicroAmounts(dailyLog, MINERALS);
  const macroTotals = {
    protein_g: dailyLog.reduce((s, e) => s + (e.protein_g || 0), 0),
    carbs_g: dailyLog.reduce((s, e) => s + (e.carbs_g || 0), 0),
    fat_g: dailyLog.reduce((s, e) => s + (e.fat_g || 0), 0),
    fiber_g: dailyLog.reduce((s, e) => s + (e.fiber_g || 0), 0),
  };
  const scores = cat.factors.map((f) => {
    if (f.t === "vitamin") {
      const def = VITAMINS.find((v) => v.key === f.k);
      return Math.min(100, ((vitaminTotals[f.k] || 0) / def.rdi) * 100);
    }
    if (f.t === "mineral") {
      const def = MINERALS.find((v) => v.key === f.k);
      const pct = Math.min(100, ((mineralTotals[f.k] || 0) / def.rdi) * 100);
      return f.inverse ? 100 - pct : pct;
    }
    if (f.t === "macro") {
      const target = targets[f.k] || 1;
      return Math.min(100, (macroTotals[f.k] / target) * 100);
    }
    if (f.t === "fiber") {
      return Math.min(100, (macroTotals.fiber_g / 30) * 100);
    }
    return 0;
  });
  return Math.round(scores.reduce((s, p) => s + p, 0) / scores.length);
}

const mono = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };
const display = { fontFamily: "'Space Grotesk', sans-serif" };
const body = { fontFamily: "'Inter', sans-serif" };

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
@keyframes blink { 0%, 45% { opacity: 1 } 50%, 95% { opacity: 0 } 100% { opacity: 1 } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
.fade-up { animation: fadeUp .25s ease both; }
.glass-card { background: rgba(255,255,255,0.055); }
::selection { background: ${C.accentDim}; color: ${C.accent}; }
`;

// ---------- mock "USDA-shaped" lookup, used only if the API call fails ----------
const FALLBACK = {
  protein_g: 1.1, carbs_g: 22.8, sugar_g: 12.2, fiber_g: 2.6,
  fat_g: 0.3, satfat_g: 0.1, transfat_g: 0, kcal: 96,
  microAmounts: { potassium: 240, b6: 0.3 },
  bonus: [],
};

async function callClaude(messages, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages,
    }),
  });
  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

function parseJsonLoose(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ---------- field row ----------
function Ring({ value, max, size = 150, stroke = 12, color, trackColor, label, sublabel, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}88)`, transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center", padding: 6,
      }}>
        {children}
      </div>
    </div>
  );
}

function NutrientRow({ label, value, unit, estimated, onChange, sub }) {
  return (
    <div
      className="fade-up"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: sub ? "4px 0 4px 18px" : "6px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {sub && <div style={{ width: 4, height: 4, borderRadius: 99, background: C.textFaint }} />}
        <span style={{ ...body, fontSize: sub ? 13 : 14, color: sub ? C.textDim : C.text }}>
          {label}
        </span>
        {estimated && (
          <span
            style={{
              ...mono, fontSize: 10, letterSpacing: "0.04em", color: C.estimate,
              background: C.estimateDim, padding: "2px 6px", borderRadius: 4,
            }}
          >
            uppskattat
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(",", "."))}
          inputMode="decimal"
          style={{
            ...mono, width: 56, textAlign: "right", background: "transparent",
            border: "none", borderBottom: `1px solid transparent`, color: C.text,
            fontSize: 14, outline: "none", padding: "2px 0",
          }}
          onFocus={(e) => (e.target.style.borderBottom = `1px solid ${C.accent}`)}
          onBlur={(e) => (e.target.style.borderBottom = `1px solid transparent`)}
        />
        <span style={{ ...mono, fontSize: 12, color: C.textFaint, width: 18 }}>{unit}</span>
      </div>
    </div>
  );
}

const UNITS = [
  { v: "g", l: "gram" },
  { v: "ml", l: "ml" },
  { v: "dl", l: "dl" },
  { v: "msk", l: "msk" },
  { v: "tsk", l: "tsk" },
  { v: "kopp", l: "kopp" },
  { v: "st", l: "styck" },
];
const UNIT_LABELS = Object.fromEntries(UNITS.map((u) => [u.v, u.l]));
const FALLBACK_UNIT_GRAMS = { g: 1, ml: 1, dl: 100, msk: 15, tsk: 5, kopp: 240, st: 100 };

async function lookupFoodDatabase(name) {
  try {
    const res = await fetch("/api/food-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: name }),
    });
    return await res.json();
  } catch (e) {
    return { found: false };
  }
}

async function estimateFoodValues(name, amountStr, unit, known100Obj) {
  const isGrams = unit === "g";
  const knownPer100 = {};
  KNOWN_FIELDS.forEach(({ key }) => {
    const v = known100Obj[key];
    if (v !== undefined && v !== "" && !isNaN(Number(v))) knownPer100[key] = Number(v);
  });

  // slå upp riktig databas (USDA / Open Food Facts) för de fält användaren inte redan angett
  const dbResult = await lookupFoodDatabase(name);
  const dbPer100 = {};
  let dbSource = null;
  if (dbResult.found) {
    dbSource = dbResult.source;
    KNOWN_FIELDS.forEach(({ key }) => {
      if (!(key in knownPer100) && typeof dbResult.per100[key] === "number") {
        dbPer100[key] = dbResult.per100[key];
      }
    });
  }

  const missingKeys = KNOWN_FIELDS.map((f) => f.key).filter((k) => !(k in knownPer100) && !(k in dbPer100));

  try {
    const system =
      "Du är en näringsdatabas-assistent. Du får ett livsmedel/dryck, en mängd (ev. i annan enhet än gram) och ev. värden användaren redan känner till (per 100g/100ml). " +
      "Svara ENDAST med ett JSON-objekt (ingen text, inga markdown-fences) i exakt detta format: " +
      '{"estimated_grams": number, "per100": {"kcal": number, "protein_g": number, "carbs_g": number, "sugar_g": number, ' +
      '"fiber_g": number, "fat_g": number, "satfat_g": number, "transfat_g": number}, ' +
      `"micro_amounts": {${MICRO_KEYS.map((k) => `"${k}": number`).join(", ")}}, ` +
      '"bonus": [{"name": string, "amount": string, "reason": string}]} ' +
      "estimated_grams: din bästa uppskattning av hur många gram den angivna mängden motsvarar (för vätskor kan du anta ca 1g per ml; 1 dl = 100ml, 1 msk = 15ml, 1 tsk = 5ml, 1 kopp ≈ 240ml, för 'st' uppskatta en rimlig genomsnittlig vikt för det livsmedlet). " +
      "Fyll endast i uppskattade värden (typ USDA FoodData Central, per 100g/100ml) för dessa fält i \"per100\", resten ignoreras ändå: " + JSON.stringify(missingKeys) + ". " +
      "Du kan fortfarande fylla i alla fält i per100 om du vill, de kända skrivs över ändå. " +
      "micro_amounts: uppskatta den faktiska mängden (i den enhet listan anger, µg eller mg) av VARJE nämnt ämne för hela portionen (redan skalat till estimated_grams), sätt 0 om livsmedlet inte innehåller nämnvärt av det — hoppa inte över några nycklar. " +
      "bonus: 0-2 icke-essentiella men nyttiga ämnen om relevant (t.ex. omega-3, polyfenoler, antioxidanter), amount som kort textsträng (t.ex. \"620mg\"), reason en kort mening (max ~12 ord) om varför ämnet är bra för hälsan. Lämna tomt om inget relevant.";
    const text = await callClaude(
      [{ role: "user", content:
        `Livsmedel/dryck: ${name}\nAngiven mängd: ${amountStr} ${UNIT_LABELS[unit] || unit}\n` +
        `Kända värden per 100g/100ml: ${JSON.stringify(knownPer100)}\n` +
        `Nyckel → ämne (enhet): ${[...VITAMINS, ...MINERALS].map((m) => `${m.key}=${m.name}(${m.unit})`).join(", ")}` }],
      system
    );
    const parsed = parseJsonLoose(text);
    const estimatedGrams = isGrams ? Number(amountStr) : (parsed.estimated_grams || Number(amountStr) * (FALLBACK_UNIT_GRAMS[unit] || 100));
    const factor = estimatedGrams / 100;
    const aiPer100 = parsed.per100 || {};
    const microAmounts = parsed.micro_amounts || {};
    const bonus = parsed.bonus || [];

    const combinedPer100 = { ...aiPer100, ...dbPer100, ...knownPer100 };
    const scaled = {};
    KNOWN_FIELDS.forEach(({ key }) => {
      const v = combinedPer100[key];
      scaled[key] = typeof v === "number" ? Math.round(v * factor * 10) / 10 : 0;
    });
    return { ...scaled, microAmounts, bonus, estimatedKeys: missingKeys, estimatedGrams: Math.round(estimatedGrams), source: dbSource, ok: true };
  } catch (e) {
    const estimatedGrams = isGrams ? Number(amountStr) : Number(amountStr) * (FALLBACK_UNIT_GRAMS[unit] || 100);
    const factor = estimatedGrams / 100;
    const scaled = {};
    KNOWN_FIELDS.forEach(({ key }) => {
      const v = knownPer100[key] ?? dbPer100[key] ?? FALLBACK[key];
      scaled[key] = Math.round(v * factor * 10) / 10;
    });
    return { ...scaled, microAmounts: FALLBACK.microAmounts, bonus: FALLBACK.bonus, estimatedKeys: missingKeys, estimatedGrams: Math.round(estimatedGrams), source: dbSource, ok: false };
  }
}

export default function KarnaPrototype() {
  const [page, setPage] = useState("login"); // login | email-login | auth | profile | log | dashboard
  const [authInfo, setAuthInfo] = useState({ email: "", password: "" });
  const [session, setSession] = useState(null); // { access_token, user: { id, email } }
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [profileInfo, setProfileInfo] = useState({
    name: "", age: "", sex: "kvinna", height: "", weight: "",
    activity: "moderat", goal: [],
  });
  const [profileStep, setProfileStep] = useState(0);
  const [targets, setTargets] = useState(DAILY_TARGETS);
  const [units, setUnits] = useState({ weight: "kg", height: "cm" });
  const [dayFoodLogs, setDayFoodLogs] = useState({}); // dateKey (YYYY-MM-DD) -> [entries]
  const [savedMeals, setSavedMeals] = useState([]); // reusable meal templates
  const [mealName, setMealName] = useState("");
  const [mealIngredients, setMealIngredients] = useState([]); // ingredients added to the meal being built
  const [weekLog, setWeekLog] = useState({}); // dateKey (YYYY-MM-DD) -> { weight, photo }
  const [selectedDay, setSelectedDay] = useState(dateKey(new Date()));

  const todayKey = dateKey(new Date());
  const dailyLog = dayFoodLogs[todayKey] || [];
  function calcStreak() {
    let streak = 0;
    for (let d = new Date(); ; d = addDays(d, -1)) {
      const k = dateKey(d);
      const hasActivity = (dayFoodLogs[k] && dayFoodLogs[k].length > 0) || !!(weekLog[k] && (weekLog[k].weight || weekLog[k].photo));
      if (hasActivity) streak++; else break;
    }
    return streak;
  }
  const streak = calcStreak();

  const [mode, setMode] = useState("idle"); // idle | choose | manual | photo
  const [foodName, setFoodName] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("g");
  const [photoDesc, setPhotoDesc] = useState("");
  const [photoData, setPhotoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // {kcal, protein_g, ..., micros, estimatedKeys}
  const [confirmed, setConfirmed] = useState(false);
  const [known100, setKnown100] = useState({}); // values the user knows, per 100g
  const [show100, setShow100] = useState(false);

  const ACTIVITY_MULT = { stillasittande: 1.2, lätt: 1.375, moderat: 1.55, aktiv: 1.725, "mycket aktiv": 1.9 };

  async function handleSignup() {
    setAuthLoading(true); setAuthError("");
    try {
      const data = await supabaseAuth("signup", { email: authInfo.email, password: authInfo.password });
      if (data.access_token) {
        setSession({ access_token: data.access_token, user: data.user });
        await loadUserData(data.access_token, data.user.id); // clears any leftover demo data — new account starts empty
        setPage("profile");
      } else {
        setAuthError("Kolla din mail för att bekräfta ditt konto, logga sedan in.");
        setPage("login");
      }
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadUserData(accessToken, userId) {
    try {
      const [logs, days, meals] = await Promise.all([
        supabaseRest("daily_logs", { accessToken, params: { user_id: `eq.${userId}`, select: "*" } }),
        supabaseRest("day_info", { accessToken, params: { user_id: `eq.${userId}`, select: "*" } }),
        supabaseRest("saved_meals", { accessToken, params: { user_id: `eq.${userId}`, select: "*" } }),
      ]);
      const logsByDay = {};
      (logs || []).forEach((l) => {
        const k = l.log_date;
        if (!logsByDay[k]) logsByDay[k] = [];
        logsByDay[k].push({
          name: l.name, kcal: l.kcal, protein_g: l.protein_g, carbs_g: l.carbs_g, sugar_g: l.sugar_g,
          fiber_g: l.fiber_g, fat_g: l.fat_g, satfat_g: l.satfat_g, transfat_g: l.transfat_g,
          microAmounts: l.micro_amounts || {}, bonus: l.bonus || [], estimatedKeys: [],
        });
      });
      const weekObj = {};
      (days || []).forEach((d) => { weekObj[d.log_date] = { weight: d.weight_kg, photo: d.photo_url }; });
      setDayFoodLogs(logsByDay);
      setWeekLog(weekObj);
      setSavedMeals((meals || []).map((m) => ({
        id: m.id, name: m.name, kcal: m.kcal, protein_g: m.protein_g, carbs_g: m.carbs_g, sugar_g: m.sugar_g,
        fiber_g: m.fiber_g, fat_g: m.fat_g, satfat_g: m.satfat_g, transfat_g: m.transfat_g,
        microAmounts: m.micro_amounts || {}, bonus: m.bonus || [], estimatedKeys: [],
      })));
    } catch (e) {
      console.error("Kunde inte ladda din data:", e.message);
    }
    setDataLoaded(true);
  }

  async function handleLogin() {
    setAuthLoading(true); setAuthError("");
    try {
      const data = await supabaseAuth("token?grant_type=password", { email: authInfo.email, password: authInfo.password });
      setSession({ access_token: data.access_token, user: data.user });
      const profiles = await supabaseRest("profiles", { accessToken: data.access_token, params: { id: `eq.${data.user.id}`, select: "*" } });
      await loadUserData(data.access_token, data.user.id);
      if (profiles && profiles.length > 0) {
        const p = profiles[0];
        setProfileInfo({
          name: "", age: String(p.age || ""), sex: p.sex || "kvinna", height: String(p.height_cm || ""),
          weight: String(p.weight_kg || ""), activity: p.activity || "moderat", goal: p.goals || [],
        });
        setTargets({
          kcal: p.target_kcal || DAILY_TARGETS.kcal, protein_g: p.target_protein_g || DAILY_TARGETS.protein_g,
          carbs_g: p.target_carbs_g || DAILY_TARGETS.carbs_g, fat_g: p.target_fat_g || DAILY_TARGETS.fat_g,
        });
        setUnits({ weight: p.units_weight || "kg", height: p.units_height || "cm" });
        setPage("log");
      } else {
        setPage("profile");
      }
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function calcTargets(nextPage = "log") {
    const age = parseFloat(profileInfo.age) || 30;
    const height = parseFloat(profileInfo.height) || 175;
    const weight = parseFloat(profileInfo.weight) || 75;
    const sexOffset = profileInfo.sex === "man" ? 5 : -161;
    const bmr = 10 * weight + 6.25 * height - 5 * age + sexOffset;
    const mult = ACTIVITY_MULT[profileInfo.activity] || 1.55;
    let kcal = bmr * mult;
    const goals = profileInfo.goal || [];
    if (goals.includes("gå ner i vikt")) kcal -= 400;
    else if (goals.includes("gå upp i vikt")) kcal += 400;
    else if (goals.includes("bygga muskler")) kcal += 300;
    // "bibehålla", "må bättre", "fixa min hälsa", "äta mer varierat" → no extra offset on their own
    kcal = Math.round(kcal / 10) * 10;
    kcal = Math.max(kcal, 1200); // safety floor — never suggest an unrealistically low target
    const proteinMult = goals.includes("bygga muskler") ? 2.2 : 1.9;
    let protein_g = Math.round(weight * proteinMult);
    const maxProteinG = Math.round((kcal * 0.35) / 4); // never let protein crowd out more than 35% of calories
    protein_g = Math.min(protein_g, maxProteinG);
    const fat_g = Math.round((kcal * 0.27) / 9);
    const carbs_g = Math.round((kcal - protein_g * 4 - fat_g * 9) / 4);
    const finalCarbs = Math.max(carbs_g, 0);
    setTargets({ kcal, protein_g, carbs_g: finalCarbs, fat_g });
    if (session) {
      supabaseRest("profiles", {
        method: "POST", accessToken: session.access_token, upsert: true,
        body: {
          id: session.user.id, age, height_cm: height, weight_kg: weight, sex: profileInfo.sex,
          activity: profileInfo.activity, goals: profileInfo.goal, target_kcal: kcal,
          target_protein_g: protein_g, target_carbs_g: finalCarbs, target_fat_g: fat_g,
          units_weight: units.weight, units_height: units.height,
        },
      }).catch((e) => { console.error("Kunde inte spara profilen:", e.message); setSyncError("Kunde inte spara profilen: " + e.message); });
    }
    setPage(nextPage);
  }

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, chatLoading]);

  function reset() {
    setMode("idle"); setFoodName(""); setWeight(""); setWeightUnit("g"); setPhotoDesc("");
    setPhotoData(null); setResult(null); setConfirmed(false);
    setChatOpen(false); setChatMsgs([]); setError("");
    setKnown100({}); setShow100(false);
  }

  async function estimateManual() {
    if (!foodName.trim() || !weight.trim()) return;
    setLoading(true); setError("");
    const res = await estimateFoodValues(foodName, weight, weightUnit, known100);
    setResult(res);
    setMode("result");
    if (!res.ok) setError("Kunde inte nå AI:n just nu — fyllde i uppskattade fält med exempel-värden.");
    setLoading(false);
  }

  async function estimatePhoto() {
    if (!photoData) return;
    setLoading(true); setError("");
    try {
      const system =
        "Du är en näringsdatabas-assistent som tolkar bilder av måltider. " +
        "Svara ENDAST med ett JSON-objekt (ingen text, inga markdown-fences) i exakt detta format: " +
        '{"kcal": number, "protein_g": number, "carbs_g": number, "sugar_g": number, ' +
        '"fiber_g": number, "fat_g": number, "satfat_g": number, "transfat_g": number, ' +
        `"micro_amounts": {${MICRO_KEYS.map((k) => `"${k}": number`).join(", ")}}, ` +
        '"bonus": [{"name": string, "amount": string}]} ' +
        "micro_amounts: uppskatta faktisk mängd (µg/mg enligt nyckellistan nedan) av VARJE ämne för hela portionen, sätt 0 om inte nämnvärt — hoppa inte över nycklar. " +
        "bonus: 0-2 icke-essentiella nyttiga ämnen om relevant, amount som kort textsträng. " +
        "Uppskatta portionsstorlek utifrån bilden och ev. beskrivning.\n" +
        `Nyckel → ämne (enhet): ${[...VITAMINS, ...MINERALS].map((m) => `${m.key}=${m.name}(${m.unit})`).join(", ")}`;
      const content = [
        { type: "image", source: { type: "base64", media_type: photoData.mime, data: photoData.b64 } },
        { type: "text", text: photoDesc.trim() ? `Beskrivning från användaren: ${photoDesc}` : "Ingen extra beskrivning given." },
      ];
      const text = await callClaude([{ role: "user", content }], system);
      const parsed = parseJsonLoose(text);
      const allKeys = KNOWN_FIELDS.map((f) => f.key);
      setResult({ ...parsed, microAmounts: parsed.micro_amounts || {}, bonus: parsed.bonus || [], estimatedKeys: allKeys });
      setFoodName(photoDesc.trim() || "Foto-loggad måltid");
      setMode("result");
    } catch (e) {
      const allKeys = KNOWN_FIELDS.map((f) => f.key);
      setResult({ ...FALLBACK, estimatedKeys: allKeys });
      setFoodName(photoDesc.trim() || "Foto-loggad måltid");
      setMode("result");
      setError("Kunde inte nå AI:n just nu — visar exempel-värden istället.");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result.split(",")[1];
      setPhotoData({ b64, mime: file.type, preview: reader.result });
    };
    reader.readAsDataURL(file);
  }

  async function sendChat() {
    if (!chatInput.trim() || !result) return;
    const userMsg = chatInput.trim();
    const nextMsgs = [...chatMsgs, { role: "user", text: userMsg }];
    setChatMsgs(nextMsgs);
    setChatInput("");
    setChatLoading(true);
    try {
      const system =
        `Du är en kort, konkret näringscoach inne i en loggnings-vy. Användaren loggar just nu ` +
        `"${foodName}" (${weight || "okänd"} g) med dessa värden: ${JSON.stringify(result)}. ` +
        `Svara kort (max 3 meningar) på svenska.`;
      const apiMsgs = nextMsgs.map((m) => ({ role: m.role, content: m.text }));
      const text = await callClaude(apiMsgs, system);
      setChatMsgs((m) => [...m, { role: "assistant", text: text || "Kunde inte svara just nu." }]);
    } catch {
      setChatMsgs((m) => [...m, { role: "assistant", text: "Kunde inte nå AI:n just nu." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const update = (key) => (v) => setResult((r) => ({ ...r, [key]: v }));
  const isOnboarding = page === "login" || page === "email-login" || page === "auth" || page === "profile";

  return (
    <div style={{
      minHeight: "100vh", width: "100%", position: "relative",
      background: C.bgGradient, color: C.text, display: "flex", flexDirection: "column",
    }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ flex: 1, overflowY: "auto", ...body }}>
        {syncError && (
          <div className="fade-up" style={{
            background: "rgba(224,143,143,0.15)", border: "1px solid rgba(224,143,143,0.35)",
            color: "#E08F8F", fontSize: 11.5, padding: "10px 16px", display: "flex",
              justifyContent: "space-between", alignItems: "center", gap: 10,
            }}>
              <span>{syncError}</span>
              <button onClick={() => setSyncError("")} style={{ background: "none", border: "none", color: "#E08F8F", cursor: "pointer", flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          )}

        {isOnboarding && (
          <div className="fade-up" style={{ padding: "56px 26px 32px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 34, justifyContent: "center" }}>
              <svg width="30" height="33" viewBox="0 0 32 36" style={{ filter: "drop-shadow(0 0 8px rgba(143,217,168,.55))" }}>
                <defs>
                  <linearGradient id="seedGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F2C063" />
                    <stop offset="100%" stopColor="#8FD9A8" />
                  </linearGradient>
                </defs>
                <path d="M16 3 C 19 4.5, 19.5 7, 21.5 9 C 29 15, 29 24, 21.5 30.5 C 18 34, 14 34, 10.5 30.5 C 3 24, 3 15, 10.5 9 C 12.5 7, 13 4.5, 16 3 Z" fill="url(#seedGrad2)" />
              </svg>
              <span style={{ ...display, fontSize: 21, fontWeight: 600 }}>kärna</span>
            </div>

            {page === "login" && (
              <>
                <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 4, textAlign: "center" }}>
                  Välkommen
                </p>
                <p style={{ fontSize: 12.5, color: C.textDim, marginBottom: 30, textAlign: "center" }}>
                  Mår kärnan bra, mår hela kroppen bra.
                </p>

                <button onClick={() => setPage("profile")} style={socialBtn}>
                  <AppleIcon /> Fortsätt med Apple
                </button>
                <button onClick={() => setPage("profile")} style={{ ...socialBtn, marginTop: 10 }}>
                  <GoogleIcon /> Fortsätt med Google
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 11, color: C.textFaint }}>eller</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                <button onClick={() => setPage("email-login")} style={{ ...ghostBtn, width: "100%", padding: "12px 0" }}>
                  <Mail size={15} /> Fortsätt med mail
                </button>

                <p style={{ fontSize: 12, color: C.textFaint, textAlign: "center", marginTop: 30 }}>
                  Inget konto än? <span onClick={() => setPage("auth")} style={{ color: C.accent, cursor: "pointer" }}>Skapa konto</span>
                </p>
              </>
            )}

            {page === "email-login" && (
              <>
                <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 4 }}>Logga in</p>
                <p style={{ fontSize: 12.5, color: C.textDim, marginBottom: 26 }}>Med din e-post och ditt lösenord.</p>
                <label style={onbLabel}>E-post</label>
                <input
                  value={authInfo.email} onChange={(e) => setAuthInfo((a) => ({ ...a, email: e.target.value }))}
                  placeholder="du@exempel.se" style={onbInput}
                />
                <label style={onbLabel}>Lösenord</label>
                <input
                  type="password" value={authInfo.password} onChange={(e) => setAuthInfo((a) => ({ ...a, password: e.target.value }))}
                  placeholder="••••••••" style={{ ...onbInput, marginBottom: 12 }}
                />
                {authError && <p style={{ fontSize: 11.5, color: "#E08F8F", marginBottom: 12 }}>{authError}</p>}
                <button
                  onClick={handleLogin}
                  disabled={!authInfo.email.trim() || !authInfo.password.trim() || authLoading}
                  style={{ ...primaryBtn, width: "100%", opacity: !authInfo.email.trim() || !authInfo.password.trim() ? 0.5 : 1, marginTop: 16 }}
                >
                  {authLoading ? "Loggar in…" : <>Logga in <ChevronRight size={15} /></>}
                </button>
                <p onClick={() => { setPage("login"); setAuthError(""); }} style={{ fontSize: 11.5, color: C.textFaint, textAlign: "center", marginTop: 14, cursor: "pointer" }}>
                  ← Tillbaka
                </p>
              </>
            )}

            {page === "auth" && (
              <>
                <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 4 }}>Skapa konto</p>
                <p style={{ fontSize: 12.5, color: C.textDim, marginBottom: 26 }}>
                  Mår kärnan bra, mår hela kroppen bra.
                </p>
                <label style={onbLabel}>E-post</label>
                <input
                  value={authInfo.email} onChange={(e) => setAuthInfo((a) => ({ ...a, email: e.target.value }))}
                  placeholder="du@exempel.se" style={onbInput}
                />
                <label style={onbLabel}>Lösenord</label>
                <input
                  type="password" value={authInfo.password} onChange={(e) => setAuthInfo((a) => ({ ...a, password: e.target.value }))}
                  placeholder="•••••••• (minst 6 tecken)" style={{ ...onbInput, marginBottom: 12 }}
                />
                {authError && <p style={{ fontSize: 11.5, color: "#E08F8F", marginBottom: 12 }}>{authError}</p>}
                <button
                  onClick={handleSignup}
                  disabled={!authInfo.email.trim() || !authInfo.password.trim() || authLoading}
                  style={{ ...primaryBtn, width: "100%", opacity: !authInfo.email.trim() || !authInfo.password.trim() ? 0.5 : 1, marginTop: 16 }}
                >
                  {authLoading ? "Skapar konto…" : <>Skapa konto <ChevronRight size={15} /></>}
                </button>
                <p style={{ fontSize: 11.5, color: C.textFaint, textAlign: "center", marginTop: 14 }}>
                  Har du redan ett konto? <span onClick={() => { setPage("login"); setAuthError(""); }} style={{ color: C.accent, cursor: "pointer" }}>Logga in</span>
                </p>
              </>
            )}

            {page === "profile" && (() => {
              const STEPS = ["sex", "age", "height", "weight", "activity", "goal"];
              const step = STEPS[profileStep];
              const stepValid = {
                sex: !!profileInfo.sex,
                age: !!profileInfo.age,
                height: !!profileInfo.height,
                weight: !!profileInfo.weight,
                activity: !!profileInfo.activity,
                goal: profileInfo.goal.length > 0,
              }[step];
              const goBack = () => profileStep === 0 ? setPage("login") : setProfileStep((s) => s - 1);
              const goNext = () => profileStep === STEPS.length - 1 ? calcTargets() : setProfileStep((s) => s + 1);

              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                    <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <ChevronLeft size={19} color={C.textDim} />
                    </button>
                    <div style={{ display: "flex", gap: 5, flex: 1 }}>
                      {STEPS.map((_, i) => (
                        <div key={i} style={{
                          flex: 1, height: 4, borderRadius: 3,
                          background: i <= profileStep ? "linear-gradient(90deg, #F2C063, #8FD9A8)" : "rgba(255,255,255,0.08)",
                        }} />
                      ))}
                    </div>
                  </div>

                  <div className="fade-up" key={step} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    {step === "sex" && (
                      <>
                        <p style={onbQ}>Vilket kön har du?</p>
                        <p style={onbSub}>Hjälper oss räkna ut dina mål mer exakt.</p>
                        <ChipGroup options={[{ v: "kvinna", l: "Kvinna" }, { v: "man", l: "Man" }]}
                          value={profileInfo.sex} onChange={(v) => setProfileInfo((p) => ({ ...p, sex: v }))} large />
                      </>
                    )}
                    {step === "age" && (
                      <>
                        <p style={onbQ}>Hur gammal är du?</p>
                        <p style={onbSub}>Ålder påverkar din dagliga energiförbrukning.</p>
                        <input value={profileInfo.age} inputMode="numeric" autoFocus
                          onChange={(e) => setProfileInfo((p) => ({ ...p, age: e.target.value.replace(/[^0-9]/g, "") }))}
                          placeholder="28" style={onbInputBig} />
                      </>
                    )}
                    {step === "height" && (
                      <>
                        <p style={onbQ}>Hur lång är du?</p>
                        <p style={onbSub}>{units.height === "ft" ? "I tum." : "I centimeter."}</p>
                        <input value={displayHeight(profileInfo.height, units.height)} inputMode="numeric" autoFocus
                          onChange={(e) => setProfileInfo((p) => ({ ...p, height: parseHeightInput(e.target.value.replace(/[^0-9]/g, ""), units.height) }))}
                          placeholder={units.height === "ft" ? "70" : "178"} style={onbInputBig} />
                      </>
                    )}
                    {step === "weight" && (
                      <>
                        <p style={onbQ}>Hur mycket väger du?</p>
                        <p style={onbSub}>{units.weight === "lbs" ? "I pund, ungefärligt räcker." : "I kilo, ungefärligt räcker."}</p>
                        <input value={displayWeight(profileInfo.weight, units.weight)} inputMode="numeric" autoFocus
                          onChange={(e) => setProfileInfo((p) => ({ ...p, weight: parseWeightInput(e.target.value.replace(/[^0-9.]/g, ""), units.weight) }))}
                          placeholder={units.weight === "lbs" ? "165" : "75"} style={onbInputBig} />
                      </>
                    )}
                    {step === "activity" && (
                      <>
                        <p style={onbQ}>Hur aktiv är du i vardagen?</p>
                        <p style={onbSub}>Räknat utanför träningspass.</p>
                        <ChipGroup
                          options={ACTIVITY_LEVELS}
                          value={profileInfo.activity} onChange={(v) => setProfileInfo((p) => ({ ...p, activity: v }))} large stack
                        />
                      </>
                    )}
                    {step === "goal" && (
                      <>
                        <p style={onbQ}>Vad vill du fokusera på?</p>
                        <p style={onbSub}>Välj gärna flera — det här styr hur vi sätter dina mål, du kan ändra senare.</p>
                        <ChipGroup
                          options={GOALS} value={profileInfo.goal} multi
                          onChange={(v) => setProfileInfo((p) => ({
                            ...p,
                            goal: p.goal.includes(v) ? p.goal.filter((g) => g !== v) : [...p.goal, v],
                          }))}
                          large stack
                        />
                      </>
                    )}

                    <div style={{ flex: 1 }} />
                    <button onClick={goNext} disabled={!stepValid} style={{ ...primaryBtn, width: "100%", opacity: stepValid ? 1 : 0.5 }}>
                      {profileStep === STEPS.length - 1 ? "Räkna ut mina mål" : "Fortsätt"} <ChevronRight size={15} />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {!isOnboarding && (
          <>
      {/* top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 22px 14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="22" height="24" viewBox="0 0 32 36" style={{ filter: "drop-shadow(0 0 6px rgba(143,217,168,.5))" }}>
            <defs>
              <linearGradient id="seedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F2C063" />
                <stop offset="100%" stopColor="#8FD9A8" />
              </linearGradient>
            </defs>
            <path
              d="M16 3 C 19 4.5, 19.5 7, 21.5 9 C 29 15, 29 24, 21.5 30.5 C 18 34, 14 34, 10.5 30.5 C 3 24, 3 15, 10.5 9 C 12.5 7, 13 4.5, 16 3 Z"
              fill="url(#seedGrad)"
            />
          </svg>
          <span style={{ ...display, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>
            kärna
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {streak > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 4, ...mono, fontSize: 12, fontWeight: 600, color: "#F2A94B",
              background: "rgba(242,169,75,0.12)", border: `1px solid rgba(242,169,75,0.25)`,
              borderRadius: 999, padding: "5px 10px",
            }}>
              <Flame size={13} color="#F2A94B" fill="#F2A94B" />
              {streak}
            </div>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, ...mono, fontSize: 12, color: C.textDim,
            background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.06)`,
            borderRadius: 999, padding: "5px 11px",
          }}>
            {Math.round(dailyLog.reduce((s, e) => s + (e.kcal || 0), 0))} / {targets.kcal} kcal
          </div>
          <button onClick={() => setPage("settings")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <Settings size={18} color={C.textFaint} />
          </button>
        </div>
      </div>

      {page === "dashboard" && <Dashboard dailyLog={dailyLog} targets={targets} />}

      {page === "settings" && (
        <SettingsPage
          profileInfo={profileInfo} setProfileInfo={setProfileInfo}
          onSave={() => calcTargets("settings")}
          onBack={() => setPage("log")}
          onLogout={() => {
            setSession(null); setDataLoaded(false);
            setDayFoodLogs({}); setWeekLog({}); setSavedMeals([]);
            setAuthInfo({ email: "", password: "" });
            setPage("login");
          }}
          units={units} setUnits={setUnits}
          onDeleteAccount={async () => {
            if (session) {
              const uid = session.user.id;
              try {
                await Promise.all([
                  supabaseRest("daily_logs", { method: "DELETE", accessToken: session.access_token, params: { user_id: `eq.${uid}` } }),
                  supabaseRest("day_info", { method: "DELETE", accessToken: session.access_token, params: { user_id: `eq.${uid}` } }),
                  supabaseRest("saved_meals", { method: "DELETE", accessToken: session.access_token, params: { user_id: `eq.${uid}` } }),
                  supabaseRest("profiles", { method: "DELETE", accessToken: session.access_token, params: { id: `eq.${uid}` } }),
                ]);
              } catch (e) { console.error("Kunde inte radera all data:", e.message); }
            }
            setSession(null); setDataLoaded(false);
            setDayFoodLogs({}); setWeekLog({}); setSavedMeals([]);
            setProfileInfo({ name: "", age: "", sex: "kvinna", height: "", weight: "", activity: "moderat", goal: [] });
            setTargets(DAILY_TARGETS); setUnits({ weight: "kg", height: "cm" });
            setAuthInfo({ email: "", password: "" });
            setPage("login");
          }}
        />
      )}

      {page === "history" && (
        <HistoryPage dayFoodLogs={dayFoodLogs} weekLog={weekLog} units={units} />
      )}

      {page === "meals" && (
        <MealsPage
          savedMeals={savedMeals} setSavedMeals={setSavedMeals} session={session}
          onLogMeal={(meal) => {
            setDayFoodLogs((logs) => ({
              ...logs,
              [todayKey]: [...(logs[todayKey] || []), { ...meal, name: meal.name }],
            }));
            if (session) {
              supabaseRest("daily_logs", {
                method: "POST", accessToken: session.access_token,
                body: {
                  user_id: session.user.id, log_date: todayKey, name: meal.name,
                  kcal: meal.kcal, protein_g: meal.protein_g, carbs_g: meal.carbs_g,
                  sugar_g: meal.sugar_g, fiber_g: meal.fiber_g, fat_g: meal.fat_g,
                  satfat_g: meal.satfat_g, transfat_g: meal.transfat_g,
                  micro_amounts: meal.microAmounts, bonus: meal.bonus,
                },
              }).catch((e) => { console.error("Kunde inte spara loggningen:", e.message); setSyncError("Kunde inte spara till databasen: " + e.message); });
            }
            setPage("log");
          }}
          onCreateNew={() => { setMealName(""); setMealIngredients([]); setPage("meal-builder"); }}
        />
      )}

      {page === "meal-builder" && (
        <MealBuilderPage
          mealName={mealName} setMealName={setMealName}
          ingredients={mealIngredients} setIngredients={setMealIngredients}
          onCancel={() => setPage("meals")}
          onSave={async (meal) => {
            if (session) {
              try {
                const [row] = await supabaseRest("saved_meals", {
                  method: "POST", accessToken: session.access_token,
                  body: {
                    user_id: session.user.id, name: meal.name, kcal: meal.kcal, protein_g: meal.protein_g,
                    carbs_g: meal.carbs_g, sugar_g: meal.sugar_g, fiber_g: meal.fiber_g, fat_g: meal.fat_g,
                    satfat_g: meal.satfat_g, transfat_g: meal.transfat_g,
                    micro_amounts: meal.microAmounts, bonus: meal.bonus,
                  },
                });
                setSavedMeals((meals) => [...meals, { ...meal, id: row.id }]);
              } catch (e) {
                console.error("Kunde inte spara måltiden:", e.message);
                setSavedMeals((meals) => [...meals, meal]);
              }
            } else {
              setSavedMeals((meals) => [...meals, meal]);
            }
            setPage("meals");
          }}
        />
      )}

      {page === "progress" && (
        <ProgressPage
          dailyLog={dailyLog} weekLog={weekLog} setWeekLog={setWeekLog}
          selectedDay={selectedDay} setSelectedDay={setSelectedDay} goals={profileInfo.goal} units={units} session={session}
        />
      )}

      {page === "log" && (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {/* idle state */}
        {mode === "idle" && (() => {
          const t = {
            kcal: dailyLog.reduce((s, e) => s + (e.kcal || 0), 0),
            protein_g: dailyLog.reduce((s, e) => s + (e.protein_g || 0), 0),
            carbs_g: dailyLog.reduce((s, e) => s + (e.carbs_g || 0), 0),
            fat_g: dailyLog.reduce((s, e) => s + (e.fat_g || 0), 0),
          };
          const kcalLeft = Math.max(0, targets.kcal - t.kcal);
          const hour = new Date().getHours();
          const greeting = hour < 5 ? "God natt" : hour < 11 ? "God morgon" : hour < 17 ? "God eftermiddag" : "God kväll";
          const dateStr = new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
          return (
            <div className="fade-up" style={{ paddingBottom: 90 }}>
              <div style={{ marginBottom: 22 }}>
                <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 2 }}>{greeting}</p>
                <p style={{ fontSize: 12, color: C.textFaint, textTransform: "capitalize" }}>{dateStr}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
                <Ring value={t.kcal} max={targets.kcal} size={184} stroke={12} color={C.ringKcal} trackColor="rgba(255,255,255,0.05)">
                  <span style={{ ...display, fontSize: 32, fontWeight: 700 }}>{Math.round(kcalLeft)}</span>
                  <span style={{ fontSize: 12, color: C.textDim }}>kcal kvar</span>
                </Ring>
                <div style={{ display: "flex", gap: 26, marginTop: 14 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ ...mono, fontSize: 15, fontWeight: 600 }}>{targets.kcal}</div>
                    <div style={{ fontSize: 10.5, color: C.textFaint }}>Behov</div>
                  </div>
                  <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ ...mono, fontSize: 15, fontWeight: 600 }}>{Math.round(t.kcal)}</div>
                    <div style={{ fontSize: 10.5, color: C.textFaint }}>Ätit</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 32 }}>
                {[
                  { label: "Protein", value: t.protein_g, max: targets.protein_g, color: C.ringProtein },
                  { label: "Kolhydrater", value: t.carbs_g, max: targets.carbs_g, color: C.ringCarbs },
                  { label: "Fett", value: t.fat_g, max: targets.fat_g, color: C.ringFat },
                ].map((m) => (
                  <div key={m.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Ring value={m.value} max={m.max} size={62} stroke={6} color={m.color} trackColor="rgba(255,255,255,0.05)">
                      <span style={{ ...mono, fontSize: 12.5, fontWeight: 600 }}>{Math.round(m.value)}</span>
                    </Ring>
                    <span style={{ fontSize: 10.5, color: C.textFaint, marginTop: 8 }}>{m.label} · {m.max}g</span>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Dagens måltider
                </p>
                {dailyLog.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: C.textFaint }}>Inget loggat än idag.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dailyLog.map((e, i) => (
                      <div key={i} style={{
                        ...glass, borderRadius: 14, padding: "12px 16px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <span style={{ fontSize: 13.5 }}>{e.name || "Måltid"}</span>
                        <span style={{ ...mono, fontSize: 12.5, color: C.accent }}>{Math.round(e.kcal || 0)} kcal</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* choose method */}
        {mode === "choose" && (
          <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 480, margin: "40px auto" }}>
            {[
              { key: "manual", icon: Keyboard, title: "Manuellt", sub: "Skriv livsmedel + vikt" },
              { key: "photo", icon: Camera, title: "Bild", sub: "Fota din måltid" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMode(opt.key)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                  padding: "24px 16px", cursor: "pointer", textAlign: "left", color: C.text,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <opt.icon size={20} color={C.accent} style={{ marginBottom: 12 }} />
                <div style={{ ...display, fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{opt.title}</div>
                <div style={{ fontSize: 12.5, color: C.textDim }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        )}

        {/* manual entry */}
        {mode === "manual" && (
          <div className="fade-up" style={{ maxWidth: 420, margin: "20px auto" }}>
            <label style={{ fontSize: 12.5, color: C.textDim, display: "block", marginBottom: 6 }}>Matvara</label>
            <input
              value={foodName} onChange={(e) => setFoodName(e.target.value)}
              placeholder="t.ex. banan"
              style={{
                width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 16, outline: "none",
              }}
            />
            <label style={{ fontSize: 12.5, color: C.textDim, display: "block", marginBottom: 6 }}>Mängd</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""))}
                placeholder="120" inputMode="numeric"
                style={{
                  flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", ...mono,
                }}
              />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
                {UNITS.map((u) => (
                  <button
                    key={u.v} onClick={() => setWeightUnit(u.v)}
                    style={{
                      fontSize: 11, padding: "5px 8px", borderRadius: 7, cursor: "pointer",
                      border: weightUnit === u.v ? "1px solid transparent" : `1px solid rgba(255,255,255,0.08)`,
                      background: weightUnit === u.v ? C.accent : "rgba(255,255,255,0.05)",
                      color: weightUnit === u.v ? "#08150E" : C.textDim, fontWeight: weightUnit === u.v ? 600 : 400,
                    }}
                  >
                    {u.l}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 8 }}>
              T.ex. "1 kopp grönt te" — skriv 1 och välj kopp. Kärna räknar om till gram åt dig.
            </p>
            <button
              onClick={() => setShow100((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                cursor: "pointer", color: C.textDim, fontSize: 12.5, padding: "4px 0", marginBottom: 6,
              }}
            >
              <ChevronDown size={13} style={{ transform: show100 ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
              Fyll i kända värden per 100g (valfritt)
            </button>
            <p style={{ fontSize: 11.5, color: C.textFaint, marginBottom: show100 ? 12 : 22 }}>
              {show100
                ? "Precis som på förpackningen — kärna räknar om till din faktiska vikt. Lämna resten tomt så uppskattar AI:n det."
                : "Vet du t.ex. protein- eller fettinnehållet per 100g (från förpackningen)? Fyll i det du vet, rekommenderat för bästa resultat — annars uppskattar AI:n allt."}
            </p>

            {show100 && (
              <div className="fade-up" style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "4px 14px", marginBottom: 22,
              }}>
                {KNOWN_FIELDS.map((f) => (
                  <div key={f.key} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: f.sub ? "6px 0 6px 16px" : "9px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {f.sub && <div style={{ width: 4, height: 4, borderRadius: 99, background: C.textFaint }} />}
                      <span style={{ fontSize: f.sub ? 12.5 : 13.5, color: f.sub ? C.textDim : C.text }}>{f.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        value={known100[f.key] || ""}
                        onChange={(e) => setKnown100((k) => ({ ...k, [f.key]: e.target.value.replace(",", ".").replace(/[^0-9.]/g, "") }))}
                        placeholder="—" inputMode="decimal"
                        style={{
                          ...mono, width: 50, textAlign: "right", background: "transparent", border: "none",
                          borderBottom: `1px solid transparent`, color: C.text, fontSize: 13.5, outline: "none", padding: "2px 0",
                        }}
                        onFocus={(e) => (e.target.style.borderBottom = `1px solid ${C.accent}`)}
                        onBlur={(e) => (e.target.style.borderBottom = `1px solid transparent`)}
                      />
                      <span style={{ ...mono, fontSize: 11, color: C.textFaint, width: 34 }}>{f.unit}/100g</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMode("choose")} style={ghostBtn}>Tillbaka</button>
              <button
                onClick={estimateManual} disabled={!foodName.trim() || !weight.trim() || loading}
                style={{ ...primaryBtn, opacity: !foodName.trim() || !weight.trim() ? 0.5 : 1 }}
              >
                {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {loading ? "Räknar ut värden…" : "Logga"}
              </button>
            </div>
          </div>
        )}

        {/* photo entry */}
        {mode === "photo" && (
          <div className="fade-up" style={{ maxWidth: 420, margin: "20px auto" }}>
            <label
              htmlFor="photo-input"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, border: `1.5px dashed ${C.borderStrong}`, borderRadius: 12, padding: "28px 12px",
                cursor: "pointer", marginBottom: 16, background: C.surface, overflow: "hidden",
              }}
            >
              {photoData ? (
                <img src={photoData.preview} alt="förhandsvisning" style={{ maxHeight: 160, borderRadius: 8 }} />
              ) : (
                <>
                  <Camera size={22} color={C.textDim} />
                  <span style={{ fontSize: 13, color: C.textDim }}>Ta eller välj en bild</span>
                </>
              )}
            </label>
            <input id="photo-input" type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <label style={{ fontSize: 12.5, color: C.textDim, display: "block", marginBottom: 6 }}>
              Beskrivning (valfritt)
            </label>
            <textarea
              value={photoDesc} onChange={(e) => setPhotoDesc(e.target.value)}
              placeholder="t.ex. kycklingwrap med lite majonnäs, ingen ost"
              rows={3}
              style={{
                width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "10px 12px", color: C.text, fontSize: 13.5, marginBottom: 22, outline: "none", resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMode("choose")} style={ghostBtn}>Tillbaka</button>
              <button
                onClick={estimatePhoto} disabled={!photoData || loading}
                style={{ ...primaryBtn, opacity: !photoData ? 0.5 : 1 }}
              >
                {loading ? "Analyserar bild…" : "Logga"}
              </button>
            </div>
          </div>
        )}

        {/* result */}
        {mode === "result" && result && (
          <div className="fade-up" style={{ display: "grid", gridTemplateColumns: chatOpen ? "1fr 300px" : "1fr", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <div style={{ ...display, fontSize: 19, fontWeight: 600 }}>{foodName || "Måltid"}</div>
                  {weight && <div style={{ ...mono, fontSize: 12.5, color: C.textFaint }}>{weight} {UNIT_LABELS[weightUnit]}</div>}
                  {result.source && (
                    <div style={{ fontSize: 10.5, color: C.accent, marginTop: 3 }}>Källa: {result.source}</div>
                  )}
                </div>
                <div style={{ ...mono, fontSize: 22, fontWeight: 600, color: C.accent }}>
                  {Math.round(result.kcal)} <span style={{ fontSize: 12, color: C.textFaint }}>kcal</span>
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: C.estimate, marginTop: 8, marginBottom: 4 }}>{error}</p>
              )}

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "6px 16px", marginTop: 18, marginBottom: 10 }}>
                {KNOWN_FIELDS.filter((f) => f.key !== "kcal").map((f) => (
                  <NutrientRow
                    key={f.key} label={f.label} unit={f.unit} sub={f.sub}
                    value={result[f.key]}
                    estimated={(result.estimatedKeys || []).includes(f.key)}
                    onChange={update(f.key)}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 18 }}>
                Vitaminer, mineraler och bra ämnen läggs till din dagliga översikt när du loggar — se fliken <b>Översikt</b> för hela bilden.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => {
                    setConfirmed(true);
                    setDayFoodLogs((logs) => ({
                      ...logs,
                      [todayKey]: [...(logs[todayKey] || []), { name: foodName, ...result }],
                    }));
                    if (session) {
                      supabaseRest("daily_logs", {
                        method: "POST", accessToken: session.access_token,
                        body: {
                          user_id: session.user.id, log_date: todayKey, name: foodName,
                          kcal: result.kcal, protein_g: result.protein_g, carbs_g: result.carbs_g,
                          sugar_g: result.sugar_g, fiber_g: result.fiber_g, fat_g: result.fat_g,
                          satfat_g: result.satfat_g, transfat_g: result.transfat_g,
                          micro_amounts: result.microAmounts, bonus: result.bonus,
                        },
                      }).catch((e) => { console.error("Kunde inte spara loggningen:", e.message); setSyncError("Kunde inte spara till databasen: " + e.message); });
                    }
                  }}
                  style={{ ...primaryBtn, width: "100%" }}
                >
                  <Check size={15} /> {confirmed ? "Loggat" : "Bekräfta & logga"}
                </button>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setChatOpen((v) => !v)} style={{ ...ghostBtn, flex: 1 }}>
                    <Sparkles size={14} color={C.accent} /> Fråga AI
                  </button>
                  <button onClick={reset} style={{ ...ghostBtn, flex: 1 }}>
                    <Home size={14} /> Tillbaka hem
                  </button>
                </div>
              </div>
              {confirmed && (
                <p className="fade-up" style={{ fontSize: 12.5, color: C.textDim, marginTop: 10 }}>
                  Sparat till din dagslogg.
                </p>
              )}
            </div>

            {chatOpen && (
              <div className="fade-up" style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                display: "flex", flexDirection: "column", height: 420, position: "sticky", top: 20,
              }}>
                <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={13} color={C.accent} />
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>Fråga om värdena</span>
                  <button onClick={() => setChatOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
                    <X size={14} color={C.textFaint} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {chatMsgs.length === 0 && (
                    <p style={{ fontSize: 12, color: C.textFaint }}>
                      T.ex. "varför gissar du så mycket protein?" eller "är det här en stor banan?"
                    </p>
                  )}
                  {chatMsgs.map((m, i) => (
                    <div key={i} style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      background: m.role === "user" ? C.accentDim : C.surfaceRaised,
                      color: m.role === "user" ? C.accent : C.text,
                      borderRadius: 10, padding: "7px 10px", fontSize: 12.5, maxWidth: "88%",
                    }}>
                      {m.text}
                    </div>
                  ))}
                  {chatLoading && <Loader2 size={14} color={C.textFaint} style={{ animation: "spin 1s linear infinite" }} />}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, padding: 8, gap: 6 }}>
                  <input
                    value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="Skriv en fråga…"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 12.5 }}
                  />
                  <button onClick={sendChat} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Send size={15} color={C.accent} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}
          </>
        )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>

        {!isOnboarding && page === "log" && mode === "idle" && (
          <button
            onClick={() => setMode("choose")}
            style={{
              position: "absolute", right: 20, bottom: 84, zIndex: 20,
              display: "flex", alignItems: "center", gap: 8,
              ...display, fontSize: 14, fontWeight: 600, color: "#08150E",
              background: `linear-gradient(135deg, ${C.accent}, #6FC08A)`, border: "none", borderRadius: 999,
              padding: "13px 22px", cursor: "pointer",
              boxShadow: `0 10px 26px ${C.accent}55`,
            }}
          >
            <Plus size={17} /> Logga
          </button>
        )}

        {!isOnboarding && (
          <div style={{
            display: "flex", justifyContent: "space-around", alignItems: "center",
            padding: "10px 8px calc(10px + env(safe-area-inset-bottom, 0px))",
            borderTop: `1px solid rgba(255,255,255,0.06)`, background: "#0A100C",
          }}>
            {[
              { key: "history", label: "Kalender", icon: CalendarDays },
              { key: "progress", label: "Progress", icon: TrendingUp },
              { key: "log", label: "Hem", icon: Home },
              { key: "dashboard", label: "Översikt", icon: LayoutGrid },
              { key: "meals", label: "Måltider", icon: BookOpen },
            ].map((t) => {
              const active = page === t.key;
              return (
                <button
                  key={t.key} onClick={() => {
                    setPage(t.key);
                    if (t.key === "log") setMode("idle");
                  }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
                    color: active ? C.accent : C.textFaint,
                  }}
                >
                  <t.icon size={18} strokeWidth={active ? 2.3 : 1.8} />
                  <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 500 }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}
const onbLabel = { fontSize: 12, color: C.textDim, display: "block", margin: "14px 0 6px" };
const onbInput = {
  width: "100%", background: "rgba(255,255,255,0.055)", border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 16,
  padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", backdropFilter: "blur(8px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
};
const onbInputBig = {
  ...onbInput, fontSize: 26, textAlign: "center", padding: "20px 14px",
  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginBottom: 8,
};
const onbQ = { ...display, fontSize: 21, fontWeight: 600, marginBottom: 6, lineHeight: 1.25 };
const onbSub = { fontSize: 12.5, color: C.textDim, marginBottom: 26 };

const ACTIVITY_LEVELS = [
  { v: "stillasittande", l: "Stillasittande", sub: "Kontorsjobb, mest still, ingen eller sällan träning" },
  { v: "lätt", l: "Lätt aktiv", sub: "Går/rör dig lite dagligen, tränar lätt 1–3 ggr/vecka" },
  { v: "moderat", l: "Måttligt aktiv", sub: "Tränar 3–5 ggr/vecka, en del rörelse i vardagen" },
  { v: "aktiv", l: "Aktiv", sub: "Tränar hårt 6–7 ggr/vecka, eller fysiskt jobb + viss träning" },
  { v: "mycket aktiv", l: "Mycket aktiv", sub: "Fysiskt tungt jobb och hård träning, dagligen" },
];

const GOALS = [
  { v: "gå ner i vikt", l: "Gå ner i vikt" },
  { v: "gå upp i vikt", l: "Gå upp i vikt" },
  { v: "bibehålla", l: "Bibehålla vikt" },
  { v: "bygga muskler", l: "Bygga muskler" },
  { v: "må bättre", l: "Må bättre allmänt" },
  { v: "fixa min hälsa", l: "Fixa min hälsa" },
  { v: "äta mer varierat", l: "Äta mer varierat" },
];

function ChipGroup({ options, value, onChange, wrapStyle, large, stack, multi }) {
  const isSelected = (v) => multi ? (value || []).includes(v) : value === v;
  return (
    <div style={{
      display: "flex", flexWrap: stack ? "nowrap" : "wrap", flexDirection: stack ? "column" : "row",
      gap: stack ? 10 : 8, marginBottom: 14, ...wrapStyle,
    }}>
      {options.map((o) => {
        const selected = isSelected(o.v);
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 500, textAlign: stack ? "left" : "center",
              fontSize: large ? 14 : 12.5,
              padding: large ? (o.sub ? "13px 18px" : "14px 18px") : "9px 14px",
              borderRadius: large ? 16 : 999, cursor: "pointer",
              border: selected ? "1px solid transparent" : `1px solid rgba(255,255,255,0.08)`,
              background: selected
                ? "linear-gradient(135deg, #F2C063, #8FD9A8)"
                : "rgba(255,255,255,0.05)",
              color: selected ? "#0c1f14" : C.textDim,
              boxShadow: selected ? "0 6px 16px rgba(143,217,168,.3)" : "none",
              transition: "all .15s ease",
            }}
          >
            <div>{o.l}</div>
            {o.sub && (
              <div style={{ fontSize: 11.5, marginTop: 2, color: selected ? "rgba(12,31,20,.75)" : C.textFaint, fontWeight: 400 }}>
                {o.sub}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
const socialBtn = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%",
  background: "rgba(255,255,255,0.9)", color: "#111", border: "none", borderRadius: 16,
  padding: "12px 0", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
};

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 384 512" fill="#111">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-13.9 4.1-17.4 10.2z"/>
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-1.9 14.1-5.1l-6.5-5.5C29.5 35 26.9 36 24 36c-5.2 0-9.6-3.1-11.4-7.7l-6.5 5C9.9 39.8 16.4 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.5-2.4 4.6-4.4 6.1l6.5 5.5C39.7 37.6 44 32.5 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

// ---------- dashboard ----------
function sumMicroAmounts(dailyLog, defs) {
  const totals = {};
  defs.forEach((d) => { totals[d.key] = 0; });
  dailyLog.forEach((entry) => {
    const amounts = entry.microAmounts || {};
    defs.forEach((d) => { totals[d.key] += Number(amounts[d.key]) || 0; });
  });
  return totals;
}

function sumBonus(dailyLog) {
  const totals = {};
  dailyLog.forEach((entry) => {
    (entry.bonus || []).forEach((b) => {
      if (!b.name) return;
      if (!totals[b.name]) totals[b.name] = { name: b.name, amount: b.amount, reason: b.reason };
      else {
        if (b.amount) totals[b.name].amount = b.amount;
        if (b.reason && !totals[b.name].reason) totals[b.name].reason = b.reason;
      }
    });
  });
  return Object.values(totals);
}

function BarRow({ label, value, max, unit, color, colorDim, sublabel }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: 13.5, color: C.text }}>{label}</span>
        <span style={{ ...mono, fontSize: 12, color: C.textDim }}>
          {value}{unit === "%" ? "%" : ` ${unit}`}{sublabel ? ` / ${sublabel}` : ""}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: colorDim, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

function MicroRow({ def, amount, color, colorDim, open, onToggle }) {
  const pct = Math.round((amount / def.rdi) * 100);
  const barPct = Math.min(100, pct);
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13.5, color: C.text }}>{def.name}</span>
          <button
            onClick={onToggle}
            style={{
              width: 15, height: 15, borderRadius: 99, border: `1px solid ${C.borderStrong}`, background: "none",
              color: C.textFaint, fontSize: 10, lineHeight: "13px", cursor: "pointer", padding: 0,
            }}
            aria-label={`Om ${def.name}`}
          >
            i
          </button>
        </div>
        <span style={{ ...mono, fontSize: 11.5, color: C.textDim }}>
          {Math.round(amount * 10) / 10}{def.unit} · {pct}%
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: colorDim, overflow: "hidden" }}>
        <div style={{ width: `${barPct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s ease" }} />
      </div>
      {open && (
        <p className="fade-up" style={{ fontSize: 11.5, color: C.textDim, marginTop: 6, marginBottom: 0, paddingLeft: 2 }}>
          {def.blurb}
        </p>
      )}
    </div>
  );
}

const DAY_LABELS = ["Mån", "Tis", "Ons", "Tors", "Fre", "Lör", "Sön"];

function SettingsRow({ icon: Icon, label, sub, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none",
        border: "none", borderBottom: `1px solid ${C.border}`, padding: "13px 2px", cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 9, background: danger ? "rgba(224,143,143,0.12)" : "rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={15} color={danger ? "#E08F8F" : C.textDim} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, color: danger ? "#E08F8F" : C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 1 }}>{sub}</div>}
      </div>
      <ChevronRight size={15} color={C.textFaint} />
    </button>
  );
}

function SettingsSubHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
        <ChevronLeft size={19} color={C.textDim} />
      </button>
      <p style={{ ...display, fontSize: 16, fontWeight: 600 }}>{title}</p>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 23, borderRadius: 999, border: "none", cursor: "pointer", padding: 2,
        background: on ? "linear-gradient(135deg, #F2C063, #8FD9A8)" : "rgba(255,255,255,0.12)",
        display: "flex", justifyContent: on ? "flex-end" : "flex-start", transition: "background .15s",
      }}
    >
      <div style={{ width: 19, height: 19, borderRadius: 999, background: on ? "#0c1f14" : "#fff" }} />
    </button>
  );
}

function SettingsPage({ profileInfo, setProfileInfo, onSave, onBack, onLogout, onDeleteAccount, units, setUnits }) {
  const [view, setView] = useState("menu"); // menu | profile | units | notifications | subscription | privacy | help | about
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notifs, setNotifs] = useState({ reminder: true, streak: true, weekly: false });

  function handleSave() {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  // ---------- profile ----------
  if (view === "profile") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title="Profil" onBack={() => setView("menu")} />
        <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={onbLabel}>Ålder</label>
              <input value={profileInfo.age} inputMode="numeric"
                onChange={(e) => setProfileInfo((p) => ({ ...p, age: e.target.value.replace(/[^0-9]/g, "") }))}
                style={onbInput} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={onbLabel}>Längd ({units.height === "ft" ? "tum" : "cm"})</label>
              <input value={displayHeight(profileInfo.height, units.height)} inputMode="numeric"
                onChange={(e) => setProfileInfo((p) => ({ ...p, height: parseHeightInput(e.target.value.replace(/[^0-9]/g, ""), units.height) }))}
                style={onbInput} />
            </div>
          </div>
          <label style={onbLabel}>Vikt ({units.weight === "lbs" ? "lbs" : "kg"})</label>
          <input value={displayWeight(profileInfo.weight, units.weight)} inputMode="decimal"
            onChange={(e) => setProfileInfo((p) => ({ ...p, weight: parseWeightInput(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""), units.weight) }))}
            style={{ ...onbInput, marginBottom: 4 }} />

          <label style={onbLabel}>Kön</label>
          <ChipGroup
            options={[{ v: "kvinna", l: "Kvinna" }, { v: "man", l: "Man" }]}
            value={profileInfo.sex} onChange={(v) => setProfileInfo((p) => ({ ...p, sex: v }))}
          />

          <label style={onbLabel}>Aktivitetsnivå</label>
          <ChipGroup options={ACTIVITY_LEVELS} value={profileInfo.activity}
            onChange={(v) => setProfileInfo((p) => ({ ...p, activity: v }))} stack />

          <label style={onbLabel}>Mål (välj gärna flera)</label>
          <ChipGroup
            options={GOALS} value={profileInfo.goal} multi
            onChange={(v) => setProfileInfo((p) => ({
              ...p, goal: p.goal.includes(v) ? p.goal.filter((g) => g !== v) : [...p.goal, v],
            }))}
            stack wrapStyle={{ marginBottom: 4 }}
          />
        </div>
        <button onClick={handleSave} style={{ ...primaryBtn, width: "100%" }}>
          <Check size={15} /> Spara ändringar
        </button>
        {saved && (
          <p className="fade-up" style={{ fontSize: 12, color: C.accent, textAlign: "center", marginTop: 10 }}>
            Sparat — dina mål är omräknade.
          </p>
        )}
      </div>
    );
  }

  // ---------- units ----------
  if (view === "units") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title="Enheter" onBack={() => setView("menu")} />
        <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Vikt</p>
        <ChipGroup options={[{ v: "kg", l: "Kilogram (kg)" }, { v: "lbs", l: "Pund (lbs)" }]} value={units.weight}
          onChange={(v) => setUnits((u) => ({ ...u, weight: v }))} />
        <p style={{ fontSize: 12, color: C.textFaint, margin: "14px 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Längd</p>
        <ChipGroup options={[{ v: "cm", l: "Centimeter (cm)" }, { v: "ft", l: "Fot/tum (ft/in)" }]} value={units.height}
          onChange={(v) => setUnits((u) => ({ ...u, height: v }))} />
        <p style={{ fontSize: 11, color: C.textFaint, marginTop: 16 }}>
          Ändringen gäller direkt — vikt och längd visas och räknas om i din valda enhet överallt i appen (sparas alltid i kg/cm internt).
        </p>
      </div>
    );
  }

  // ---------- notifications ----------
  if (view === "notifications") {
    const rows = [
      { key: "reminder", label: "Påminnelse att logga", sub: "En knuff om du inte loggat något sent på dagen" },
      { key: "streak", label: "Streak-varningar", sub: "Påminnelse innan din streak bryts" },
      { key: "weekly", label: "Veckosammanfattning", sub: "Notis när en ny veckosammanfattning är redo" },
    ];
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title="Notiser" onBack={() => setView("menu")} />
        <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: "4px 18px" }}>
          {rows.map((r) => (
            <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ fontSize: 13.5 }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 1 }}>{r.sub}</div>
              </div>
              <Toggle on={notifs[r.key]} onChange={(v) => setNotifs((n) => ({ ...n, [r.key]: v }))} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- subscription ----------
  if (view === "subscription") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title="Prenumeration" onBack={() => setView("menu")} />
        <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <p style={{ ...display, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Gratis provperiod</p>
          <p style={{ fontSize: 12.5, color: C.textDim, marginBottom: 14 }}>Dag 1 av 7 — full tillgång till alla funktioner.</p>
          <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: "14%", height: "100%", background: "linear-gradient(90deg, #F2C063, #8FD9A8)" }} />
          </div>
        </div>
        <button style={{ ...primaryBtn, width: "100%" }}>Uppgradera till Premium</button>
        <p style={{ fontSize: 11, color: C.textFaint, marginTop: 12, textAlign: "center" }}>
          Ingen betalning krävs under provperioden. Avsluta när som helst.
        </p>
      </div>
    );
  }

  // ---------- privacy ----------
  if (view === "privacy") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title="Dataskydd & export" onBack={() => setView("menu")} />
        <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>
            All din data (loggar, vikt, bilder) sparas på ditt konto och delas aldrig med tredje part utan ditt samtycke.
          </p>
        </div>
        <button style={{ ...ghostBtn, width: "100%", marginBottom: 10, justifyContent: "flex-start", padding: "13px 16px" }}>
          Exportera min data
        </button>
        <button style={{ ...ghostBtn, width: "100%", justifyContent: "flex-start", padding: "13px 16px" }}>
          Läs integritetspolicyn
        </button>
      </div>
    );
  }

  // ---------- help ----------
  if (view === "help") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title="Hjälp & support" onBack={() => setView("menu")} />
        <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <p style={{ fontSize: 13, color: C.textDim, marginBottom: 14, lineHeight: 1.6 }}>
            Stötte du på ett problem, eller har du en idé till en ny funktion? Hör av dig.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.accent }}>
            <Mail size={14} /> hej@karna-app.se
          </div>
        </div>
      </div>
    );
  }

  // ---------- about ----------
  if (view === "about") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title="Om kärna" onBack={() => setView("menu")} />
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <svg width="34" height="37" viewBox="0 0 32 36" style={{ margin: "0 auto 14px" }}>
            <defs>
              <linearGradient id="aboutSeedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F2C063" />
                <stop offset="100%" stopColor="#8FD9A8" />
              </linearGradient>
            </defs>
            <path d="M16 3 C 19 4.5, 19.5 7, 21.5 9 C 29 15, 29 24, 21.5 30.5 C 18 34, 14 34, 10.5 30.5 C 3 24, 3 15, 10.5 9 C 12.5 7, 13 4.5, 16 3 Z" fill="url(#aboutSeedGrad)" />
          </svg>
          <p style={{ ...display, fontSize: 17, fontWeight: 600, marginBottom: 4 }}>kärna</p>
          <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 4 }}>Version 0.1 (prototyp)</p>
          <p style={{ fontSize: 12.5, color: C.textDim, marginTop: 14, maxWidth: 260, marginLeft: "auto", marginRight: "auto" }}>
            Mår kärnan bra, mår hela kroppen bra.
          </p>
        </div>
      </div>
    );
  }

  // ---------- main menu ----------
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
      <SettingsSubHeader title="Inställningar" onBack={onBack} />

      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Konto</p>
      <SettingsRow icon={User} label="Profil" sub="Ålder, vikt, mål och aktivitetsnivå" onClick={() => setView("profile")} />
      <SettingsRow icon={Crown} label="Prenumeration" sub="Dag 1 av 7 — gratis provperiod" onClick={() => setView("subscription")} />

      <p style={{ fontSize: 12, color: C.textFaint, margin: "22px 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Preferenser</p>
      <SettingsRow icon={Ruler} label="Enheter" sub={`${units.weight} · ${units.height}`} onClick={() => setView("units")} />
      <SettingsRow icon={Bell} label="Notiser" onClick={() => setView("notifications")} />

      <p style={{ fontSize: 12, color: C.textFaint, margin: "22px 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Data & support</p>
      <SettingsRow icon={ShieldCheck} label="Dataskydd & export" onClick={() => setView("privacy")} />
      <SettingsRow icon={HelpCircle} label="Hjälp & support" onClick={() => setView("help")} />
      <SettingsRow icon={Info} label="Om kärna" sub="Version 0.1" onClick={() => setView("about")} />

      <p style={{ fontSize: 12, color: C.textFaint, margin: "22px 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>&nbsp;</p>
      <SettingsRow icon={LogOut} label="Logga ut" onClick={onLogout} />

      {!confirmDelete && (
        <SettingsRow icon={Trash2} label="Radera konto" danger onClick={() => setConfirmDelete(true)} />
      )}
      {confirmDelete && (
        <div className="fade-up" style={{ ...glass, borderRadius: 14, padding: 16, marginTop: 12 }}>
          <p style={{ fontSize: 13, marginBottom: 12 }}>
            Är du säker? All din data (loggar, måltider, vikt, bilder) raderas permanent.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirmDelete(false)} style={{ ...ghostBtn, flex: 1 }}>Avbryt</button>
            <button onClick={onDeleteAccount} style={{ ...primaryBtn, flex: 1, background: "#E08F8F", boxShadow: "none", color: "#2a0f0f" }}>
              Ja, radera
            </button>
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 11, color: C.textFaint, marginTop: 26 }}>
        kärna · prototyp v0.1
      </p>
    </div>
  );
}


function HistoryPage({ dayFoodLogs, weekLog, units = { weight: "kg", height: "cm" } }) {
  const todayKey = dateKey(new Date());
  const todayDate = new Date(new Date().toDateString());
  const [viewMonth, setViewMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [selDay, setSelDay] = useState(todayKey);

  // build a Mon-start month grid, padded with leading/trailing days from adjacent months
  const gridStart = getMonday(viewMonth);
  const gridDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)); // 6 full weeks, always enough to cover any month

  const entries = dayFoodLogs[selDay] || [];
  const dayInfo = weekLog[selDay] || {};

  const totals = {
    kcal: entries.reduce((s, e) => s + (e.kcal || 0), 0),
    protein_g: entries.reduce((s, e) => s + (e.protein_g || 0), 0),
    carbs_g: entries.reduce((s, e) => s + (e.carbs_g || 0), 0),
    fat_g: entries.reduce((s, e) => s + (e.fat_g || 0), 0),
  };
  const vitaminTotals = sumMicroAmounts(entries, VITAMINS);
  const mineralTotals = sumMicroAmounts(entries, MINERALS);
  const avgPct = (defs, tot) => {
    const pcts = defs.map((d) => Math.min(((tot[d.key] || 0) / d.rdi) * 100, 100));
    return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
  };

  const monthLabel = viewMonth.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
  const isCurrentMonth = viewMonth.getMonth() === new Date().getMonth() && viewMonth.getFullYear() === new Date().getFullYear();

  function changeMonth(delta) {
    setViewMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + delta); return d; });
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 0" }}>
      <p style={{ ...display, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Kalender</p>
      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 18 }}>Titta tillbaka på vilken dag som helst — bläddra hur långt bak du vill.</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
          <ChevronLeft size={18} color={C.textDim} />
        </button>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 600, textTransform: "capitalize" }}>{monthLabel}</span>
        <button
          onClick={() => !isCurrentMonth && changeMonth(1)}
          disabled={isCurrentMonth}
          style={{ background: "none", border: "none", cursor: isCurrentMonth ? "default" : "pointer", padding: 6, opacity: isCurrentMonth ? 0.25 : 1 }}
        >
          <ChevronRight size={18} color={C.textDim} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
        {DAY_LABELS.map((l) => (
          <div key={l} style={{ textAlign: "center", fontSize: 10, color: C.textFaint, paddingBottom: 4 }}>{l[0]}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 20 }}>
        {gridDays.map((d) => {
          const k = dateKey(d);
          const inMonth = d.getMonth() === viewMonth.getMonth();
          const active = selDay === k;
          const isToday = k === todayKey;
          const future = d > todayDate;
          const hasData = (dayFoodLogs[k] && dayFoodLogs[k].length > 0) || weekLog[k]?.weight || weekLog[k]?.photo;
          return (
            <button
              key={k} onClick={() => !future && inMonth && setSelDay(k)} disabled={future || !inMonth}
              style={{
                aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 2, borderRadius: 9, cursor: future || !inMonth ? "default" : "pointer",
                border: isToday && !active ? `1px solid ${C.accent}` : "1px solid transparent",
                background: active ? "linear-gradient(135deg, #F2C063, #8FD9A8)" : "transparent",
                opacity: !inMonth ? 0.2 : future ? 0.35 : 1,
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 400, color: active ? "#0c1f14" : C.text }}>
                {d.getDate()}
              </span>
              {hasData && <div style={{ width: 3.5, height: 3.5, borderRadius: 99, background: active ? "#0c1f14" : C.accent }} />}
            </button>
          );
        })}
      </div>

      {entries.length === 0 && !dayInfo.weight && !dayInfo.photo && (
        <p style={{ fontSize: 12.5, color: C.textFaint, textAlign: "center", padding: "30px 0" }}>
          Inget loggat den här dagen.
        </p>
      )}

      {(entries.length > 0 || dayInfo.weight || dayInfo.photo) && (
        <>
          <div style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <MiniStat label="Kalorier" value={Math.round(totals.kcal)} unit="kcal" color={C.accent} />
              <MiniStat label="Vitaminer" value={entries.length ? avgPct(VITAMINS, vitaminTotals) : 0} unit="%" color={C.vitamin} />
              <MiniStat label="Mineraler" value={entries.length ? avgPct(MINERALS, mineralTotals) : 0} unit="%" color={C.mineral} />
            </div>
          </div>

          {dayInfo.weight && (
            <div style={{ ...glass, borderRadius: 16, padding: "14px 18px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13 }}>Vikt</span>
              <span style={{ ...mono, fontSize: 13, color: C.text }}>{displayWeight(dayInfo.weight, units.weight)} {units.weight === "lbs" ? "lbs" : "kg"}</span>
            </div>
          )}

          {dayInfo.photo && (
            <div style={{ ...glass, borderRadius: 16, padding: 12, marginBottom: 14, display: "flex", justifyContent: "center" }}>
              <img src={dayInfo.photo} alt="progressbild" style={{ maxHeight: 180, borderRadius: 10 }} />
            </div>
          )}

          {entries.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Loggade måltider
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ ...glass, borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13.5 }}>{e.name || "Måltid"}</span>
                    <span style={{ ...mono, fontSize: 12.5, color: C.accent }}>{Math.round(e.kcal || 0)} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MealBuilderPage({ mealName, setMealName, ingredients, setIngredients, onCancel, onSave }) {
  const [adding, setAdding] = useState(ingredients.length === 0);
  const [ingName, setIngName] = useState("");
  const [ingWeight, setIngWeight] = useState("");
  const [ingUnit, setIngUnit] = useState("g");
  const [ingKnown100, setIngKnown100] = useState({});
  const [ingShow100, setIngShow100] = useState(false);
  const [ingLoading, setIngLoading] = useState(false);
  const [ingError, setIngError] = useState("");

  const totals = ingredients.reduce((acc, ing) => {
    KNOWN_FIELDS.forEach(({ key }) => { acc[key] = (acc[key] || 0) + (ing[key] || 0); });
    return acc;
  }, {});

  async function addIngredient() {
    if (!ingName.trim() || !ingWeight.trim()) return;
    setIngLoading(true); setIngError("");
    const res = await estimateFoodValues(ingName, ingWeight, ingUnit, ingKnown100);
    setIngredients((list) => [...list, { name: ingName, weight: ingWeight, unit: ingUnit, ...res }]);
    if (!res.ok) setIngError("Kunde inte nå AI:n just nu — la till ingrediensen med exempel-värden istället.");
    setIngName(""); setIngWeight(""); setIngUnit("g"); setIngKnown100({}); setIngShow100(false);
    setIngLoading(false);
    setAdding(false);
  }
  function removeIngredient(i) {
    setIngredients((list) => list.filter((_, idx) => idx !== i));
  }

  function saveMeal() {
    if (!mealName.trim() || ingredients.length === 0) return;
    const microAmounts = {};
    ingredients.forEach((ing) => {
      Object.entries(ing.microAmounts || {}).forEach(([k, v]) => { microAmounts[k] = (microAmounts[k] || 0) + v; });
    });
    const bonusMap = {};
    ingredients.forEach((ing) => (ing.bonus || []).forEach((b) => { bonusMap[b.name] = b.amount; }));
    const bonus = Object.entries(bonusMap).map(([name, amount]) => ({ name, amount }));
    onSave({ id: Date.now(), name: mealName, ...totals, microAmounts, bonus, estimatedKeys: [] });
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ChevronLeft size={19} color={C.textDim} />
        </button>
        <p style={{ ...display, fontSize: 16, fontWeight: 600 }}>Ny måltid</p>
      </div>

      <label style={onbLabel}>Namn på måltiden</label>
      <input
        value={mealName} onChange={(e) => setMealName(e.target.value)}
        placeholder="t.ex. Min PWO-måltid" style={{ ...onbInput, marginBottom: 20 }}
      />

      {ingError && (
        <p style={{ fontSize: 11.5, color: "#F2A94B", marginBottom: 12 }}>{ingError}</p>
      )}

      {ingredients.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Ingredienser ({ingredients.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{ ...glass, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5 }}>{ing.name} <span style={{ color: C.textFaint, fontSize: 11.5 }}>· {ing.weight} {UNIT_LABELS[ing.unit] || "g"}</span></p>
                </div>
                <span style={{ ...mono, fontSize: 12, color: C.accent }}>{Math.round(ing.kcal)} kcal</span>
                <button onClick={() => removeIngredient(i)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <X size={14} color={C.textFaint} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ ...glass, borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.textDim }}>Totalt</span>
            <span style={{ ...mono, fontSize: 13, fontWeight: 600 }}>
              {Math.round(totals.kcal || 0)} kcal · {Math.round(totals.protein_g || 0)}g protein
            </span>
          </div>
        </>
      )}

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          style={{
            ...glass, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            borderRadius: 14, padding: "13px 0", marginBottom: 20, color: C.accent, cursor: "pointer", border: "none",
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5,
          }}
        >
          <Plus size={16} /> Lägg till ingrediens
        </button>
      )}

      {adding && (
        <div className="fade-up" style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <label style={onbLabel}>Ingrediens</label>
          <input value={ingName} onChange={(e) => setIngName(e.target.value)} placeholder="t.ex. kycklingfilé" style={onbInput} />
          <label style={onbLabel}>Mängd</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input
              value={ingWeight} inputMode="numeric"
              onChange={(e) => setIngWeight(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="120" style={{ ...onbInput, flex: 1 }}
            />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
              {UNITS.map((u) => (
                <button
                  key={u.v} onClick={() => setIngUnit(u.v)}
                  style={{
                    fontSize: 10.5, padding: "5px 7px", borderRadius: 7, cursor: "pointer",
                    border: ingUnit === u.v ? "1px solid transparent" : `1px solid rgba(255,255,255,0.08)`,
                    background: ingUnit === u.v ? C.accent : "rgba(255,255,255,0.05)",
                    color: ingUnit === u.v ? "#08150E" : C.textDim, fontWeight: ingUnit === u.v ? 600 : 400,
                  }}
                >
                  {u.l}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIngShow100((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 12, padding: "8px 0" }}
          >
            <ChevronDown size={12} style={{ transform: ingShow100 ? "rotate(180deg)" : "none" }} />
            Kända värden per 100g (valfritt)
          </button>
          {ingShow100 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {KNOWN_FIELDS.filter((f) => !f.sub).map((f) => (
                <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: C.textDim }}>{f.label}</span>
                  <input
                    value={ingKnown100[f.key] || ""}
                    onChange={(e) => setIngKnown100((k) => ({ ...k, [f.key]: e.target.value.replace(",", ".").replace(/[^0-9.]/g, "") }))}
                    placeholder="—" inputMode="decimal"
                    style={{ ...mono, width: 60, textAlign: "right", background: "transparent", border: "none", borderBottom: `1px solid rgba(255,255,255,0.1)`, color: C.text, fontSize: 13 }}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => { setAdding(false); setIngName(""); setIngWeight(""); setIngError(""); }} style={ghostBtn}>Avbryt</button>
            <button
              onClick={addIngredient} disabled={!ingName.trim() || !ingWeight.trim() || ingLoading}
              style={{ ...primaryBtn, opacity: !ingName.trim() || !ingWeight.trim() ? 0.5 : 1 }}
            >
              {ingLoading ? "Räknar ut…" : "Lägg till"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={saveMeal}
        disabled={!mealName.trim() || ingredients.length === 0}
        style={{ ...primaryBtn, width: "100%", opacity: !mealName.trim() || ingredients.length === 0 ? 0.5 : 1 }}
      >
        <Check size={15} /> Spara måltid
      </button>
    </div>
  );
}

function MealsPage({ savedMeals, setSavedMeals, onLogMeal, onCreateNew, session }) {
  function removeMeal(id) {
    setSavedMeals((meals) => meals.filter((m) => m.id !== id));
    if (session) {
      supabaseRest("saved_meals", {
        method: "DELETE", accessToken: session.access_token, params: { id: `eq.${id}` },
      }).catch((e) => console.error("Kunde inte radera måltiden:", e.message));
    }
  }
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 0" }}>
      <p style={{ ...display, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Mina måltider</p>
      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 18 }}>
        Spara måltider du äter ofta — logga dem sen med ett klick istället för att fylla i allt igen.
      </p>

      <button
        onClick={onCreateNew}
        style={{
          ...glass, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          borderRadius: 14, padding: "14px 0", marginBottom: 18, color: C.accent, cursor: "pointer", border: "none",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5,
        }}
      >
        <Plus size={16} /> Skapa ny måltid
      </button>

      {savedMeals.length === 0 && (
        <p style={{ fontSize: 12.5, color: C.textFaint, textAlign: "center", padding: "20px 0" }}>
          Inga sparade måltider än. T.ex. din vanliga PWO-måltid — skapa den en gång, logga den sen på en sekund.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {savedMeals.map((meal) => (
          <div key={meal.id} style={{ ...glass, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{meal.name}</p>
              <p style={{ ...mono, fontSize: 11.5, color: C.textFaint }}>
                {Math.round(meal.kcal)} kcal · {Math.round(meal.protein_g)}g protein
              </p>
            </div>
            <button onClick={() => removeMeal(meal.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Trash2 size={15} color={C.textFaint} />
            </button>
            <button onClick={() => onLogMeal(meal)} style={{ ...primaryBtn, padding: "9px 16px", fontSize: 12.5 }}>
              Logga
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressPage({ dailyLog, weekLog, setWeekLog, selectedDay, setSelectedDay, goals = [], units = { weight: "kg", height: "cm" }, session }) {
  const monday = getMonday(new Date());
  const weekDates = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(monday, i));
  const todayKey = dateKey(new Date());
  const isToday = selectedDay === todayKey;
  const dayData = weekLog[selectedDay] || {};
  const isSunday = new Date().getDay() === 0;
  const [showSummary, setShowSummary] = useState(isSunday);

  const weekKeys = weekDates.map(dateKey);
  const weightEntries = weekKeys
    .map((k, i) => ({ day: i, weight: parseFloat(weekLog[k]?.weight) }))
    .filter((e) => !isNaN(e.weight))
    .sort((a, b) => a.day - b.day);
  const daysLogged = weightEntries.length;
  const weightChange = weightEntries.length >= 2
    ? Math.round((weightEntries[weightEntries.length - 1].weight - weightEntries[0].weight) * 10) / 10
    : null;

  function weightMessage() {
    if (weightChange === null) return null;
    const wantsDown = goals.includes("gå ner i vikt");
    const wantsUp = goals.includes("gå upp i vikt");
    const flat = Math.abs(weightChange) < 0.2;
    if (wantsDown) {
      if (weightChange < -0.2) return "Bra jobbat, du är på rätt spår mot ditt mål! 📉";
      if (flat) return "Vikten låg still — kolla gärna över kalorierna om nedgång är målet.";
      return "Inte den bästa veckan för viktnedgång, men du kommer dit. 💪";
    }
    if (wantsUp) {
      if (weightChange > 0.2) return "Bra jobbat, du är på rätt spår mot ditt mål! 📈";
      if (flat) return "Vikten låg still — kolla gärna över kalorierna om uppgång är målet.";
      return "Inte den bästa veckan för viktuppgång, men du kommer dit. 💪";
    }
    // maintain / feel-better / health-focused goals
    if (flat) return "Stabil vecka — precis vad som passar om du vill bibehålla vikten. 👍";
    return "Vikten rörde sig en del denna vecka — helt normalt, följ trenden över flera veckor.";
  }

  // today's real numbers come from the food log; other days have no history yet in this prototype
  const kcalToday = dailyLog.reduce((s, e) => s + (e.kcal || 0), 0);
  const vitaminTotals = sumMicroAmounts(dailyLog, VITAMINS);
  const mineralTotals = sumMicroAmounts(dailyLog, MINERALS);
  const avgPct = (defs, totals) => {
    const pcts = defs.map((d) => Math.min(((totals[d.key] || 0) / d.rdi) * 100, 100));
    return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
  };
  const vitaminPct = isToday ? avgPct(VITAMINS, vitaminTotals) : 0;
  const mineralPct = isToday ? avgPct(MINERALS, mineralTotals) : 0;

  function updateDay(field, value) {
    setWeekLog((w) => {
      const merged = { ...w[selectedDay], [field]: value };
      if (session) {
        supabaseRest("day_info", {
          method: "POST", accessToken: session.access_token, upsert: true,
          body: { user_id: session.user.id, log_date: selectedDay, weight_kg: merged.weight || null, photo_url: merged.photo || null },
        }).catch((e) => console.error("Kunde inte spara:", e.message));
      }
      return { ...w, [selectedDay]: merged };
    });
  }
  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateDay("photo", reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 0" }}>
      <p style={{ ...display, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Denna vecka</p>
      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 18 }}>
        Logga vikt och valfria bilder per dag — så mycket eller lite som du vill.
      </p>

      {isSunday && (
        <div className="fade-up" style={{
          ...glass, borderRadius: 16, padding: "16px 18px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div>
            <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>🎉 1 hel vecka avklarad!</p>
            <p style={{ fontSize: 11.5, color: C.textFaint }}>Här är översikten för denna vecka.</p>
          </div>
          <button onClick={() => setShowSummary((s) => !s)} style={{ ...ghostBtn, padding: "8px 14px", flexShrink: 0 }}>
            {showSummary ? "Dölj" : "Visa"}
          </button>
        </div>
      )}

      {showSummary && (
        <div className="fade-up" style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 18 }}>
          <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Veckosammanfattning</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
            <MiniStat label="Dagar loggade" value={daysLogged} unit="/7" color={C.accent} />
            <MiniStat
              label="Viktförändring"
              value={weightChange === null ? "–" : (() => {
                const converted = units.weight === "lbs" ? Math.round(weightChange * 2.20462 * 10) / 10 : weightChange;
                return converted > 0 ? `+${converted}` : converted;
              })()}
              unit={units.weight === "lbs" ? "lbs" : "kg"} color={C.vitamin}
            />
          </div>
          <p style={{ fontSize: 11, color: C.textFaint, marginTop: 12 }}>
            {daysLogged === 0
              ? "Logga vikt några dagar den här veckan så räknar vi ut din trend."
              : weightChange === null
                ? "Logga vikt minst två dagar för att se en förändring över veckan."
                : "Baserat på första och senaste viktloggningen denna vecka."}
          </p>
          {weightMessage() && (
            <p style={{ ...display, fontSize: 13, fontWeight: 600, marginTop: 12, color: C.accent }}>
              {weightMessage()}
            </p>
          )}
        </div>
      )}

      {!isSunday && !showSummary && (
        <p onClick={() => setShowSummary(true)} style={{ fontSize: 11.5, color: C.accent, cursor: "pointer", marginBottom: 16 }}>
          Se exempel på veckosammanfattning →
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {weekDates.map((d, i) => {
          const k = weekKeys[i];
          const active = selectedDay === k;
          const future = d > new Date(new Date().toDateString());
          return (
            <button
              key={k} onClick={() => !future && setSelectedDay(k)} disabled={future}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "10px 0", borderRadius: 12, cursor: future ? "default" : "pointer", border: "none",
                background: active ? "linear-gradient(135deg, #F2C063, #8FD9A8)" : "rgba(255,255,255,0.05)",
                opacity: future ? 0.35 : 1,
              }}
            >
              <span style={{ fontSize: 10.5, fontWeight: 600, color: active ? "#0c1f14" : C.textFaint }}>{DAY_LABELS[i]}</span>
              <span style={{ fontSize: 9, color: active ? "#0c1f14" : C.textFaint }}>{fmtDayNum(d)}</span>
              {k === todayKey && (
                <div style={{ width: 4, height: 4, borderRadius: 99, background: active ? "#0c1f14" : C.accent }} />
              )}
            </button>
          );
        })}
      </div>

      {!isToday && (
        <p style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 14 }}>
          Ingen historik för den här dagen än i prototypen — kalorier/vitaminer/mineraler visas bara live för idag.
        </p>
      )}

      <div style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: C.textDim, marginBottom: 14 }}>Från matloggningen</p>
        <div style={{ display: "flex", gap: 10 }}>
          <MiniStat label="Kalorier" value={isToday ? Math.round(kcalToday) : "–"} unit="kcal" color={C.accent} />
          <MiniStat label="Vitaminer" value={isToday ? vitaminPct : "–"} unit="%" color={C.vitamin} />
          <MiniStat label="Mineraler" value={isToday ? mineralPct : "–"} unit="%" color={C.mineral} />
        </div>
      </div>

      <div style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 14 }}>
        <label style={onbLabel}>Vikt denna dag ({units.weight === "lbs" ? "lbs" : "kg"})</label>
        <input
          value={dayData.weight ? displayWeight(dayData.weight, units.weight) : ""} inputMode="decimal"
          onChange={(e) => updateDay("weight", parseWeightInput(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""), units.weight))}
          placeholder={units.weight === "lbs" ? "t.ex. 164" : "t.ex. 74.5"} style={onbInput}
        />
      </div>

      <label
        htmlFor="progress-photo"
        style={{
          ...glass, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8, borderRadius: 16, padding: "26px 12px", cursor: "pointer", marginBottom: 24, overflow: "hidden",
        }}
      >
        {dayData.photo ? (
          <img src={dayData.photo} alt="progressbild" style={{ maxHeight: 160, borderRadius: 10 }} />
        ) : (
          <>
            <Camera size={20} color={C.textDim} />
            <span style={{ fontSize: 12.5, color: C.textDim }}>Lägg till progressbild för {DAY_LABELS[selectedDay]}</span>
            <span style={{ fontSize: 11, color: C.textFaint }}>Helt valfritt — dagligen, veckovis, eller aldrig</span>
          </>
        )}
      </label>
      <input id="progress-photo" type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
    </div>
  );
}

function MiniStat({ label, value, unit, color }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ ...mono, fontSize: 17, fontWeight: 600, color }}>{value}{value !== "–" && <span style={{ fontSize: 11 }}>{unit}</span>}</div>
      <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Dashboard({ dailyLog, targets }) {
  const [pageIdx, setPageIdx] = useState(0);
  const [openInfo, setOpenInfo] = useState(null); // single key — only one info text open at a time
  const touchStartX = useRef(0);

  const totals = {
    kcal: dailyLog.reduce((s, e) => s + (e.kcal || 0), 0),
    protein_g: dailyLog.reduce((s, e) => s + (e.protein_g || 0), 0),
    carbs_g: dailyLog.reduce((s, e) => s + (e.carbs_g || 0), 0),
    fat_g: dailyLog.reduce((s, e) => s + (e.fat_g || 0), 0),
  };
  const vitaminTotals = sumMicroAmounts(dailyLog, VITAMINS);
  const mineralTotals = sumMicroAmounts(dailyLog, MINERALS);
  const bonusList = sumBonus(dailyLog);

  const toggle = (key) => setOpenInfo((cur) => (cur === key ? null : key));

  const pages = [
    { key: "macros", label: "Makros" },
    { key: "vitamins", label: "Vitaminer" },
    { key: "minerals", label: "Mineraler" },
    { key: "bonus", label: "Bra ämnen" },
    { key: "ranking", label: "Hälsoranking" },
  ];

  function goToPage(i) {
    setPageIdx(Math.max(0, Math.min(pages.length - 1, i)));
  }
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 40) return; // not a real swipe
    if (delta < 0) goToPage(pageIdx + 1); // swiped left → next page
    else goToPage(pageIdx - 1); // swiped right → previous page
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 0" }}>
      {dailyLog.length === 0 && (
        <p style={{ fontSize: 12, color: C.textFaint, textAlign: "center", marginBottom: 16 }}>
          Inget loggat idag än — här är hur det ser ut tills du loggar något.
        </p>
      )}

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div key={pageIdx} className="fade-up">
          {/* macros */}
          {pageIdx === 0 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 18, color: C.accent }}>Makros idag</p>
              <BarRow label="Kalorier" value={Math.round(totals.kcal)} max={targets.kcal} unit="kcal" sublabel={targets.kcal} color={C.accent} colorDim={C.accentDim} />
              <BarRow label="Protein" value={Math.round(totals.protein_g)} max={targets.protein_g} unit="g" sublabel={targets.protein_g} color={C.accent} colorDim={C.accentDim} />
              <BarRow label="Kolhydrater" value={Math.round(totals.carbs_g)} max={targets.carbs_g} unit="g" sublabel={targets.carbs_g} color={C.accent} colorDim={C.accentDim} />
              <BarRow label="Fett" value={Math.round(totals.fat_g)} max={targets.fat_g} unit="g" sublabel={targets.fat_g} color={C.accent} colorDim={C.accentDim} />
            </div>
          )}

          {/* vitamins — full canonical list, always shown, even at 0 */}
          {pageIdx === 1 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 18, color: C.vitamin }}>Vitaminer idag</p>
              {VITAMINS.map((v) => (
                <MicroRow
                  key={v.key} def={v} amount={vitaminTotals[v.key] || 0}
                  color={C.vitamin} colorDim={C.vitaminDim}
                  open={openInfo === v.key} onToggle={() => toggle(v.key)}
                />
              ))}
            </div>
          )}

          {/* minerals — full canonical list, always shown, even at 0 */}
          {pageIdx === 2 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 18, color: C.mineral }}>Mineraler idag</p>
              {MINERALS.map((m) => (
                <MicroRow
                  key={m.key} def={m} amount={mineralTotals[m.key] || 0}
                  color={C.mineral} colorDim={C.mineralDim}
                  open={openInfo === m.key} onToggle={() => toggle(m.key)}
                />
              ))}
            </div>
          )}

          {/* bonus — open-ended, only what's actually been eaten */}
          {pageIdx === 3 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.bonus }}>Bra ämnen idag</p>
              <p style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 16 }}>
                Visas bara här om du faktiskt fått i dig något av det — ingen lista över allt som finns.
              </p>
              {bonusList.length === 0 && <p style={{ fontSize: 12.5, color: C.textFaint }}>Inget upptäckt än idag.</p>}
              {bonusList.map((b) => {
                const open = openInfo === `bonus-${b.name}`;
                return (
                  <div key={b.name} style={{ padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13.5 }}>{b.name}</span>
                        {b.reason && (
                          <button
                            onClick={() => toggle(`bonus-${b.name}`)}
                            style={{
                              width: 15, height: 15, borderRadius: 99, border: `1px solid ${C.textFaint}`,
                              background: "none", color: C.textFaint, fontSize: 10, lineHeight: "13px",
                              cursor: "pointer", padding: 0, flexShrink: 0,
                            }}
                          >
                            i
                          </button>
                        )}
                      </div>
                      <span style={{ ...mono, fontSize: 12, color: C.bonus }}>{b.amount || "spårmängd"}</span>
                    </div>
                    {open && (
                      <p className="fade-up" style={{ fontSize: 11.5, color: C.textFaint, marginTop: 6 }}>
                        {b.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* health ranking — how today's food supports different areas of the body */}
          {pageIdx === 4 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Hälsoranking idag</p>
              <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 16 }}>
                Uppskattat stöd från det du ätit — inte ett medicinskt mått.
              </p>
              {HEALTH_CATEGORIES.map((cat) => {
                const score = calcHealthScore(cat, dailyLog, targets);
                const key = `rank-${cat.key}`;
                const open = openInfo === key;
                return (
                  <div key={cat.key} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15 }}>{cat.emoji}</span>
                        <span style={{ fontSize: 13.5 }}>{cat.label}</span>
                        <button
                          onClick={() => toggle(key)}
                          style={{
                            width: 15, height: 15, borderRadius: 99, border: `1px solid ${C.textFaint}`,
                            background: "none", color: C.textFaint, fontSize: 10, lineHeight: "13px",
                            cursor: "pointer", padding: 0, flexShrink: 0,
                          }}
                        >
                          i
                        </button>
                      </div>
                      <span style={{ ...mono, fontSize: 13, fontWeight: 600, color: cat.color }}>{score}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ width: `${score}%`, height: "100%", background: cat.color, borderRadius: 3 }} />
                    </div>
                    {open && (
                      <p className="fade-up" style={{ fontSize: 11.5, color: C.textFaint, marginTop: 8 }}>
                        {cat.blurb}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "16px 0 8px" }}>
            {pages.map((p, i) => (
              <button
                key={p.key} onClick={() => goToPage(i)}
                style={{
                  width: pageIdx === i ? 16 : 6, height: 6, borderRadius: 4, border: "none", cursor: "pointer",
                  background: pageIdx === i ? C.accent : C.border, transition: "all .2s",
                }}
                aria-label={p.label}
              />
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 11.5, color: C.textFaint, marginBottom: 8 }}>
            {pages[pageIdx].label} — svep för fler
          </p>
    </div>
  );
}

const primaryBtn = {
  display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5, fontWeight: 600,
  color: "#0c1f14", background: "linear-gradient(135deg, #F2C063, #8FD9A8)", border: "none", borderRadius: 14,
  padding: "12px 18px", cursor: "pointer", flex: "0 0 auto", boxShadow: "0 8px 20px rgba(143,217,168,.25)",
};
const ghostBtn = {
  display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
  color: C.textDim, background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 14,
  padding: "10px 16px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
};
