// Söker livsmedel och returnerar en LISTA med träffar som användaren väljer bland.
// USDA FoodData Central (vanliga råvaror, med vitaminer & mineraler) + Open Food Facts (märkesvaror).
// Vanliga svenska ord översätts till engelska med en inbyggd ordlista innan USDA-sökningen.

// ---------- svenska → engelska (vanliga livsmedel) ----------
const SV_TO_EN = {
  "kyckling": "chicken breast", "kycklingfilé": "chicken breast", "kycklingfile": "chicken breast",
  "kycklingbröst": "chicken breast", "kycklinglår": "chicken thigh", "kalkon": "turkey breast",
  "nötfärs": "ground beef", "köttfärs": "ground beef", "nötkött": "beef", "fläskkött": "pork",
  "fläskfilé": "pork tenderloin", "skinka": "ham", "bacon": "bacon", "korv": "sausage",
  "lax": "salmon", "torsk": "cod", "tonfisk": "tuna", "räkor": "shrimp",
  "ägg": "egg whole", "mjölk": "milk", "lättmjölk": "milk lowfat", "yoghurt": "yogurt plain",
  "grekisk yoghurt": "greek yogurt", "keso": "cottage cheese", "ost": "cheese", "smör": "butter",
  "grädde": "cream", "ris": "rice", "kokt ris": "rice cooked", "fullkornsris": "rice brown",
  "pasta": "pasta", "kokt pasta": "pasta cooked", "spaghetti": "spaghetti", "quinoa": "quinoa",
  "potatis": "potato", "kokt potatis": "potato boiled", "sötpotatis": "sweet potato",
  "havregryn": "oats", "bröd": "bread", "knäckebröd": "crispbread", "banan": "banana",
  "äpple": "apple", "apelsin": "orange", "päron": "pear", "jordgubbar": "strawberries",
  "blåbär": "blueberries", "hallon": "raspberries", "vindruvor": "grapes", "avokado": "avocado",
  "mango": "mango", "ananas": "pineapple", "kiwi": "kiwifruit", "citron": "lemon",
  "tomat": "tomato", "tomater": "tomato", "gurka": "cucumber", "morot": "carrot", "morötter": "carrot",
  "broccoli": "broccoli", "blomkål": "cauliflower", "spenat": "spinach", "sallad": "lettuce",
  "lök": "onion", "gul lök": "onion", "vitlök": "garlic", "paprika": "peppers sweet",
  "majs": "corn sweet", "ärtor": "peas green", "kidneybönor": "beans kidney", "bönor": "beans",
  "kikärtor": "chickpeas", "linser": "lentils", "champinjoner": "mushrooms", "svamp": "mushrooms",
  "zucchini": "zucchini", "jordnötter": "peanuts", "jordnötssmör": "peanut butter",
  "mandlar": "almonds", "mandel": "almonds", "cashewnötter": "cashew", "valnötter": "walnuts",
  "olivolja": "olive oil", "rapsolja": "canola oil", "socker": "sugar", "honung": "honey",
  "choklad": "chocolate", "mörk choklad": "dark chocolate", "kaffe": "coffee brewed",
  "te": "tea brewed", "apelsinjuice": "orange juice", "tofu": "tofu",
};

const PROCESSED = /(dried|dehydrated|powder|chips|juice|canned|cooked|boiled|frozen|fried|roasted|breaded|smoked)/i;
const DISH = /(salad|soup|sandwich|nuggets|patties|spread|baby food|restaurant|fast food|pie|casserole|stew)/i;

