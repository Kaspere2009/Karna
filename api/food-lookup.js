// api/food-lookup.js — söker livsmedel åt appen.
//  POST { query, country, lang }                     → { results }            (lista att välja ur)
//  POST { query, original, country, lang, resolve }  → { results, pick, via } (väljer rätt rad åt dig)
//  POST { barcode, lang }                            → { product }            (streckkod via Open Food Facts)
// Alla värden är per 100 g, direkt från databasen. AI:n väljer bara rad — den hittar aldrig på värden.
import { searchAll, resolveFood, lookupBarcode } from "./_lib/food.js";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Endast POST." });
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; }
  }
  try {
    const lang = body.lang === "en" ? "en" : "sv";
    if (body.barcode) return res.status(200).json({ product: await lookupBarcode(body.barcode, lang) });

    const query = String(body.query || "").trim().slice(0, 100);
    if (query.length < 2) return res.status(200).json({ results: [] });
    const country = body.country ? String(body.country).toUpperCase().slice(0, 5) : null;

    if (body.resolve) {
      const original = String(body.original || query).slice(0, 200);
      return res.status(200).json(await resolveFood({ query, original, country, lang }));
    }
    return res.status(200).json({ results: await searchAll(query, country, lang) });
  } catch (e) {
    console.error("[food-lookup] fel:", e.message);
    return res.status(200).json({ results: [], error: e.message });
  }
}
