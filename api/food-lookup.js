// Slår upp riktiga näringsvärden från USDA FoodData Central (generiska råvaror, söks FÖRST)
// och Open Food Facts (märkesvaror, fallback). Vanliga svenska ord översätts till engelska
// med en inbyggd ordlista, så att t.ex. "kyckling" hittas utan att AI behövs.

// ---------- svenska → engelska (vanliga livsmedel) ----------
// Ris och pasta antas vara kokt vikt, eftersom det är så de flesta väger dem.
const SV_TO_EN = {
  "kyckling": "chicken breast",
  "kycklingfilé": "chicken breast",
  "kycklingfile": "chicken breast",
  "kycklingbröst": "chicken breast",
  "kycklinglår": "chicken thigh",
  "kalkon": "turkey breast",
  "nötfärs": "ground beef",
  "köttfärs": "ground beef",
  "nötkött": "beef",
  "fläskkött": "pork",
  "fläskfilé": "pork tenderloin",
  "skinka": "ham",
  "bacon": "bacon",
  "korv": "sausage",
  "lax": "salmon",
  "torsk": "cod",
  "tonfisk": "tuna",
  "räkor": "shrimp",
  "ägg": "egg whole",
  "mjölk": "milk whole",
  "lättmjölk": "milk lowfat",
  "yoghurt": "yogurt plain",
  "grekisk yoghurt": "greek yogurt plain",
  "keso": "cottage cheese",
  "ost": "gouda cheese",
  "smör": "butter",
  "grädde": "cream heavy",
  "ris": "rice white cooked",
  "kokt ris": "rice white cooked",
  "fullkornsris": "rice brown cooked",
  "pasta": "pasta cooked",
  "kokt pasta": "pasta cooked",
  "spaghetti": "spaghetti cooked",
  "quinoa": "quinoa cooked",
  "potatis": "potato",
  "kokt potatis": "potato boiled",
  "sötpotatis": "sweet potato",
  "havregryn": "oats",
  "bröd": "bread whole wheat",
  "knäckebröd": "crispbread rye",
  "banan": "banana",
  "äpple": "apple",
  "apelsin": "orange",
  "päron": "pear",
  "jordgubbar": "strawberries",
  "blåbär": "blueberries",
  "hallon": "raspberries",
  "vindruvor": "grapes",
  "avokado": "avocado",
  "mango": "mango",
  "ananas": "pineapple",
  "kiwi": "kiwifruit",
  "citron": "lemon",
  "tomat": "tomato",
  "tomater": "tomato",
  "gurka": "cucumber",
  "morot": "carrot",
  "morötter": "carrot",
  "broccoli": "broccoli",
  "blomkål": "cauliflower",
  "spenat": "spinach",
  "sallad": "lettuce",
  "lök": "onion",
  "gul lök": "onion",
  "vitlök": "garlic",
  "paprika": "peppers sweet red",
  "majs": "corn sweet",
  "ärtor": "peas green",
  "kidneybönor": "beans kidney",
  "bönor": "beans kidney",
  "kikärtor": "chickpeas",
  "linser": "lentils",
  "champinjoner": "mushrooms white",
  "svamp": "mushrooms",
  "zucchini": "zucchini",
  "jordnötter": "peanuts",
  "jordnötssmör": "peanut butter",
  "mandlar": "almonds",
  "mandel": "almonds",
  "cashewnötter": "cashew nuts",
  "valnötter": "walnuts",
  "olivolja": "olive oil",
  "rapsolja": "canola oil",
  "socker": "sugar",
  "honung": "honey",
  "choklad": "chocolate",
  "mörk choklad": "dark chocolate",
  "kaffe": "coffee brewed",
  "te": "tea brewed",
  "apelsinjuice": "orange juice",
  "tofu": "tofu",
};

// ord som betyder att det är en bearbetad form eller en hel rätt, inte själva råvaran
const PROCESSED = /(dried|dehydrated|powder|chips|juice|canned|cooked|boiled|frozen|fried|roasted|breaded|smoked)/i;
const DISH = /(salad|soup|sandwich|nuggets|patties|spread|baby food|restaurant|fast food|pie|casserole|stew)/i;