// ---------- vitaminer & mineraler: appens nyckel → USDA-namn + appens enhet ----------
const USDA_MICROS = {
  vit_a: { names: ["Vitamin A, RAE"], unit: "µg" },
  vit_c: { names: ["Vitamin C, total ascorbic acid"], unit: "mg" },
  vit_d: { names: ["Vitamin D (D2 + D3)", "Vitamin D (D2 + D3), International Units"], unit: "µg" },
  vit_e: { names: ["Vitamin E (alpha-tocopherol)"], unit: "mg" },
  vit_k: { names: ["Vitamin K (phylloquinone)"], unit: "µg" },
  b1: { names: ["Thiamin"], unit: "mg" },
  b2: { names: ["Riboflavin"], unit: "mg" },
  b3: { names: ["Niacin"], unit: "mg" },
  b5: { names: ["Pantothenic acid"], unit: "mg" },
  b6: { names: ["Vitamin B-6"], unit: "mg" },
  b7: { names: ["Biotin"], unit: "µg" },
  b9: { names: ["Folate, DFE", "Folate, total"], unit: "µg" },
  b12: { names: ["Vitamin B-12"], unit: "µg" },
  choline: { names: ["Choline, total"], unit: "mg" },
  calcium: { names: ["Calcium, Ca"], unit: "mg" },
  iron: { names: ["Iron, Fe"], unit: "mg" },
  magnesium: { names: ["Magnesium, Mg"], unit: "mg" },
  zinc: { names: ["Zinc, Zn"], unit: "mg" },
  potassium: { names: ["Potassium, K"], unit: "mg" },
  phosphorus: { names: ["Phosphorus, P"], unit: "mg" },
  selenium: { names: ["Selenium, Se"], unit: "µg" },
  copper: { names: ["Copper, Cu"], unit: "mg" },
  manganese: { names: ["Manganese, Mn"], unit: "mg" },
  iodine: { names: ["Iodine, I"], unit: "µg" },
  sodium: { names: ["Sodium, Na"], unit: "mg" },
  fluoride: { names: ["Fluoride, F"], unit: "mg" },
};

// Open Food Facts anger allt i gram per 100 g
const OFF_MICROS = {
  vit_a: ["vitamin-a"], vit_c: ["vitamin-c"], vit_d: ["vitamin-d"], vit_e: ["vitamin-e"],
  vit_k: ["vitamin-k", "phylloquinone"], b1: ["vitamin-b1"], b2: ["vitamin-b2"],
  b3: ["vitamin-pp"], b5: ["pantothenic-acid"], b6: ["vitamin-b6"], b7: ["biotin"],
  b9: ["vitamin-b9", "folates"], b12: ["vitamin-b12"], choline: ["choline"],
  calcium: ["calcium"], iron: ["iron"], magnesium: ["magnesium"], zinc: ["zinc"],
  potassium: ["potassium"], phosphorus: ["phosphorus"], selenium: ["selenium"],
  copper: ["copper"], manganese: ["manganese"], iodine: ["iodine"], sodium: ["sodium"],
  chloride: ["chloride"], chromium: ["chromium"], molybdenum: ["molybdenum"], fluoride: ["fluoride"],
};
const APP_UNITS = Object.fromEntries(Object.entries(USDA_MICROS).map(([k, v]) => [k, v.unit]));
Object.assign(APP_UNITS, { chloride: "mg", chromium: "µg", molybdenum: "µg" });

const TO_MG = { G: 1000, MG: 1, UG: 0.001, "µG": 0.001 };
function convertMass(value, fromUnit, toUnit) {
  const f = TO_MG[(fromUnit || "").toUpperCase()];
  if (f === undefined) return null;
  const mg = value * f;
  return toUnit === "µg" ? mg * 1000 : mg;
}
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const nonNeg = (n) => (typeof n === "number" && n > 0 ? n : 0); // USDA kan ge t.ex. -0.4 g kolhydrater

