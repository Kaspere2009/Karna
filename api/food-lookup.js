// Slår upp riktiga näringsvärden från USDA FoodData Central (generiska råvaror)
// och Open Food Facts (märkesvaror, global/svensk täckning). Ingen AI-gissning
// behövs för själva makronutrienterna längre — bara för vitaminer/mineraler/enheter.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Ingen sökterm angiven." });
  }

  // ---------- 1. Försök Open Food Facts först (bäst för märkesvaror) ----------
  try {
    const offRes = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`
    );
    const offData = await offRes.json();
    const candidates = (offData.products || []).filter((p) => p.nutriments && (p.nutriments["energy-kcal_100g"] || p.nutriments["energy-kcal"]));
    const q = query.trim().toLowerCase();
    // prioritera produkter vars namn faktiskt liknar sökningen, före bara första träffen
    const closeMatch = candidates.find((p) => (p.product_name || "").toLowerCase().includes(q) || q.includes((p.product_name || "").toLowerCase()));
    const product = closeMatch || candidates[0];
    if (product) {
      const n = product.nutriments;
      return res.status(200).json({
        found: true,
        source: "Open Food Facts",
        name: product.product_name || query,
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
      });
    }
  } catch (e) {
    // fortsätt till USDA om Open Food Facts misslyckas
  }

  // ---------- 2. Fall tillbaka till USDA FoodData Central ----------
  const usdaKey = process.env.USDA_API_KEY || "DEMO_KEY";
  try {
    const usdaRes = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&dataType=Foundation,SR%20Legacy&api_key=${usdaKey}`
    );
    const usdaData = await usdaRes.json();
    const usdaCandidates = usdaData.foods || [];
    const uq = query.trim().toLowerCase();
    const usdaCloseMatch = usdaCandidates.find((f) => (f.description || "").toLowerCase().startsWith(uq));
    const food = usdaCloseMatch || usdaCandidates[0];
    if (food) {
      const get = (name) => {
        const n = (food.foodNutrients || []).find((x) => x.nutrientName === name);
        return n ? n.value : 0;
      };
      return res.status(200).json({
        found: true,
        source: "USDA FoodData Central",
        name: food.description || query,
        per100: {
          kcal: get("Energy"),
          protein_g: get("Protein"),
          carbs_g: get("Carbohydrate, by difference"),
          sugar_g: get("Total Sugars") || get("Sugars, total including NLEA"),
          fiber_g: get("Fiber, total dietary"),
          fat_g: get("Total lipid (fat)"),
          satfat_g: get("Fatty acids, total saturated"),
          transfat_g: get("Fatty acids, total trans"),
        },
      });
    }
  } catch (e) {
    // ingen träff alls
  }

  return res.status(200).json({ found: false });
}