function fetchWithTimeout(url, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// poängsätter en USDA-träff: högre = bättre match för det användaren skrev
function scoreUsda(description, words, askedProcessed, askedDish) {
  const d = description.toLowerCase();
  let s = 0;
  if (d.startsWith(words[0])) s += 3;
  words.forEach((w) => { if (d.includes(w)) s += 1; });
  if (!askedProcessed) {
    if (/,\s*raw\b/.test(d)) s += 2;
    if (PROCESSED.test(d)) s -= 3;
  }
  if (!askedDish && DISH.test(d)) s -= 5;
  s -= d.length / 200; // kortare, enklare beskrivningar är oftast den vanliga varianten
  return s;
}

function usdaValue(food, names, preferKcal) {
  const list = food.foodNutrients || [];
  for (const name of names) {
    const matches = list.filter((x) => x.nutrientName === name);
    if (!matches.length) continue;
    if (preferKcal) {
      const kcal = matches.find((x) => (x.unitName || "").toUpperCase() === "KCAL");
      if (kcal) return kcal.value;
      const kj = matches.find((x) => (x.unitName || "").toUpperCase() === "KJ");
      if (kj) return Math.round(kj.value / 4.184);
    }
    return matches[0].value;
  }
  return 0;
}

async function searchUsda(term) {
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(term)}` +
    `&pageSize=25&dataType=Foundation,SR%20Legacy&requireAllWords=true&api_key=${key}`;
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const foods = data.foods || [];
  if (!foods.length) return null;

  const t = term.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const askedProcessed = PROCESSED.test(t);
  const askedDish = DISH.test(t);
  const best = foods
    .map((f) => ({ f, s: scoreUsda(f.description || "", words, askedProcessed, askedDish) }))
    .sort((a, b) => b.s - a.s)[0].f;

  return {
    found: true,
    source: "USDA FoodData Central",
    name: best.description || term,
    per100: {
      kcal: usdaValue(best, ["Energy", "Energy (Atwater General Factors)", "Energy (Atwater Specific Factors)"], true),
      protein_g: usdaValue(best, ["Protein"]),
      carbs_g: usdaValue(best, ["Carbohydrate, by difference"]),
      sugar_g: usdaValue(best, ["Sugars, total including NLEA", "Total Sugars", "Sugars, Total"]),
      fiber_g: usdaValue(best, ["Fiber, total dietary"]),
      fat_g: usdaValue(best, ["Total lipid (fat)"]),
      satfat_g: usdaValue(best, ["Fatty acids, total saturated"]),
      transfat_g: usdaValue(best, ["Fatty acids, total trans"]),
    },
  };
}

async function searchOpenFoodFacts(term) {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}` +
    `&search_simple=1&action=process&json=1&page_size=10`;
  const res = await fetchWithTimeout(url);
  const data = await res.json();
  const candidates = (data.products || []).filter(
    (p) => p.nutriments && (p.nutriments["energy-kcal_100g"] || p.nutriments["energy-kcal"])
  );
  const q = term.trim().toLowerCase();
  const askedProcessed = PROCESSED.test(q);
  const plain = askedProcessed ? candidates : candidates.filter((p) => !PROCESSED.test(p.product_name || ""));
  const pool = plain.length ? plain : candidates;
  // strikt matchning: exakt namn, eller att produktnamnet BÖRJAR med sökningen
  // (inte "innehåller" — det gav falska träffar som hela sallader bara för att ett ord fanns i namnet)
  const nameOf = (p) => (p.product_name || "").toLowerCase();
  const product =
    pool.find((p) => nameOf(p) === q) ||
    pool.find((p) => nameOf(p).startsWith(q + " ") || nameOf(p).startsWith(q + ","));
  if (!product) return null;

  const n = product.nutriments;
  return {
    found: true,
    source: "Open Food Facts",
    name: product.product_name || term,
    per100: {
      kcal: n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0,
      protein_g: n["proteins_100g"] ?? 0,
      carbs_g: n["carbohydrates_100g"] ?? 0,
      sugar_g: n["sugars_100g"] ?? 0,
      fiber_g: n["fiber_100g"] ?? 0,
      fat_g: n["fat_100g"] ?? 0,
      satfat_g: n["saturated-fat_100g"] ?? 0,
      transfat_g: n["trans-fat_100g"] ?? 0,
    },
  };
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

  // 1. USDA först — bäst för vanliga råvaror (kyckling, morot, ris ...)
  try {
    const hit = await searchUsda(english);
    if (hit) return res.status(200).json(hit);
  } catch (e) {
    // fortsätt till Open Food Facts
  }

  // 2. Open Food Facts — bäst för märkesvaror, söks med det användaren faktiskt skrev
  try {
    const hit = await searchOpenFoodFacts(original);
    if (hit) return res.status(200).json(hit);
  } catch (e) {
    // ingen träff
  }

  return res.status(200).json({ found: false });
}