function fetchWithTimeout(url, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// ---------- USDA ----------
function scoreUsda(description, words, askedProcessed, askedDish) {
  const d = description.toLowerCase();
  let s = 0;
  if (d.startsWith(words[0])) s += 3;
  words.forEach((w) => { if (d.includes(w)) s += 1; });
  if (!askedProcessed) {
    if (/,\s*raw\b/.test(d)) s += 2;
    if (PROCESSED.test(d)) s -= 1;
  }
  if (!askedDish && DISH.test(d)) s -= 5;
  s -= d.length / 200;
  return s;
}

function usdaValue(food, names, wantKcal) {
  const list = food.foodNutrients || [];
  for (const name of names) {
    const matches = list.filter((x) => x.nutrientName === name);
    if (!matches.length) continue;
    if (wantKcal) {
      const kcal = matches.find((x) => (x.unitName || "").toUpperCase() === "KCAL");
      if (kcal) return kcal.value;
      const kj = matches.find((x) => (x.unitName || "").toUpperCase() === "KJ");
      if (kj) return kj.value / 4.184;
      continue;
    }
    return matches[0].value;
  }
  return 0;
}

function usdaMicros(food) {
  const list = food.foodNutrients || [];
  const out = {};
  for (const [key, def] of Object.entries(USDA_MICROS)) {
    for (const name of def.names) {
      const n = list.find((x) => x.nutrientName === name);
      if (!n || typeof n.value !== "number") continue;
      let v;
      if ((n.unitName || "").toUpperCase() === "IU") v = key === "vit_d" ? n.value / 40 : null;
      else v = convertMass(n.value, n.unitName, def.unit);
      if (v !== null && v >= 0) { out[key] = round(v, 3); break; }
    }
  }
  return out;
}

async function searchUsda(term) {
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(term)}` +
    `&pageSize=40&dataType=Foundation,SR%20Legacy&requireAllWords=true&api_key=${key}`;
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const foods = data.foods || [];
  const t = term.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const askedProcessed = PROCESSED.test(t);
  const askedDish = DISH.test(t);

  return foods
    .map((f) => ({ f, s: scoreUsda(f.description || "", words, askedProcessed, askedDish) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map(({ f }) => ({
      id: `usda-${f.fdcId}`,
      source: "USDA FoodData Central",
      name: f.description || term,
      per100: {
        kcal: round(nonNeg(usdaValue(f, ["Energy", "Energy (Atwater General Factors)", "Energy (Atwater Specific Factors)"], true)), 1),
        protein_g: round(nonNeg(usdaValue(f, ["Protein"])), 1),
        carbs_g: round(nonNeg(usdaValue(f, ["Carbohydrate, by difference"])), 1),
        sugar_g: round(nonNeg(usdaValue(f, ["Sugars, total including NLEA", "Total Sugars", "Sugars, Total"])), 1),
        fiber_g: round(nonNeg(usdaValue(f, ["Fiber, total dietary"])), 1),
        fat_g: round(nonNeg(usdaValue(f, ["Total lipid (fat)"])), 1),
        satfat_g: round(nonNeg(usdaValue(f, ["Fatty acids, total saturated"])), 1),
        transfat_g: round(nonNeg(usdaValue(f, ["Fatty acids, total trans"])), 1),
      },
      micros100: (() => { const m = usdaMicros(f); return Object.keys(m).length ? m : null; })(),
    }));
}

// ---------- Open Food Facts ----------
async function searchOpenFoodFacts(term) {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}` +
    `&search_simple=1&action=process&json=1&page_size=15`;
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  return (data.products || [])
    .filter((p) => p.product_name && p.nutriments && (p.nutriments["energy-kcal_100g"] ?? p.nutriments["energy-kcal"]) != null)
    .filter((p) => words.every((w) => p.product_name.toLowerCase().includes(w)))
    .slice(0, 4)
    .map((p) => {
      const n = p.nutriments;
      const micros100 = {};
      for (const [key, names] of Object.entries(OFF_MICROS)) {
        for (const nm of names) {
          const v = n[`${nm}_100g`];
          if (typeof v === "number" && v >= 0) {
            micros100[key] = round(convertMass(v, "G", APP_UNITS[key] || "mg"), 3);
            break;
          }
        }
      }
      return {
        id: `off-${p.code || p._id}`,
        source: "Open Food Facts",
        name: p.product_name,
        brand: (p.brands || "").split(",")[0].trim() || null,
        per100: {
          kcal: round(nonNeg(n["energy-kcal_100g"] ?? n["energy-kcal"]), 1),
          protein_g: round(nonNeg(n["proteins_100g"]), 1),
          carbs_g: round(nonNeg(n["carbohydrates_100g"]), 1),
          sugar_g: round(nonNeg(n["sugars_100g"]), 1),
          fiber_g: round(nonNeg(n["fiber_100g"]), 1),
          fat_g: round(nonNeg(n["fat_100g"]), 1),
          satfat_g: round(nonNeg(n["saturated-fat_100g"]), 1),
          transfat_g: round(nonNeg(n["trans-fat_100g"]), 1),
        },
        micros100: Object.keys(micros100).length ? micros100 : null,
      };
    });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { query } = req.body || {};
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Ingen sökterm angiven." });
  }

  const original = query.trim().toLowerCase();
  const english = SV_TO_EN[original] || original;

  // båda databaserna söks samtidigt; USDA-träffarna visas först
  const [usda, off] = await Promise.allSettled([searchUsda(english), searchOpenFoodFacts(original)]);
  const results = [
    ...(usda.status === "fulfilled" ? usda.value : []),
    ...(off.status === "fulfilled" ? off.value : []),
  ];

  return res.status(200).json({ results });
}
