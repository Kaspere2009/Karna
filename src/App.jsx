import { useState, useRef, useEffect } from "react";
import {
  Terminal, Camera, Keyboard, Loader2, Send, Sparkles,
  Check, X, ChevronRight, ChevronLeft, Flame, Dot, ChevronDown, Mail, LayoutGrid, TrendingUp, Home,
  CalendarDays, BookOpen, Plus, Trash2, Settings, User, Ruler, ShieldCheck, HelpCircle, Info, LogOut, Globe
} from "lucide-react";

// ---------- språk (svenska / engelska) ----------
// Svenska om enhetens språk är svenska, annars engelska. Kan ändras i Inställningar → Språk (sparas i webbläsaren).
const LANG_STORAGE_KEY = "dot-lang";
function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "sv" || saved === "en") return saved;
  } catch (e) { /* ingen lagring — gissa från enheten */ }
  const nav = (typeof navigator !== "undefined" && (navigator.languages?.[0] || navigator.language)) || "sv";
  return nav.toLowerCase().startsWith("sv") ? "sv" : "en";
}
const LANG = detectLang();
const LOCALE = LANG === "sv" ? "sv-SE" : "en-GB";
if (typeof document !== "undefined") document.documentElement.lang = LANG;
function setLanguage(lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* ignoreras */ }
  window.location.reload();
}
// engelska översättningar — nyckeln är den svenska texten exakt som den står i koden
const EN = {
 " Det här ämnet finns inte uppmätt för det du loggat idag, så vi kan inte visa någon mängd — det betyder inte att du får för lite.": " This nutrient hasn't been measured for what you logged today, so we can't show an amount — it doesn't mean you're getting too little.",
 " En portion är {0} g enligt förpackningen.": " One serving is {0} g according to the package.",
 " · Träff: \"{0}\"": " · Match: \"{0}\"",
 "(16 år eller äldre).": "(16 or older).",
 ". Logga dem gärna separat.": ". Feel free to log them separately.",
 ". Vägde du maten kokt blir det för mycket — tryck": ". If you weighed it cooked, this will be too much — tap",
 "/100g": "/100g",
 "AI:n svarade inte.": "The AI didn't respond.",
 "Aktiv": "Active",
 "Aktivitetsnivå": "Activity level",
 "Analysera bild": "Analyze photo",
 "Analyserar bild…": "Analyzing photo…",
 "Annat land": "Other country",
 "Antal portioner": "Number of servings",
 "Antioxidant som ger tomater och vattenmelon sin röda färg.": "Antioxidant that gives tomatoes and watermelon their red color.",
 "Antioxidant som kroppen omvandlar till A-vitamin.": "Antioxidant the body converts into vitamin A.",
 "Antioxidant som skyddar celler mot oxidativ stress.": "Antioxidant that protects cells from oxidative stress.",
 "Antioxidant som skyddar celler och stöttar sköldkörteln.": "Antioxidant that protects cells and supports the thyroid.",
 "Antioxidant som stöttar immunförsvar och kollagenbildning.": "Antioxidant that supports the immune system and collagen formation.",
 "Antioxidanter som samlas i ögat och hjälper till att skydda synen.": "Antioxidants that collect in the eye and help protect your vision.",
 "Apple — kommer snart": "Apple — coming soon",
 "Avbryt": "Cancel",
 "B1 (Tiamin)": "B1 (Thiamine)",
 "B5 (Pantotensyra)": "B5 (Pantothenic acid)",
 "B9 (Folat)": "B9 (Folate)",
 "Baserat på B12, järn, D-vitamin, zink och kolin.": "Based on B12, iron, vitamin D, zinc and choline.",
 "Baserat på C-vitamin, E-vitamin, zink och biotin.": "Based on vitamin C, vitamin E, zinc and biotin.",
 "Baserat på C-vitamin, zink, D-vitamin och protein.": "Based on vitamin C, zinc, vitamin D and protein.",
 "Baserat på D-vitamin, B6, folat och magnesium.": "Based on vitamin D, B6, folate and magnesium.",
 "Baserat på fibrer mot ett dagsmål på ca 30g.": "Based on fiber against a daily goal of about 30 g.",
 "Baserat på första och senaste viktloggningen denna vecka.": "Based on the first and latest weigh-in this week.",
 "Baserat på järn, B-vitaminer och kolhydrater mot ditt dagsmål.": "Based on iron, B vitamins and carbs against your daily goal.",
 "Baserat på kalium, magnesium, fibrer och lågt natriumintag.": "Based on potassium, magnesium, fiber and low sodium intake.",
 "Baserat på magnesium, kalcium och B6.": "Based on magnesium, calcium and B6.",
 "Baserat på protein mot ditt mål, magnesium och zink.": "Based on protein against your goal, magnesium and zinc.",
 "Baserat på zink, D-vitamin, magnesium och sunt fettintag — visar näringsstöd, inte faktiska hormonnivåer.": "Based on zinc, vitamin D, magnesium and healthy fat intake — shows nutritional support, not actual hormone levels.",
 "Behov": "Need",
 "Behövs för att bilda röda blodkroppar och transportera syre.": "Needed to form red blood cells and carry oxygen.",
 "Behövs för att bilda sköldkörtelhormoner.": "Needed to make thyroid hormones.",
 "Behövs för bindväv och järnomsättning.": "Needed for connective tissue and iron metabolism.",
 "Behövs för blodkoagulering och benhälsa.": "Needed for blood clotting and bone health.",
 "Behövs för nervsystem och röda blodkroppar. Mineralet kobolt sitter i B12-molekylen, så får du i dig B12 får du också kobolt.": "Needed for the nervous system and red blood cells. The mineral cobalt is part of the B12 molecule, so getting B12 also means getting cobalt.",
 "Behövs som kofaktor i flera viktiga enzymer.": "Needed as a cofactor in several important enzymes.",
 "Bekräfta & logga": "Confirm & log",
 "Beskrivning (valfritt)": "Description (optional)",
 "Betakaroten": "Beta-carotene",
 "Bibehålla vikt": "Maintain weight",
 "Bilden laddades upp men kunde inte visas. Ladda om sidan.": "The photo was uploaded but couldn't be shown. Reload the page.",
 "Bildloggning kräver AI, som inte är aktiverad än. Logga manuellt så länge.": "Photo logging needs AI, which isn't enabled yet. Log manually for now.",
 "Bra ämnen": "Good stuff",
 "Bra ämnen idag": "Good stuff today",
 "Bygga muskler": "Build muscle",
 "Bygger ben och tänder, viktigt för energiomsättning.": "Builds bones and teeth, important for energy metabolism.",
 "Bygger och underhåller starka ben och tänder.": "Builds and maintains strong bones and teeth.",
 "Byt träff": "Change match",
 "Centimeter (cm)": "Centimeters (cm)",
 "DOT står för disciplin och tålamod — de två saker som krävs för att lyckas, i livet och med kosten. Små val varje dag, under lång tid.": "DOT stands for Discipline Over Time — what it takes to succeed, in life and with your diet. Small choices every day, over a long time.",
 "DOT · prototyp v0.1": "DOT · prototype v0.1",
 "Dagar loggade": "Days logged",
 "Dagens måltider": "Today's meals",
 "Danmark": "Denmark",
 "Data & support": "Data & support",
 "Dataskydd": "Privacy & data",
 "Den form av omega-3 som främst finns i fisk och skaldjur.": "The form of omega-3 found mainly in fish and seafood.",
 "Denna vecka": "This week",
 "Det här såg jag på bilden": "Here's what I saw in the photo",
 "Din data (loggar, vikt, måltider och progressbilder) sparas på ditt konto och säljs eller delas aldrig för reklam.": "Your data (logs, weight, meals and progress photos) is stored in your account and is never sold or shared for advertising.",
 "Din inloggning har gått ut — logga ut och in igen.": "Your session has expired — log out and back in.",
 "Dina egna värden används alltid. Det du inte fyllt i — t.ex. mättat fett, vitaminer och mineraler — hämtas från det du väljer och märks som uppskattat.": "Your own values are always used. Anything you didn't fill in — e.g. saturated fat, vitamins and minerals — comes from what you pick and is marked as estimated.",
 "Discipline Over Time.": "Discipline Over Time.",
 "Du kan när som helst radera ditt konto under Inställningar — då raderas all din data permanent.": "You can delete your account at any time under Settings — all your data is then permanently deleted.",
 "Då visar vi livsmedel och varor från ditt land först när du loggar.": "We'll show foods and products from your country first when you log.",
 "Dölj": "Hide",
 "E-post": "Email",
 "Egna värden": "Own values",
 "Eller skriv siffrorna under streckkoden": "Or type the numbers under the barcode",
 "Energi": "Energy",
 "Enheter": "Units",
 "Fett": "Fat",
 "Fixa min hälsa": "Fix my health",
 "Fleromättat fett som är viktigt för hjärta och hjärna.": "Polyunsaturated fat that's important for the heart and brain.",
 "Fluorid": "Fluoride",
 "Fortsätt": "Continue",
 "Fortsätt med Google": "Continue with Google",
 "Fortsätt med mail": "Continue with email",
 "Fosfor": "Phosphorus",
 "Fot/tum (ft/in)": "Feet/inches (ft/in)",
 "Foto": "Photo",
 "Fråga AI": "Ask AI",
 "Fråga om värdena": "Ask about the values",
 "Från matloggningen": "From your food log",
 "Fullkorn": "Whole grains",
 "Fyll i kända värden per 100g (valfritt)": "Fill in known values per 100 g (optional)",
 "Fysiskt tungt jobb och hård träning, dagligen": "Physically demanding job and hard training, daily",
 "Ger fibrer och långsamma kolhydrater som håller dig mätt längre.": "Provides fiber and slow carbs that keep you full longer.",
 "Gå ner i vikt": "Lose weight",
 "Gå upp i vikt": "Gain weight",
 "Går/rör dig lite dagligen, tränar lätt 1–3 ggr/vecka": "Walk/move a little daily, light training 1–3 times a week",
 "Har du redan ett konto?": "Already have an account?",
 "Helt valfritt — dagligen, veckovis, eller aldrig": "Completely optional — daily, weekly, or never",
 "Hem": "Home",
 "Hittade inga andra träffar för \"{0}\". Prova att söka med ett annat ord.": "Found no other matches for \"{0}\". Try searching with another word.",
 "Hittade ingen mat på bilden. Prova en annan bild eller lägg till en beskrivning.": "Couldn't find any food in the photo. Try another photo or add a description.",
 "Hittade inte \"{0}\" i databasen. Kolla stavningen, prova ett annat ord eller engelska (t.ex. \"chicken breast\") — eller fyll i värdena från förpackningen här nedanför.": "Couldn't find \"{0}\" in the database. Check the spelling, try another word — or fill in the values from the package below.",
 "Hittade inte \"{0}\" i databasen. Kolla stavningen, prova engelska (t.ex. \"chicken breast\") eller fyll i värdena per 100g nedanför.": "Couldn't find \"{0}\" in the database. Check the spelling, try another word, or fill in the values per 100 g below.",
 "Hittade inte {0} i databasen. Logga manuellt i stället.": "Couldn't find {0} in the database. Log manually instead.",
 "Hittades inte i databasen och räknas inte med:": "Not found in the database and not counted:",
 "Hjälp & support": "Help & support",
 "Hjälper kroppen omvandla mat till energi.": "Helps the body turn food into energy.",
 "Hjälper oss räkna ut dina mål mer exakt.": "Helps us calculate your goals more precisely.",
 "Hjälper till att bryta ner fett och kolhydrater till energi.": "Helps break down fat and carbs into energy.",
 "Hjälper till att reglera vätskebalans och bildar magsyra. Räknas ut från natriumet, eftersom nästan all klorid kommer från salt och sällan mäts separat.": "Helps regulate fluid balance and forms stomach acid. Calculated from sodium, since almost all chloride comes from salt and is rarely measured separately.",
 "Hjärna & fokus": "Brain & focus",
 "Hjärta": "Heart",
 "Hoppa över — använd bara mina värden": "Skip — use only my values",
 "Hormonbalans": "Hormone balance",
 "Hud & hår": "Skin & hair",
 "Hur aktiv är du i vardagen?": "How active are you day to day?",
 "Hur gammal är du?": "How old are you?",
 "Hur lång är du?": "How tall are you?",
 "Hur mycket väger du?": "How much do you weigh?",
 "Hur mycket? Fyll i mängden här nedanför — eller skriv den direkt, t.ex. \"150 g ris\" eller \"2 kiwi\".": "How much? Fill in the amount below — or type it directly, e.g. \"150 g rice\" or \"2 kiwis\".",
 "Hälsoranking": "Health score",
 "Hälsoranking idag": "Health score today",
 "Hämtar produkten…": "Fetching the product…",
 "Här är översikten för denna vecka.": "Here's the overview for this week.",
 "I centimeter.": "In centimeters.",
 "I kilo, ungefärligt räcker.": "In kilos, a rough number is fine.",
 "I pund, ungefärligt räcker.": "In pounds, a rough number is fine.",
 "I tum.": "In inches.",
 "Immunförsvar": "Immune system",
 "Inga sparade måltider än. T.ex. din vanliga PWO-måltid — skapa den en gång, logga den sen på en sekund.": "No saved meals yet. E.g. your usual post-workout meal — create it once, then log it in a second.",
 "Inga träffar för \"{0}\" — visar träffar för \"{1}\".": "No matches for \"{0}\" — showing matches for \"{1}\".",
 "Ingen mat loggad den här dagen.": "No food logged this day.",
 "Inget av dessa — använd mina värden": "None of these — use my values",
 "Inget av dessa — fyll i själv": "None of these — fill in myself",
 "Inget konto än?": "No account yet?",
 "Inget loggat den här dagen.": "Nothing logged this day.",
 "Inget loggat idag än — här är hur det ser ut tills du loggar något.": "Nothing logged today yet — here's how it looks until you log something.",
 "Inget loggat än idag.": "Nothing logged yet today.",
 "Inget upptäckt än idag.": "Nothing detected yet today.",
 "Ingrediens": "Ingredient",
 "Ingredienser (": "Ingredients (",
 "Ingår i aminosyror och behövs för protein- och bindvävsuppbyggnad. Räknas ut från proteinet, eftersom svavlet kommer från proteinets aminosyror.": "Part of amino acids and needed to build protein and connective tissue. Calculated from protein, since the sulfur comes from protein's amino acids.",
 "Inställningar": "Settings",
 "Ja, radera": "Yes, delete",
 "Ja, ta bort": "Yes, remove",
 "Jag vet inte hur mycket en \"{0}\" väger ungefär — skriv mängden i gram i fältet här nedanför.": "I don't know roughly how much a \"{0}\" weighs — enter the amount in grams in the field below.",
 "Jag är minst 16 år och godkänner att DOT sparar mina kost- och hälsouppgifter enligt": "I'm at least 16 and agree that DOT stores my diet and health data as described in the",
 "Jod": "Iodine",
 "Järn": "Iron",
 "Kalcium": "Calcium",
 "Kalender": "Calendar",
 "Kalium": "Potassium",
 "Kalorier": "Calories",
 "Kan stötta insulinets funktion och blodsockerreglering.": "May support insulin function and blood sugar control.",
 "Kilogram (kg)": "Kilograms (kg)",
 "Klorid": "Chloride",
 "Kolhydrater": "Carbs",
 "Kolin": "Choline",
 "Kolla din mail för att bekräfta ditt konto, logga sedan in.": "Check your email to confirm your account, then log in.",
 "Kontaktadress kommer snart": "Contact address coming soon",
 "Konto": "Account",
 "Kontorsjobb, mest still, ingen eller sällan träning": "Office job, mostly sitting, little or no training",
 "Koppar": "Copper",
 "Krom": "Chromium",
 "Kunde inte hämta användaren.": "Couldn't fetch the user.",
 "Kunde inte nå databasen.": "Couldn't reach the database.",
 "Kvinna": "Female",
 "Källa:": "Source:",
 "Kända värden per 100g (valfritt)": "Known values per 100 g (optional)",
 "Kön": "Sex",
 "Laddar upp bilden…": "Uploading photo…",
 "Land": "Country",
 "Logga": "Log",
 "Logga allt": "Log all",
 "Logga in": "Log in",
 "Logga ut": "Log out",
 "Logga vikt minst två dagar för att se en förändring över veckan.": "Log your weight on at least two days to see a change over the week.",
 "Logga vikt några dagar den här veckan så räknar vi ut din trend.": "Log your weight a few days this week and we'll work out your trend.",
 "Logga vikt och valfria bilder per dag — så mycket eller lite som du vill.": "Log weight and optional photos per day — as much or as little as you like.",
 "Loggade måltider": "Logged meals",
 "Loggar in…": "Logging in…",
 "Loggat": "Logged",
 "Loggat:": "Logged:",
 "Lutein & zeaxantin": "Lutein & zeaxanthin",
 "Lykopen": "Lycopene",
 "Lägg till": "Add",
 "Lägg till ingrediens": "Add ingredient",
 "Lägg till progressbild för": "Add progress photo for",
 "Längd": "Height",
 "Längd (": "Height (",
 "Läs hela integritetspolicyn": "Read the full privacy policy",
 "Lätt aktiv": "Lightly active",
 "Lösenord": "Password",
 "Makros": "Macros",
 "Makros idag": "Macros today",
 "Man": "Male",
 "Mangan": "Manganese",
 "Matsmältning": "Digestion",
 "Matvara": "Food",
 "Med din e-post och ditt lösenord.": "With your email and password.",
 "Mina måltider": "My meals",
 "Mineraler": "Minerals",
 "Mineraler idag": "Minerals today",
 "Molybden": "Molybdenum",
 "Muskler": "Muscles",
 "Mycket aktiv": "Very active",
 "Mängd": "Amount",
 "Må bättre allmänt": "Feel better overall",
 "Mående": "Mood",
 "Mål (välj gärna flera)": "Goals (pick as many as you like)",
 "Måltid": "Meal",
 "Måltider": "Meals",
 "Måttligt aktiv": "Moderately active",
 "Namn på måltiden": "Meal name",
 "Natrium": "Sodium",
 "Norge": "Norway",
 "Ny måltid": "New meal",
 "När du loggar med fri text eller foto skickas texten eller bilden till vår AI-leverantör (Anthropic) för att tolkas — vad du åt och ungefär hur mycket. Näringsvärdena kommer alltid från livsmedelsdatabaserna, aldrig från AI:n.": "When you log with free text or a photo, the text or image is sent to our AI provider (Anthropic) to be interpreted — what you ate and roughly how much. Nutrition values always come from the food databases, never from the AI.",
 "Näringsdata: Livsmedelsverkets livsmedelsdatabas (Livsmedelsverket, CC BY 4.0), USDA FoodData Central och Open Food Facts (ODbL).": "Nutrition data: the Swedish Food Agency's food database (Livsmedelsverket, CC BY 4.0), USDA FoodData Central and Open Food Facts (ODbL).",
 "Något gick fel med kontot.": "Something went wrong with your account.",
 "Obs: värdena gäller": "Note: the values are for",
 "Okänt fel": "Unknown error",
 "Om DOT": "About DOT",
 "Om {0}": "About {0}",
 "Precis som på förpackningen — DOT räknar om till din faktiska vikt. Lämna resten tomt, så fylls det i från ett liknande livsmedel du väljer.": "Just as on the package — DOT converts it to your actual amount. Leave the rest empty and it's filled in from a similar food you pick.",
 "Preferenser": "Preferences",
 "Produkten ({0}) finns inte i databasen än. Sök på namnet i stället, eller fyll i värdena från förpackningen här nedanför.": "The product ({0}) isn't in the database yet. Search by name instead, or fill in the values from the package below.",
 "Profil": "Profile",
 "Pund (lbs)": "Pounds (lbs)",
 "Radera konto": "Delete account",
 "Reglerar vätskebalans och muskelfunktion, inklusive hjärtat.": "Regulates fluid balance and muscle function, including the heart.",
 "Reglerar vätskebalans och nervsignaler, men lätt att få i överflöd.": "Regulates fluid balance and nerve signals, but easy to get too much of.",
 "Räkna ut mina mål": "Calculate my goals",
 "Räknar ut värden…": "Calculating values…",
 "Räknar ut…": "Calculating…",
 "Räknat utanför träningspass.": "Outside of workouts.",
 "Se exempel på veckosammanfattning →": "See an example weekly summary →",
 "Selen": "Selenium",
 "Senaste": "Recent",
 "Skanna streckkod": "Scan barcode",
 "Skannad produkt:": "Scanned product:",
 "Skapa konto": "Create account",
 "Skapa ny måltid": "Create new meal",
 "Skapar konto…": "Creating account…",
 "Skriv en fråga…": "Type a question…",
 "Skriv hur många gram du åt.": "Enter how many grams you ate.",
 "Spara": "Save",
 "Spara måltid": "Save meal",
 "Spara måltider du äter ofta — logga dem sen med ett klick istället för att fylla i allt igen.": "Save meals you eat often — then log them with one tap instead of filling everything in again.",
 "Spara ändringar": "Save changes",
 "Sparat till din dagslogg.": "Saved to your daily log.",
 "Sparat — dina mål är omräknade.": "Saved — your goals have been recalculated.",
 "Stillasittande": "Sedentary",
 "Storbritannien": "United Kingdom",
 "Stäng": "Close",
 "Stärker tandemaljen och motverkar karies.": "Strengthens tooth enamel and helps prevent cavities.",
 "Stöttar benbildning och ämnesomsättning.": "Supports bone formation and metabolism.",
 "Stöttar hår, hud och ämnesomsättning.": "Supports hair, skin and metabolism.",
 "Stöttar immunförsvar och sårläkning.": "Supports the immune system and wound healing.",
 "Stöttar ämnesomsättning och nervsystem.": "Supports metabolism and the nervous system.",
 "Stötte du på ett problem, eller har du en idé till en ny funktion? Hör av dig.": "Ran into a problem, or have an idea for a new feature? Get in touch.",
 "Svavel": "Sulfur",
 "Sverige": "Sweden",
 "Sök": "Search",
 "Söker…": "Searching…",
 "Sömn": "Sleep",
 "T.ex. \"1 kopp grönt te\" — skriv 1 och välj kopp. DOT räknar om till gram åt dig.": "E.g. \"1 cup green tea\" — enter 1 and choose cup. DOT converts it to grams for you.",
 "T.ex. \"varför gissar du så mycket protein?\" eller \"är det här en stor banan?\"": "E.g. \"is this a lot of protein?\" or \"is this a large banana?\"",
 "Ta bort": "Remove",
 "Ta eller välj en bild": "Take or choose a photo",
 "Tillbaka": "Back",
 "Tillbaka hem": "Back home",
 "Titta tillbaka på vilken dag som helst — bläddra hur långt bak du vill.": "Look back at any day — scroll back as far as you like.",
 "Totalt": "Total",
 "Tryck på en rad för att ändra mängd eller ta bort.": "Tap a row to change the amount or remove it.",
 "Träff:": "Match:",
 "Träffar för \"{0}\" — värdena är per 100 g. Du loggar {1} {2}.": "Matches for \"{0}\" — values are per 100 g. You're logging {1} {2}.",
 "Tränar 3–5 ggr/vecka, en del rörelse i vardagen": "Train 3–5 times a week, some movement in daily life",
 "Tränar hårt 6–7 ggr/vecka, eller fysiskt jobb + viss träning": "Train hard 6–7 times a week, or physical job + some training",
 "Tyskland": "Germany",
 "Uppladdningen misslyckades ({0}): {1}": "Upload failed ({0}): {1}",
 "Uppskattat stöd från det du ätit — inte ett medicinskt mått.": "Estimated support from what you've eaten — not a medical measure.",
 "Vad liknar din vara mest?": "What is your product most like?",
 "Vad vill du fokusera på?": "What do you want to focus on?",
 "Var bor du?": "Where do you live?",
 "Veckosammanfattning": "Weekly summary",
 "Version 0.1 (prototyp)": "Version 0.1 (prototype)",
 "Vet du t.ex. protein- eller fettinnehållet per 100g (från förpackningen)? Fyll i det du vet — resten hämtas från ett liknande livsmedel.": "Do you know e.g. the protein or fat content per 100 g (from the package)? Fill in what you know — the rest comes from a similar food.",
 "Vikt": "Weight",
 "Vikt (": "Weight (",
 "Vikt denna dag (": "Weight this day (",
 "Vikterna är uppskattade från bilden. Värdena kommer från livsmedelsdatabasen. Ta bort det som inte stämmer — mängderna kan du ändra efter loggningen genom att trycka på raden.": "The amounts are estimated from the photo. The values come from the food database. Remove anything that's wrong — you can change the amounts after logging by tapping the row.",
 "Viktförändring": "Weight change",
 "Viktigt för celldelning, extra viktigt vid graviditet.": "Important for cell division, especially during pregnancy.",
 "Viktigt för energiproduktion och cellfunktion.": "Important for energy production and cell function.",
 "Viktigt för kalciumupptag och starka ben.": "Important for calcium absorption and strong bones.",
 "Viktigt för lever-, muskel- och hjärnfunktion.": "Important for liver, muscle and brain function.",
 "Viktigt för muskel- och nervfunktion.": "Important for muscle and nerve function.",
 "Viktigt för protein-ämnesomsättning och immunförsvar.": "Important for protein metabolism and the immune system.",
 "Viktigt för syn, hud och immunförsvar.": "Important for vision, skin and the immune system.",
 "Vilken menar du?": "Which one do you mean?",
 "Vilken menar du? (värden per 100 g)": "Which one do you mean? (values per 100 g)",
 "Vilket kön har du?": "What's your sex?",
 "Visa": "Show",
 "Visas bara här om du faktiskt fått i dig något av det. Uppmätta ämnen visas med mängd; övriga med en ungefärlig nivå (låg–mycket hög) utifrån typiska halter i livsmedlet.": "Only shown here if you've actually had some. Measured substances show an amount; others show a rough level (low–very high) based on typical content in the food.",
 "Vitaminer": "Vitamins",
 "Vitaminer idag": "Vitamins today",
 "Vitaminer och mineraler finns inte uppmätta för den här träffen, så de räknas inte med.": "Vitamins and minerals haven't been measured for this match, so they're not counted.",
 "Vitaminer, mineraler och bra ämnen läggs till din dagliga översikt när du loggar — se fliken": "Vitamins, minerals and good stuff are added to your daily overview when you log — see the tab",
 "Välj gärna flera — det här styr hur vi sätter dina mål, du kan ändra senare.": "Pick as many as you like — this shapes how we set your goals. You can change it later.",
 "Välkommen": "Welcome",
 "Zink": "Zinc",
 "du@exempel.se": "you@example.com",
 "eller": "or",
 "för hela bilden.": "for the full picture.",
 "förhandsvisning": "preview",
 "g · K": "g · C",
 "ingen data": "no data",
 "integritetspolicyn": "privacy policy",
 "kcal kvar": "kcal left",
 "kcal per 100 g.": "kcal per 100 g.",
 "kopp": "cup",
 "msk": "tbsp",
 "och välj en kokt variant.": "and choose a cooked option.",
 "okokt (torr) vikt": "uncooked (dry) weight",
 "progressbild": "progress photo",
 "spårmängd": "trace amount",
 "styck": "pcs",
 "t.ex. \"150 g ris\" eller \"2 kiwi\"": "e.g. \"150 g rice\" or \"2 kiwis\"",
 "t.ex. 164": "e.g. 164",
 "t.ex. 7310500088853": "e.g. 7310500088853",
 "t.ex. 74.5": "e.g. 74.5",
 "t.ex. Min PWO-måltid": "e.g. My post-workout meal",
 "t.ex. kycklingfilé": "e.g. chicken breast",
 "t.ex. kycklingwrap med lite majonnäs, ingen ost": "e.g. chicken wrap with a little mayo, no cheese",
 "tsk": "tsp",
 "tum": "in",
 "uppskattat": "estimated",
 "varav EPA + DHA": "of which EPA + DHA",
 "varav fibrer": "of which fiber",
 "varav mättat": "of which saturated",
 "varav sockerarter": "of which sugars",
 "varav transfett": "of which trans fat",
 "visas inte — de finns inte uppmätta för det du ätit idag.": "aren't shown — they haven't been measured for what you ate today.",
 "· ca": "· approx.",
 "· ditt val": "· your choice",
 "· okokt vikt": "· uncooked weight",
 "Ändra mängden om du åt mer eller mindre.": "Change the amount if you ate more or less.",
 "Ändringen gäller direkt — vikt och längd visas och räknas om i din valda enhet överallt i appen (sparas alltid i kg/cm internt).": "The change applies right away — weight and height are shown and converted to your chosen unit everywhere in the app (always stored in kg/cm internally).",
 "Är du ny godkänner du att DOT sparar dina kost- och hälsouppgifter enligt": "If you're new, you agree that DOT stores your diet and health data as described in the",
 "Är du säker? All din data (loggar, måltider, vikt, bilder) raderas permanent.": "Are you sure? All your data (logs, meals, weight, photos) will be permanently deleted.",
 "Äta mer varierat": "Eat more varied",
 "Ätit": "Eaten",
 "Ålder": "Age",
 "Ålder påverkar din dagliga energiförbrukning.": "Age affects your daily energy use.",
 "Ålder, vikt, mål och aktivitetsnivå": "Age, weight, goals and activity level",
 "Översikt": "Overview",
 "— svep för fler": "— swipe for more",
 "•••••••• (minst 6 tecken)": "•••••••• (at least 6 characters)",
 "← Tillbaka": "← Back",
 "🎉 1 hel vecka avklarad!": "🎉 1 full week done!",
 ", kompletterat med USDA FoodData Central": ", supplemented with USDA FoodData Central",
 "Livsmedelsverkets livsmedelsdatabas": "Swedish Food Agency food database",
 "Livsmedelsverkets livsmedelsdatabas, kompletterat med USDA FoodData Central": "Swedish Food Agency food database, supplemented with USDA FoodData Central",
 "USDA FoodData Central, kompletterat med USDA FoodData Central": "USDA FoodData Central",
 "Appen laddas om på det valda språket. Livsmedelsnamnen visas på engelska när det finns en översättning.": "The app reloads in the chosen language. Food names are shown in English when a translation exists.",
 "Bra jobbat, du är på rätt spår mot ditt mål! 📈": "Nice work, you're on track toward your goal! 📈",
 "Bra jobbat, du är på rätt spår mot ditt mål! 📉": "Nice work, you're on track toward your goal! 📉",
 "Finns i:": "Found in:",
 "Mån": "Mon",
 "Tis": "Tue",
 "Ons": "Wed",
 "Tors": "Thu",
 "Fre": "Fri",
 "Lör": "Sat",
 "Sön": "Sun",
 "God eftermiddag": "Good afternoon",
 "God kväll": "Good evening",
 "God morgon": "Good morning",
 "God natt": "Good night",
 "Mycket låg": "Very low",
 "Låg": "Low",
 "Medel": "Medium",
 "Hög": "High",
 "Mycket hög": "Very high",
 "Inte den bästa veckan för viktnedgång, men du kommer dit. 💪": "Not the best week for weight loss, but you'll get there. 💪",
 "Inte den bästa veckan för viktuppgång, men du kommer dit. 💪": "Not the best week for weight gain, but you'll get there. 💪",
 "Märkesvara": "Brand product",
 "Stabil vecka — precis vad som passar om du vill bibehålla vikten. 👍": "Steady week — just right if you want to maintain your weight. 👍",
 "Vikten låg still — kolla gärna över kalorierna om nedgång är målet.": "Your weight held steady — maybe look over your calories if losing is the goal.",
 "Vikten låg still — kolla gärna över kalorierna om uppgång är målet.": "Your weight held steady — maybe look over your calories if gaining is the goal.",
 "Vikten rörde sig en del denna vecka — helt normalt, följ trenden över flera veckor.": "Your weight moved around a bit this week — completely normal, follow the trend over several weeks.",
 "ca": "approx.",
 "AI är inte aktiverad än.": "AI isn't enabled yet.",
 "Användarens beskrivning: {0}": "User's description: {0}",
 "Ingen beskrivning.": "No description.",
 "Ingrediensen är tillagd, men vitaminer och mineraler finns inte uppmätta för den.": "The ingredient was added, but vitamins and minerals haven't been measured for it.",
 "Kunde inte nå AI:n just nu.": "Couldn't reach the AI right now.",
 "Kunde inte radera kontot: ": "Couldn't delete the account: ",
 "Kunde inte spara profilen: ": "Couldn't save your profile: ",
 "Kunde inte spara till databasen: ": "Couldn't save to the database: ",
 "Kunde inte spara ändringen: ": "Couldn't save the change: ",
 "Kunde inte starta kameran. Tillåt kameran i webbläsaren, eller skriv streckkoden här nedanför.": "Couldn't start the camera. Allow camera access in your browser, or type the barcode below.",
 "Kunde inte svara just nu.": "Couldn't answer right now.",
 "Kunde inte ta bort från databasen: ": "Couldn't remove from the database: ",
 "Kunde inte tolka bilden: ": "Couldn't interpret the photo: ",
 " Försök igen om en stund.": " Try again in a moment.",
 "Rikta kameran mot streckkoden": "Point the camera at the barcode",
 "Vet inte vad en \"{0}\" väger — välj gram i stället.": "Don't know what a \"{0}\" weighs — choose grams instead.",
 "Katekiner": "Catechins",
 "Antioxidanterna i te och kakao. Kan stödja hjärta och blodkärl.": "The antioxidants in tea and cocoa. May support the heart and blood vessels.",
 "L-teanin": "L-theanine",
 "Aminosyra i te som ger ett lugnt fokus och kan mildra koffeinets påslag. Effekter ses oftast vid 100–200 mg.": "Amino acid in tea that gives calm focus and can soften caffeine's kick. Effects are usually seen at 100–200 mg.",
 "Koffein": "Caffeine",
 "Pigger upp och skärper fokus. Lagom för de flesta är ungefär 100–200 mg om dagen, helst före lunch — redan runt 100 mg senare på dagen kan försämra sömnen.": "Boosts alertness and focus. Around 100–200 mg a day suits most people, ideally before lunch — even about 100 mg later in the day can disturb sleep.",
 "Klorogensyra": "Chlorogenic acid",
 "Polyfenol med antioxiderande effekt — kaffe är den största källan.": "Polyphenol with an antioxidant effect — coffee is the biggest source.",
 "Teobromin": "Theobromine",
 "Milt uppiggande ämne i kakao, mildare och mer långvarigt än koffein.": "Mild stimulant in cocoa, gentler and longer-lasting than caffeine.",
 "Antocyaniner": "Anthocyanins",
 "Färgämnen i blå och röda bär och grönsaker som fungerar som antioxidanter.": "Pigments in blue and red berries and vegetables that act as antioxidants.",
 "Ellagitanniner": "Ellagitannins",
 "Polyfenoler i bär och nötter som tarmfloran omvandlar till nyttiga ämnen.": "Polyphenols in berries and nuts that gut bacteria turn into beneficial compounds.",
 "Sulforafan": "Sulforaphane",
 "Bildas när man tuggar korsblommiga grönsaker och stöttar kroppens egna skyddssystem.": "Forms when you chew cruciferous vegetables and supports the body's own defense systems.",
 "Svavelförening i vitlök som bildas när den hackas eller krossas.": "Sulfur compound in garlic that forms when it's chopped or crushed.",
 "Kvercetin": "Quercetin",
 "Flavonoid med antioxiderande egenskaper, finns rikligt i lök.": "Flavonoid with antioxidant properties, plentiful in onions.",
 "Kurkumin": "Curcumin",
 "Det gula ämnet i gurkmeja. Tas upp bättre tillsammans med svartpeppar och fett.": "The yellow compound in turmeric. Better absorbed together with black pepper and fat.",
 "Betaglukan": "Beta-glucan",
 "Löslig fiber i havre och korn. Runt 3 g om dagen kan bidra till lägre kolesterol.": "Soluble fiber in oats and barley. About 3 g a day can help lower cholesterol.",
 "Kostnitrat": "Dietary nitrate",
 "Omvandlas i kroppen till kväveoxid, som vidgar blodkärlen.": "Converted in the body to nitric oxide, which widens blood vessels.",
 "Olivpolyfenoler": "Olive polyphenols",
 "Antioxidanter i olivolja, främst i extra jungfruolja.": "Antioxidants in olive oil, mainly extra virgin.",
 "Flavonoid i citrusfrukter som kan stödja blodkärlen.": "Flavonoid in citrus fruits that may support blood vessels.",
 "Det starka ämnet i ingefära, kan lindra illamående.": "The pungent compound in ginger, may ease nausea.",
 "Lignaner": "Lignans",
 "Växtämnen i fröer och fullkorn med antioxiderande egenskaper.": "Plant compounds in seeds and whole grains with antioxidant properties.",
 "Isoflavoner": "Isoflavones",
 "Växtämnen i soja som kan stödja hjärta och benhälsa.": "Plant compounds in soy that may support heart and bone health.",
 "Ergotionein": "Ergothioneine",
 "Antioxidant som främst finns i svamp.": "Antioxidant found mainly in mushrooms.",
 "Astaxantin": "Astaxanthin",
 "Rött färgämne i lax och skaldjur med stark antioxiderande effekt. Vildfångad lax har mycket mer än odlad.": "Red pigment in salmon and shellfish with a strong antioxidant effect. Wild salmon has much more than farmed.",
 "Kreatin": "Creatine",
 "Ger musklerna snabb energi vid korta, intensiva ansträngningar. Finns i kött och fisk.": "Gives muscles quick energy during short, intense efforts. Found in meat and fish.",
 "Probiotika": "Probiotics",
 "Levande mjölksyrabakterier som kan stödja tarmfloran.": "Live lactic acid bacteria that may support gut flora.",
 "Det starka ämnet i chili.": "The hot compound in chili.",
 "Google-inloggningen misslyckades: ": "Google sign-in failed: ",
 "gram": "grams"
};

// tr("svensk text") → engelsk text om språket är engelska (faller tillbaka på svenska om översättning saknas)
function tr(s) {
  if (LANG === "sv" || typeof s !== "string") return s;
  const v = EN[s];
  return v === undefined ? s : v;
}
// trf("Hittade inte \"{0}\"", namn) → med insatta värden
function trf(s, ...args) {
  return String(tr(s)).replace(/\{(\d+)\}/g, (_, i) => (args[i] ?? ""));
}
const PRIVACY_URL = LANG === "sv" ? "/integritet.html" : "/privacy.html";

// fields the user can optionally fill in per 100g, matching a package label
const KNOWN_FIELDS = [
  { key: "kcal", label: tr("Kalorier"), unit: "kcal" },
  { key: "protein_g", label: tr("Protein"), unit: "g" },
  { key: "carbs_g", label: tr("Kolhydrater"), unit: "g" },
  { key: "sugar_g", label: tr("varav sockerarter"), unit: "g", sub: true },
  { key: "fiber_g", label: tr("varav fibrer"), unit: "g", sub: true },
  { key: "fat_g", label: tr("Fett"), unit: "g" },
  { key: "satfat_g", label: tr("varav mättat"), unit: "g", sub: true },
  { key: "transfat_g", label: tr("varav transfett"), unit: "g", sub: true },
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

function dateKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
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

// ---------- land ----------
const COUNTRIES = [
  { v: "SE", l: tr("Sverige") }, { v: "NO", l: tr("Norge") }, { v: "DK", l: tr("Danmark") }, { v: "FI", l: tr("Finland") },
  { v: "DE", l: tr("Tyskland") }, { v: "GB", l: tr("Storbritannien") }, { v: "US", l: tr("USA") }, { v: "OTHER", l: tr("Annat land") },
];
function guessCountry() {
  const lang = (typeof navigator !== "undefined" && navigator.language) || "";
  const code = (lang.split("-")[1] || "").toUpperCase();
  if (COUNTRIES.some((c) => c.v === code)) return code;
  if (lang.startsWith("sv")) return "SE";
  return "OTHER";
}

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
  if (!res.ok) throw new Error(data.error_description || data.msg || data.error || tr("Något gick fel med kontot."));
  return data;
}

// ---------- progressbilder (privat lagring) ----------
// I databasen sparas bara sökvägen ("<user-id>/<datum>.jpg"). Bilden visas via en tillfällig signerad länk
// som bara fungerar en timme — ingen kan se någon annans bilder.
function photoPathFromUrl(u) {
  if (!u || typeof u !== "string" || u.startsWith("data:")) return null;
  const m = u.match(/progress-photos\/([^?]+)/);
  if (m) return decodeURIComponent(m[1]);
  return u.includes("://") ? null : u;
}
async function signPhotoPaths(accessToken, paths) {
  const list = [...new Set((paths || []).filter(Boolean))];
  if (!list.length || !accessToken) return {};
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/progress-photos`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 3600, paths: list }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const out = {};
    (Array.isArray(data) ? data : []).forEach((r) => {
      const url = r.signedURL || r.signedUrl;
      if (r.path && url && !r.error) out[r.path] = url.startsWith("http") ? url : `${SUPABASE_URL}/storage/v1${url}`;
    });
    return out;
  } catch (e) {
    return {};
  }
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
    throw new Error(err.message || tr("Kunde inte nå databasen."));
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---------- inloggning som håller i sig (sparas + förnyas automatiskt) ----------
const SESSION_STORAGE_KEY = "karna-session";

function buildSession(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: data.user,
  };
}

function saveStoredSession(s) {
  try {
    if (s) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {}
}

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function supabaseGetUser(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || tr("Kunde inte hämta användaren."));
  return data;
}

function startGoogleLogin() {
  const redirectTo = encodeURIComponent(window.location.origin);
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
}

async function refreshSession(refreshToken) {
  const data = await supabaseAuth("token?grant_type=refresh_token", { refresh_token: refreshToken });
  return buildSession(data);
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
  { key: "vit_a", name: tr("Vitamin A"), unit: "µg", rdi: 800, blurb: tr("Viktigt för syn, hud och immunförsvar.") },
  { key: "vit_c", name: tr("Vitamin C"), unit: "mg", rdi: 80, blurb: tr("Antioxidant som stöttar immunförsvar och kollagenbildning.") },
  { key: "vit_d", name: tr("Vitamin D"), unit: "µg", rdi: 5, blurb: tr("Viktigt för kalciumupptag och starka ben.") },
  { key: "vit_e", name: tr("Vitamin E"), unit: "mg", rdi: 12, blurb: tr("Antioxidant som skyddar celler mot oxidativ stress.") },
  { key: "vit_k", name: tr("Vitamin K"), unit: "µg", rdi: 75, blurb: tr("Behövs för blodkoagulering och benhälsa.") },
  { key: "b1", name: tr("B1 (Tiamin)"), unit: "mg", rdi: 1.1, blurb: tr("Hjälper kroppen omvandla mat till energi.") },
  { key: "b2", name: tr("B2 (Riboflavin)"), unit: "mg", rdi: 1.4, blurb: tr("Viktigt för energiproduktion och cellfunktion.") },
  { key: "b3", name: tr("B3 (Niacin)"), unit: "mg", rdi: 16, blurb: tr("Stöttar ämnesomsättning och nervsystem.") },
  { key: "b5", name: tr("B5 (Pantotensyra)"), unit: "mg", rdi: 6, blurb: tr("Hjälper till att bryta ner fett och kolhydrater till energi.") },
  { key: "b6", name: tr("B6"), unit: "mg", rdi: 1.4, blurb: tr("Viktigt för protein-ämnesomsättning och immunförsvar.") },
  { key: "b7", name: tr("B7 (Biotin)"), unit: "µg", rdi: 50, blurb: tr("Stöttar hår, hud och ämnesomsättning.") },
  { key: "b9", name: tr("B9 (Folat)"), unit: "µg", rdi: 200, blurb: tr("Viktigt för celldelning, extra viktigt vid graviditet.") },
  { key: "b12", name: tr("B12"), unit: "µg", rdi: 2.5, blurb: tr("Behövs för nervsystem och röda blodkroppar. Mineralet kobolt sitter i B12-molekylen, så får du i dig B12 får du också kobolt.") },
  { key: "choline", name: tr("Kolin"), unit: "mg", rdi: 400, blurb: tr("Viktigt för lever-, muskel- och hjärnfunktion.") },
];
const MINERALS = [
  { key: "calcium", name: tr("Kalcium"), unit: "mg", rdi: 800, blurb: tr("Bygger och underhåller starka ben och tänder.") },
  { key: "iron", name: tr("Järn"), unit: "mg", rdi: 14, blurb: tr("Behövs för att bilda röda blodkroppar och transportera syre.") },
  { key: "magnesium", name: tr("Magnesium"), unit: "mg", rdi: 375, blurb: tr("Viktigt för muskel- och nervfunktion.") },
  { key: "zinc", name: tr("Zink"), unit: "mg", rdi: 10, blurb: tr("Stöttar immunförsvar och sårläkning.") },
  { key: "potassium", name: tr("Kalium"), unit: "mg", rdi: 2000, blurb: tr("Reglerar vätskebalans och muskelfunktion, inklusive hjärtat.") },
  { key: "phosphorus", name: tr("Fosfor"), unit: "mg", rdi: 700, blurb: tr("Bygger ben och tänder, viktigt för energiomsättning.") },
  { key: "selenium", name: tr("Selen"), unit: "µg", rdi: 55, blurb: tr("Antioxidant som skyddar celler och stöttar sköldkörteln.") },
  { key: "copper", name: tr("Koppar"), unit: "mg", rdi: 1, blurb: tr("Behövs för bindväv och järnomsättning.") },
  { key: "manganese", name: tr("Mangan"), unit: "mg", rdi: 2, blurb: tr("Stöttar benbildning och ämnesomsättning.") },
  { key: "iodine", name: tr("Jod"), unit: "µg", rdi: 150, blurb: tr("Behövs för att bilda sköldkörtelhormoner.") },
  { key: "sodium", name: tr("Natrium"), unit: "mg", rdi: 2400, blurb: tr("Reglerar vätskebalans och nervsignaler, men lätt att få i överflöd.") },
  { key: "chloride", name: tr("Klorid"), unit: "mg", rdi: 2300, blurb: tr("Hjälper till att reglera vätskebalans och bildar magsyra. Räknas ut från natriumet, eftersom nästan all klorid kommer från salt och sällan mäts separat.") },
  { key: "chromium", name: tr("Krom"), unit: "µg", rdi: 40, blurb: tr("Kan stötta insulinets funktion och blodsockerreglering.") },
  { key: "molybdenum", name: tr("Molybden"), unit: "µg", rdi: 50, blurb: tr("Behövs som kofaktor i flera viktiga enzymer.") },
  { key: "fluoride", name: tr("Fluorid"), unit: "mg", rdi: 3, blurb: tr("Stärker tandemaljen och motverkar karies.") },
  { key: "sulfur", name: tr("Svavel"), unit: "mg", rdi: 900, blurb: tr("Ingår i aminosyror och behövs för protein- och bindvävsuppbyggnad. Räknas ut från proteinet, eftersom svavlet kommer från proteinets aminosyror.") },
];
const MICRO_KEYS = [...VITAMINS, ...MINERALS].map((m) => m.key);

const HEALTH_CATEGORIES = [
  { key: "energi", label: tr("Energi"), emoji: "⚡", color: "#F2C063",
    blurb: tr("Baserat på järn, B-vitaminer och kolhydrater mot ditt dagsmål."),
    factors: [{ t: "mineral", k: "iron" }, { t: "vitamin", k: "b1" }, { t: "vitamin", k: "b2" }, { t: "vitamin", k: "b3" }, { t: "vitamin", k: "b12" }, { t: "macro", k: "carbs_g" }] },
  { key: "maende", label: tr("Mående"), emoji: "😊", color: "#8FD9A8",
    blurb: tr("Baserat på D-vitamin, B6, folat och magnesium."),
    factors: [{ t: "vitamin", k: "vit_d" }, { t: "vitamin", k: "b6" }, { t: "vitamin", k: "b9" }, { t: "mineral", k: "magnesium" }] },
  { key: "somn", label: tr("Sömn"), emoji: "😴", color: "#7FA8D9",
    blurb: tr("Baserat på magnesium, kalcium och B6."),
    factors: [{ t: "mineral", k: "magnesium" }, { t: "mineral", k: "calcium" }, { t: "vitamin", k: "b6" }] },
  { key: "hjarna", label: tr("Hjärna & fokus"), emoji: "🧠", color: "#C08FE0",
    blurb: tr("Baserat på B12, järn, D-vitamin, zink och kolin."),
    factors: [{ t: "vitamin", k: "b12" }, { t: "mineral", k: "iron" }, { t: "vitamin", k: "vit_d" }, { t: "mineral", k: "zinc" }, { t: "vitamin", k: "choline" }] },
  { key: "immun", label: tr("Immunförsvar"), emoji: "🛡️", color: "#6FD1D9",
    blurb: tr("Baserat på C-vitamin, zink, D-vitamin och protein."),
    factors: [{ t: "vitamin", k: "vit_c" }, { t: "mineral", k: "zinc" }, { t: "vitamin", k: "vit_d" }, { t: "macro", k: "protein_g" }] },
  { key: "hud", label: tr("Hud & hår"), emoji: "✨", color: "#F2A9C0",
    blurb: tr("Baserat på C-vitamin, E-vitamin, zink och biotin."),
    factors: [{ t: "vitamin", k: "vit_c" }, { t: "vitamin", k: "vit_e" }, { t: "mineral", k: "zinc" }, { t: "vitamin", k: "b7" }] },
  { key: "matsmaltning", label: tr("Matsmältning"), emoji: "🌿", color: "#9ED97F",
    blurb: tr("Baserat på fibrer mot ett dagsmål på ca 30g."),
    factors: [{ t: "fiber" }] },
  { key: "hjarta", label: tr("Hjärta"), emoji: "❤️", color: "#E08F8F",
    blurb: tr("Baserat på kalium, magnesium, fibrer och lågt natriumintag."),
    factors: [{ t: "mineral", k: "potassium" }, { t: "mineral", k: "magnesium" }, { t: "fiber" }, { t: "mineral", k: "sodium", inverse: true }] },
  { key: "hormon", label: tr("Hormonbalans"), emoji: "⚖️", color: "#D9B36F",
    blurb: tr("Baserat på zink, D-vitamin, magnesium och sunt fettintag — visar näringsstöd, inte faktiska hormonnivåer."),
    factors: [{ t: "mineral", k: "zinc" }, { t: "vitamin", k: "vit_d" }, { t: "mineral", k: "magnesium" }, { t: "macro", k: "fat_g" }] },
  { key: "muskler", label: tr("Muskler"), emoji: "💪", color: "#E0A05C",
    blurb: tr("Baserat på protein mot ditt mål, magnesium och zink."),
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

// ---------- AI ----------
// Princip: AI:n hittar ALDRIG på näringsvärden. Den tolkar bara text/bilder (vad och hur mycket)
// och väljer rätt rad i databasen. Alla siffror räknas fram från databasen i appen.
// Modellen bestäms i api/claude.js. Utan AI-nyckel misslyckas anropen tyst och appen fungerar som vanligt.
let aiAccessToken = null; // sätts när man loggar in — servern släpper bara igenom inloggade

async function callClaude(messages, system, maxTokens = 600) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(aiAccessToken ? { Authorization: `Bearer ${aiAccessToken}` } : {}),
    },
    body: JSON.stringify({ max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((typeof data.error === "string" ? data.error : data.error?.message) || tr("AI:n svarade inte."));
  const textBlock = (data.content || []).find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

function parseJsonLoose(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  const start = clean.search(/[[{]/);
  const end = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  return JSON.parse(start >= 0 && end > start ? clean.slice(start, end + 1) : clean);
}

// gäller träffen okokt/torr vikt? (ris, pasta, gryn, baljväxter…)
const DRY_FOOD_RE = /(^|[^a-zåäö])(ris|rice|pasta|spaghetti|makaron|macaroni|nudl|noodle|bulgur|couscous|quinoa|matvete|korngryn|pärlgryn|linser|lentil|kikärt|chickpea|bönor|beans)/i;
const DRY_STATE_RE = /(okokt|torr|torkad|uncooked|\braw\b|\bdry\b|dried)/i;
function isUncookedWeight(name) {
  const n = String(name || "");
  return DRY_FOOD_RE.test(n) && DRY_STATE_RE.test(n);
}

// fri text → { name, amount, unit } (t.ex. "en tallrik spagetti bolognese", "ett glas mjölk")
async function aiInterpret(text) {
  try {
    const system =
      "Du tolkar vad en användare har ätit, för en matloggningsapp. Svara ENDAST med JSON, ingen annan text: " +
      '{"name": string, "amount": number, "unit": "g"|"ml"|"dl"|"msk"|"tsk"|"kopp"|"st", "alternatives": [string]} ' +
      (LANG === "sv"
        ? "name: ett enkelt sökord för livsmedlet på svenska, som det kan heta i en livsmedelsdatabas (t.ex. \"mjölk\", \"spaghetti kokt\", \"kycklingfilé\"). "
        : "name: ett enkelt sökord för livsmedlet på ENGELSKA, som det kan heta i en livsmedelsdatabas (t.ex. \"milk\", \"spaghetti cooked\", \"chicken breast\"). ") +
      "amount/unit: mängden användaren angav. Saknas mängd, gissa en vanlig portion i gram (unit \"g\"). Ett glas ≈ 2 dl. " +
      (LANG === "sv"
        ? "alternatives: 0–3 andra sökord (t.ex. engelska namnet eller ett bredare ord). Hitta aldrig på näringsvärden."
        : "alternatives: 0–3 andra sökord (t.ex. det svenska namnet eller ett bredare ord). Hitta aldrig på näringsvärden.");
    const parsed = parseJsonLoose(await callClaude([{ role: "user", content: text }], system, 200));
    const unit = UNIT_MAP[parsed.unit] || "g";
    const amount = Number(parsed.amount);
    if (!parsed.name || !(amount > 0)) return null;
    return { name: String(parsed.name).trim(), amount, unit, alternatives: (parsed.alternatives || []).map(String).filter(Boolean).slice(0, 3) };
  } catch (e) {
    return null;
  }
}

// väljer den databasrad som bäst passar det användaren skrev — returnerar raden, eller null om osäker
async function aiPickCandidate(query, candidates) {
  if (!candidates || candidates.length < 2) return candidates?.[0] || null;
  try {
    const list = candidates.slice(0, 12).map((c, i) => `${i}: ${c.name} (${Math.round(c.per100.kcal)} kcal/100 g)`).join("\n");
    const system =
      "Du väljer vilken rad i en livsmedelsdatabas som bäst motsvarar det användaren åt. Svara ENDAST med JSON: " +
      '{"index": number} där index är radens nummer. Välj ALLTID den mest sannolika raden — svara -1 bara om ingen rad alls är samma livsmedel. ' +
      "Regler: 1) Om användaren inte skrivit okokt/torr/rå: välj tillagad variant (kokt ris/pasta, kokt ägg, stekt/kokt kött). " +
      "2) Välj ALDRIG barnmat, konserv, pulver, fryst färdigrätt eller kylvara om användaren inte nämnt det — välj hellre hemlagad eller den vanligaste neutrala varianten. " +
      "3) Välj ALDRIG eko-variant eller märkesvara om användaren inte nämnt det. " +
      "4) Raden ska vara samma livsmedel, inte en rätt som bara innehåller det (\"ägg\" är inte \"våffla m. ägg\").";
    const parsed = parseJsonLoose(await callClaude([{ role: "user", content: `Användaren skrev: "${query}"\n\nRader:\n${list}` }], system, 150));
    const i = Number(parsed.index);
    return Number.isInteger(i) && i >= 0 && i < candidates.length ? candidates[i] : null;
  } catch (e) {
    return null;
  }
}

// hur många gram motsvarar t.ex. "1 dl havregryn"? (bara mängden — inga näringsvärden)
async function aiEstimateGrams(name, amount, unit) {
  try {
    const system =
      'Svara ENDAST med JSON: {"grams": number}. Uppskatta hur många gram den angivna mängden av livsmedlet väger. ' +
      "Ta hänsyn till densitet (1 dl havregryn ≈ 35 g, 1 dl mjölk ≈ 103 g, 1 msk olja ≈ 14 g). 1 kopp = 2,4 dl.";
    const parsed = parseJsonLoose(await callClaude([{ role: "user", content: `${amount} ${UNIT_LABELS[unit] || unit} ${name}` }], system, 150));
    const g = Number(parsed.grams);
    return g > 0 ? g : null;
  } catch (e) {
    return null;
  }
}

// bild → lista med livsmedel och gram. Värdena hämtas sedan från databasen.
async function aiPhotoItems(photoData, description) {
  const system =
    "Du ser en bild av en måltid. Lista de livsmedel som syns och uppskatta vikten i gram för varje del. Svara ENDAST med JSON: " +
    '{"items": [{"name": string, "grams": number}]} ' +
    (LANG === "sv" ? "name: enkelt sökord på svenska" : "name: enkelt sökord på ENGELSKA") + " som det kan heta i en livsmedelsdatabas, med tillagningssätt om det syns (t.ex. \"ris kokt\", \"kycklingfilé stekt\", \"broccoli kokt\"). " +
    "Högst 8 delar. Ta med såser och dressing om de syns. Hitta aldrig på näringsvärden.";
  const content = [
    { type: "image", source: { type: "base64", media_type: photoData.mime, data: photoData.b64 } },
    { type: "text", text: description ? trf("Användarens beskrivning: {0}", description) : tr("Ingen beskrivning.") },
  ];
  const parsed = parseJsonLoose(await callClaude([{ role: "user", content }], system, 500));
  return (parsed.items || [])
    .map((it) => ({ name: String(it.name || "").trim(), grams: Math.round(Number(it.grams) || 0) }))
    .filter((it) => it.name && it.grams > 0)
    .slice(0, 8);
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
            {tr("uppskattat")}
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
  { v: "g", l: tr("gram") },
  { v: "ml", l: tr("ml") },
  { v: "dl", l: tr("dl") },
  { v: "msk", l: tr("msk") },
  { v: "tsk", l: tr("tsk") },
  { v: "kopp", l: tr("kopp") },
  { v: "st", l: tr("styck") },
];
const UNIT_LABELS = Object.fromEntries(UNITS.map((u) => [u.v, u.l]));
const FALLBACK_UNIT_GRAMS = { g: 1, ml: 1, dl: 100, msk: 15, tsk: 5, kopp: 240, st: 100 };

// ---------- "150 g ris", "2 kiwi", "ris 150g" → namn + mängd + enhet ----------
const UNIT_WORDS = "kg|grams|gram|gr|g|ml|cl|dl|l|msk|tsk|tbsp|tsp|koppar|kopp|cups|cup|stycken|styck|st|pieces|piece|pcs|pc|oz";
const UNIT_MAP = { g: "g", gr: "g", gram: "g", grams: "g", kg: "kg", ml: "ml", cl: "cl", dl: "dl", l: "l", msk: "msk", tsk: "tsk", tbsp: "msk", tsp: "tsk", kopp: "kopp", koppar: "kopp", cup: "kopp", cups: "kopp", st: "st", styck: "st", stycken: "st", piece: "st", pieces: "st", pc: "st", pcs: "st", oz: "oz" };

function parseFoodInput(text) {
  const t = text.trim().toLowerCase().replace(/(\d),(\d)/g, "$1.$2");
  let m = t.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(${UNIT_WORDS})?\\b\\s*(.+)$`));
  let amount, unit, name;
  if (m) { amount = m[1]; unit = m[2]; name = m[3]; }
  else {
    m = t.match(new RegExp(`^(.+?)\\s+(\\d+(?:\\.\\d+)?)\\s*(${UNIT_WORDS})?$`));
    if (!m) return null;
    name = m[1]; amount = m[2]; unit = m[3];
  }
  let n = Number(amount);
  let u = UNIT_MAP[unit] || "st";
  if (u === "kg") { n *= 1000; u = "g"; }
  if (u === "l") { n *= 1000; u = "ml"; }
  if (u === "cl") { n *= 10; u = "ml"; }
  if (u === "oz") { n = Math.round(n * 28.35); u = "g"; }
  name = name.trim();
  if (!name || !n) return null;
  return { name, amount: n, unit: u };
}

// ungefärlig vikt för "1 st" av vanliga livsmedel (gram). Längre ord först så att t.ex. "körsbärstomat" går före "tomat".
const PIECE_GRAMS = [
  // engelska först (längre ord före kortare, t.ex. "cherry tomato" före "tomat")
  ["cherry tomato", 15], ["sweet potato", 200], ["garlic clove", 5], ["slice of bread", 35], ["chicken breast", 130],
  ["pineapple", 900], ["tangerine", 70], ["clementine", 70], ["nectarine", 140], ["peach", 150], ["plum", 60],
  ["orange", 150], ["avocado", 150], ["bell pepper", 150], ["potato", 100], ["rice cake", 8], ["strawberr", 12],
  ["banana", 120], ["apple", 150], ["pear", 170], ["tomato", 90], ["carrot", 70], ["lemon", 100], ["cucumber", 350],
  ["fig", 50], ["onion", 100], ["egg", 60], ["cookie", 10], ["biscuit", 10],
  ["körsbärstomat", 15], ["sötpotatis", 200], ["vitlöksklyfta", 5], ["knäckebröd", 12], ["brödskiva", 35],
  ["skiva bröd", 35], ["kycklingfilé", 130], ["mandarin", 70], ["clementin", 70], ["nektarin", 140],
  ["persik", 150], ["plommon", 60], ["apelsin", 150], ["avokado", 150], ["paprik", 150], ["potatis", 100],
  ["riskak", 8], ["jordgubb", 12], ["banan", 120], ["äppl", 150], ["päron", 170], ["tomat", 90],
  ["morot", 70], ["morötter", 70], ["citron", 100], ["gurk", 350], ["dadel", 8], ["dadlar", 8], ["fikon", 50], ["kiwi", 75], ["lime", 65],
  ["lök", 100], ["ägg", 60], ["kex", 10],
];
function pieceGrams(name) {
  const hit = PIECE_GRAMS.find(([word]) => name.includes(word));
  return hit ? hit[1] : null;
}

// vardagliga mått utan siffror: "ett glas mjölk" → 2 dl mjölk. Används när AI inte är tillgänglig.
const VAGUE_UNITS = [
  [/^(?:a|one|1)\s+(?:big\s+|large\s+)?glass\s+(?:of\s+)?/, 2, "dl"],
  [/^(?:a|one|1)\s+(?:big\s+|large\s+)?cup\s+(?:of\s+)?/, 1, "kopp"],
  [/^(?:a|one|1)\s+mug\s+(?:of\s+)?/, 2.5, "dl"],
  [/^(?:a|one|1)\s+(?:small\s+)?bowl\s+(?:of\s+)?/, 250, "g"],
  [/^(?:a|one|1)\s+plate\s+(?:of\s+)?/, 350, "g"],
  [/^(?:a|one|1)\s+(?:portion|serving)\s+(?:of\s+)?/, 300, "g"],
  [/^(?:a|one|1)\s+tablespoon\s+(?:of\s+)?/, 1, "msk"],
  [/^(?:a|one|1)\s+teaspoon\s+(?:of\s+)?/, 1, "tsk"],
  [/^(?:a|one|1)\s+handful\s+(?:of\s+)?/, 30, "g"],
  [/^(?:a|one|1)\s+(?:slice|piece)\s+(?:of\s+)?/, 30, "g"],
  [/^(?:ett|1)\s+(?:stort\s+)?glas\s+/, 2, "dl"],
  [/^(?:en|1)\s+(?:stor\s+)?kopp\s+/, 1, "kopp"],
  [/^(?:en|1)\s+mugg\s+/, 2.5, "dl"],
  [/^(?:en|1)\s+(?:liten\s+)?skål\s+/, 250, "g"],
  [/^(?:en|1)\s+(?:djup\s+)?tallrik\s+/, 350, "g"],
  [/^(?:en|1)\s+portion\s+/, 300, "g"],
  [/^(?:en|1)\s+matsked\s+/, 1, "msk"],
  [/^(?:en|1)\s+tesked\s+/, 1, "tsk"],
  [/^(?:en|1)\s+näve\s+/, 30, "g"],
  [/^(?:en|ett|1)\s+(?:bit|skiva)\s+/, 30, "g"],
];
function parseVagueAmount(text) {
  const t = String(text || "").trim().toLowerCase();
  for (const [re, amount, unit] of VAGUE_UNITS) {
    if (re.test(t)) {
      const name = t.replace(re, "").trim();
      if (name) return { name, amount, unit };
    }
  }
  return null;
}

// ---------- minne: vilken träff du valde för en viss sökning ----------
function normalizeQuery(q) {
  return (q || "").toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
}
async function loadChoices(session, query) {
  if (!session || !query) return [];
  try {
    const rows = await supabaseRest("food_choices", {
      accessToken: session.access_token,
      params: { user_id: `eq.${session.user.id}`, query: `eq.${query}`, select: "*", order: "last_used.desc", limit: "3" },
    });
    const list = (rows || []).map((r) => ({ ...r.food, remembered: true, useCount: r.use_count }));
    return await refreshRemembered(session, list);
  } catch (e) {
    return [];
  }
}

// hämtar sparade val färskt från vår livsmedelstabell via id, så att gamla kopior aldrig används
const FOOD_SOURCE_LABELS = { slv: tr("Livsmedelsverkets livsmedelsdatabas"), usda: "USDA FoodData Central" };
function foodRowToCandidate(r) {
  const extra = r.extra_micros && Object.keys(r.extra_micros).length ? r.extra_micros : null;
  const micros = { ...(extra || {}), ...(r.micros || {}) };
  return {
    id: r.id,
    source: (FOOD_SOURCE_LABELS[r.source] || r.source) + (extra ? tr(", kompletterat med USDA FoodData Central") : ""),
    name: (LANG === "en" ? r.name_en || r.name_sv : r.name_sv || r.name_en),
    per100: {
      kcal: Number(r.kcal) || 0, protein_g: Number(r.protein_g) || 0, carbs_g: Number(r.carbs_g) || 0,
      sugar_g: Number(r.sugar_g) || 0, fiber_g: Number(r.fiber_g) || 0, fat_g: Number(r.fat_g) || 0,
      satfat_g: Number(r.satfat_g) || 0, transfat_g: Number(r.transfat_g) || 0,
    },
    micros100: Object.keys(micros).length ? micros : null,
  };
}
async function refreshRemembered(session, remembered) {
  const ids = remembered.map((r) => r.id).filter((id) => /^(slv|usda)-/.test(id || ""));
  if (!ids.length) return remembered;
  try {
    const rows = await supabaseRest("foods", {
      accessToken: session.access_token,
      params: { id: `in.(${ids.join(",")})`, select: "*" },
    });
    const byId = new Map((rows || []).map((r) => [r.id, foodRowToCandidate(r)]));
    return remembered.map((r) => (byId.has(r.id) ? { ...byId.get(r.id), remembered: true, useCount: r.useCount } : r));
  } catch (e) {
    return remembered;
  }
}
function saveChoice(session, query, hit) {
  if (!session || !query || !hit || !hit.id) return;
  const { remembered, useCount, ...food } = hit;
  supabaseRest("food_choices", {
    method: "POST", upsert: true, accessToken: session.access_token,
    body: { user_id: session.user.id, query, food_id: food.id, food, use_count: (useCount || 0) + 1, last_used: new Date().toISOString() },
  }).catch((e) => console.error("Kunde inte spara valet:", e.message));
}
// minnet säger VILKEN träff du vill ha — värdena tas alltid färska från sökningen om träffen finns där
function mergeCandidates(remembered, results) {
  const fresh = new Map((results || []).map((r) => [r.id, r]));
  const rem = remembered.map((r) => (fresh.has(r.id) ? { ...fresh.get(r.id), remembered: true, useCount: r.useCount } : r));
  const seen = new Set(rem.map((r) => r.id));
  return [...rem, ...(results || []).filter((r) => !seen.has(r.id))];
}

async function lookupBarcode(code) {
  try {
    const res = await fetch("/api/food-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: code, lang: LANG }),
    });
    const data = await res.json();
    return data.product || null;
  } catch (e) {
    return null;
  }
}

async function lookupFoodDatabase(name, country) {
  try {
    const res = await fetch("/api/food-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: name, country: country && country !== "OTHER" ? country : null, lang: LANG }),
    });
    return await res.json();
  } catch (e) {
    return { results: [] };
  }
}

async function estimateFoodValues(name, amountStr, unit, known100Obj, dbHit = null) {
  const isGrams = unit === "g";
  const knownPer100 = {};
  KNOWN_FIELDS.forEach(({ key }) => {
    const v = known100Obj[key];
    if (v !== undefined && v !== "" && !isNaN(Number(v))) knownPer100[key] = Number(v);
  });

  // värden från den databasträff användaren valde (fält hen själv fyllt i går före)
  const dbPer100 = {};
  if (dbHit && dbHit.per100) {
    KNOWN_FIELDS.forEach(({ key }) => {
      if (!(key in knownPer100) && typeof dbHit.per100[key] === "number") dbPer100[key] = dbHit.per100[key];
    });
  }
  // egna värden + liknande livsmedel: underkategorier räknas om efter DINA värden (mättat fett kan aldrig bli mer än fettet)
  const hasOwn = Object.keys(knownPer100).length > 0;
  if (dbHit && hasOwn && dbHit.per100) {
    const d = dbHit.per100;
    const byRatio = (parent, child) => {
      if (child in knownPer100 || !(parent in knownPer100)) return;
      if (d[parent] > 0 && typeof d[child] === "number") dbPer100[child] = Math.min(knownPer100[parent], (d[child] * knownPer100[parent]) / d[parent]);
      else if (knownPer100[parent] === 0) dbPer100[child] = 0;
    };
    byRatio("fat_g", "satfat_g"); byRatio("fat_g", "transfat_g"); byRatio("carbs_g", "sugar_g"); byRatio("carbs_g", "fiber_g");
    if (knownPer100.kcal && d.kcal > 0) {
      const k = knownPer100.kcal / d.kcal;
      ["protein_g", "carbs_g", "fat_g"].forEach((key) => { if (!(key in knownPer100) && typeof d[key] === "number") dbPer100[key] = d[key] * k; });
    }
  }
  const dbMicros100 = dbHit && dbHit.micros100 && Object.keys(dbHit.micros100).length ? dbHit.micros100 : null;

  // inga riktiga värden alls (varken databas eller dina egna) → hittades inte. AI fyller ALDRIG i näringsvärden.
  const hasRealValues = Object.keys(knownPer100).length > 0 || Object.keys(dbPer100).length > 0;
  if (!hasRealValues) return { notFound: true };

  // gram för andra enheter än gram: AI uppskattar bara MÄNGDEN (t.ex. 1 dl havregryn ≈ 35 g), annars en tabell
  let estimatedGrams = Number(amountStr);
  if (!isGrams) {
    const fromTable = unit === "st"
      ? (pieceGrams(String(dbHit ? dbHit.name : name).toLowerCase()) || pieceGrams(String(name).toLowerCase()) || 100) * Number(amountStr)
      : Number(amountStr) * (FALLBACK_UNIT_GRAMS[unit] || 100);
    estimatedGrams = (await aiEstimateGrams(dbHit ? dbHit.name : name, amountStr, unit)) || fromTable;
  }
  const factor = estimatedGrams / 100;

  const combinedPer100 = { ...dbPer100, ...knownPer100 };
  const scaled = {};
  KNOWN_FIELDS.forEach(({ key }) => {
    const v = combinedPer100[key];
    scaled[key] = typeof v === "number" && v > 0 ? Math.round(v * factor * 10) / 10 : 0;
  });

  const microAmounts = {};
  if (dbMicros100) {
    Object.entries(dbMicros100).forEach(([k, v]) => { microAmounts[k] = Math.round(v * factor * 1000) / 1000; });
  }

  return {
    ...scaled, microAmounts, bonus: [],
    estimatedKeys: hasOwn && dbHit ? Object.keys(dbPer100) : [],
    estimatedGrams: Math.round(estimatedGrams),
    source: dbHit ? dbHit.source : null, matchedName: dbHit ? dbHit.name : null,
    uncooked: isUncookedWeight(dbHit ? dbHit.name : ""),
    ok: true, microsMissing: !dbMicros100,
  };
}

export default function DotApp() {
  const [page, setPage] = useState("login"); // login | email-login | auth | profile | log | dashboard
  const [authInfo, setAuthInfo] = useState({ email: "", password: "" });
  const [consent, setConsent] = useState(false); // samtycke till hälsouppgifter vid registrering
  const [session, setSession] = useState(null); // { access_token, refresh_token, expires_at, user: { id, email } }
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [restoring, setRestoring] = useState(() =>
    !!loadStoredSession()?.refresh_token || window.location.hash.includes("access_token")
  );

  // när appen öppnas: logga in automatiskt om det finns en sparad inloggning
  useEffect(() => {
    // tillbaka från Google: inloggningsuppgifterna ligger i adressen efter #
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("access_token") || hash.get("error")) {
      window.history.replaceState(null, "", window.location.pathname); // städa bort dem ur adressfältet
    }
    if (hash.get("error")) {
      setAuthError(tr("Google-inloggningen misslyckades: ") + (hash.get("error_description") || hash.get("error")));
    }
    if (hash.get("access_token")) {
      (async () => {
        try {
          const accessToken = hash.get("access_token");
          const user = await supabaseGetUser(accessToken);
          await startSession(buildSession({
            access_token: accessToken,
            refresh_token: hash.get("refresh_token"),
            expires_at: Number(hash.get("expires_at")) || undefined,
            expires_in: Number(hash.get("expires_in")) || 3600,
            user,
          }));
        } catch (e) {
          console.error("Google-inloggningen misslyckades:", e.message);
          setAuthError(tr("Google-inloggningen misslyckades: ") + e.message);
        } finally {
          setRestoring(false);
        }
      })();
      return;
    }

    const stored = loadStoredSession();
    if (!stored?.refresh_token) return;
    (async () => {
      try {
        const fresh = await refreshSession(stored.refresh_token);
        await startSession(fresh);
      } catch (e) {
        console.error("Kunde inte återställa inloggningen:", e.message);
        saveStoredSession(null);
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  // spara inloggningen på enheten, och rensa den vid utloggning
  useEffect(() => {
    if (session) saveStoredSession(session);
    else if (!restoring) saveStoredSession(null);
  }, [session, restoring]);

  // förnya åtkomstbiljetten 5 min innan den går ut, och när appen öppnas igen
  useEffect(() => {
    if (!session?.refresh_token) return;
    const REFRESH_MARGIN = 5 * 60 * 1000;
    let cancelled = false;

    async function doRefresh() {
      try {
        const fresh = await refreshSession(session.refresh_token);
        if (!cancelled) setSession(fresh);
      } catch (e) {
        console.error("Kunde inte förnya inloggningen:", e.message);
        if (!cancelled) setSyncError(tr("Din inloggning har gått ut — logga ut och in igen."));
      }
    }

    const msLeft = session.expires_at * 1000 - Date.now() - REFRESH_MARGIN;
    const timer = setTimeout(doRefresh, Math.max(msLeft, 0));

    function onVisible() {
      if (document.visibilityState === "visible" && session.expires_at * 1000 - Date.now() < REFRESH_MARGIN) {
        doRefresh();
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session]);

  const [profileInfo, setProfileInfo] = useState({
    name: "", age: "", sex: "kvinna", height: "", weight: "",
    activity: "moderat", goal: [], country: guessCountry(),
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
  const [candidates, setCandidates] = useState([]); // databasträffar att välja bland
  const [scanned, setScanned] = useState(null); // produkt från streckkodsskanning
  const [searchNote, setSearchNote] = useState(""); // t.ex. "visar träffar för kiwi"
  const [justLogged, setJustLogged] = useState(""); // kort bekräftelse på hemskärmen
  useEffect(() => {
    if (!justLogged) return;
    const t = setTimeout(() => setJustLogged(""), 2500);
    return () => clearTimeout(t);
  }, [justLogged]);
  const [ownValuesPick, setOwnValuesPick] = useState(false); // listan används för att fylla i det du inte angett
  const [photoItems, setPhotoItems] = useState([]); // livsmedel som AI såg på bilden, med värden från databasen
  const [photoMissing, setPhotoMissing] = useState([]);
  useEffect(() => { aiAccessToken = session?.access_token || null; }, [session]);
  const [displayQty, setDisplayQty] = useState(null); // t.ex. { amount: 2, unit: "st" } när du skrev "2 kiwi" 

  const ACTIVITY_MULT = { stillasittande: 1.2, lätt: 1.375, moderat: 1.55, aktiv: 1.725, "mycket aktiv": 1.9 };

  async function handleSignup() {
    setAuthLoading(true); setAuthError("");
    try {
      const data = await supabaseAuth("signup", { email: authInfo.email, password: authInfo.password });
      if (data.access_token) {
        setSession(buildSession(data));
        await loadUserData(data.access_token, data.user.id); // clears any leftover demo data — new account starts empty
        setPage("profile");
      } else {
        setAuthError(tr("Kolla din mail för att bekräfta ditt konto, logga sedan in."));
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
          id: l.id, grams: l.grams ?? null, amount: l.amount ?? null, unit: l.unit ?? null,
          name: l.name, kcal: l.kcal, protein_g: l.protein_g, carbs_g: l.carbs_g, sugar_g: l.sugar_g,
          fiber_g: l.fiber_g, fat_g: l.fat_g, satfat_g: l.satfat_g, transfat_g: l.transfat_g,
          microAmounts: l.micro_amounts || {}, bonus: l.bonus || [], estimatedKeys: [],
        });
      });
      const weekObj = {};
      (days || []).forEach((d) => { weekObj[d.log_date] = { weight: d.weight_kg, photoPath: photoPathFromUrl(d.photo_url) }; });
      const signed = await signPhotoPaths(accessToken, Object.values(weekObj).map((d) => d.photoPath));
      Object.values(weekObj).forEach((d) => { d.photo = d.photoPath ? signed[d.photoPath] || null : null; });
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

  async function startSession(sess) {
    setSession(sess);
    const profiles = await supabaseRest("profiles", { accessToken: sess.access_token, params: { id: `eq.${sess.user.id}`, select: "*" } });
    await loadUserData(sess.access_token, sess.user.id);
    if (profiles && profiles.length > 0) {
      const p = profiles[0];
      setProfileInfo({
        name: "", age: String(p.age || ""), sex: p.sex || "kvinna", height: String(p.height_cm || ""),
        weight: String(p.weight_kg || ""), activity: p.activity || "moderat", goal: p.goals || [],
        country: p.country || guessCountry(),
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
  }

  async function handleLogin() {
    setAuthLoading(true); setAuthError("");
    try {
      const data = await supabaseAuth("token?grant_type=password", { email: authInfo.email, password: authInfo.password });
      await startSession(buildSession(data));
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
          units_weight: units.weight, units_height: units.height, country: profileInfo.country || null,
        },
      }).catch((e) => { console.error("Kunde inte spara profilen:", e.message); setSyncError(tr("Kunde inte spara profilen: ") + e.message); });
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

  // ---------- loggade livsmedel: lägg till, ändra mängd, ta bort ----------
  function logBody(e) {
    return {
      name: e.name, kcal: e.kcal, protein_g: e.protein_g, carbs_g: e.carbs_g, sugar_g: e.sugar_g,
      fiber_g: e.fiber_g, fat_g: e.fat_g, satfat_g: e.satfat_g, transfat_g: e.transfat_g,
      micro_amounts: e.microAmounts || {}, bonus: e.bonus || [], grams: e.grams ?? null,
      amount: e.amount ?? null, unit: e.unit ?? null,
    };
  }
  function addLogEntry(entry) {
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const withTmp = { ...entry, tmpId };
    setDayFoodLogs((logs) => ({ ...logs, [todayKey]: [...(logs[todayKey] || []), withTmp] }));
    if (!session) return;
    supabaseRest("daily_logs", {
      method: "POST", accessToken: session.access_token,
      body: { user_id: session.user.id, log_date: todayKey, ...logBody(entry) },
    })
      .then((rows) => {
        const row = Array.isArray(rows) ? rows[0] : null;
        if (!row) return;
        setDayFoodLogs((logs) => ({
          ...logs,
          [todayKey]: (logs[todayKey] || []).map((e) => (e.tmpId === tmpId ? { ...e, id: row.id } : e)),
        }));
      })
      .catch((e) => { console.error("Kunde inte spara loggningen:", e.message); setSyncError(tr("Kunde inte spara till databasen: ") + e.message); });
  }
  const sameEntry = (a, b) => (a.id && a.id === b.id) || (a.tmpId && a.tmpId === b.tmpId);
  function removeLogEntry(dayKey, entry) {
    setDayFoodLogs((logs) => ({ ...logs, [dayKey]: (logs[dayKey] || []).filter((e) => !sameEntry(e, entry)) }));
    if (session && entry.id) {
      supabaseRest("daily_logs", { method: "DELETE", accessToken: session.access_token, params: { id: `eq.${entry.id}` } })
        .catch((e) => { console.error("Kunde inte ta bort:", e.message); setSyncError(tr("Kunde inte ta bort från databasen: ") + e.message); });
    }
  }
  function scaleLogEntry(dayKey, entry, factor, newGrams, newAmount, newUnit) {
    if (!(factor > 0)) return;
    const r1 = (v) => Math.round((Number(v) || 0) * factor * 10) / 10;
    const scaled = {
      ...entry, grams: newGrams ?? (entry.grams ? Math.round(entry.grams * factor) : null),
      amount: newAmount ?? entry.amount ?? null, unit: newUnit ?? entry.unit ?? null,
    };
    KNOWN_FIELDS.forEach(({ key }) => { scaled[key] = r1(entry[key]); });
    scaled.bonus = (entry.bonus || []).map((b) => (typeof b.qty === "number" ? { ...b, qty: b.qty * factor } : b));
    scaled.microAmounts = Object.fromEntries(Object.entries(entry.microAmounts || {}).map(([k, v]) => [k, Math.round((Number(v) || 0) * factor * 1000) / 1000]));
    setDayFoodLogs((logs) => ({ ...logs, [dayKey]: (logs[dayKey] || []).map((e) => (sameEntry(e, entry) ? scaled : e)) }));
    if (session && entry.id) {
      supabaseRest("daily_logs", { method: "PATCH", accessToken: session.access_token, params: { id: `eq.${entry.id}` }, body: logBody(scaled) })
        .catch((e) => { console.error("Kunde inte ändra:", e.message); setSyncError(tr("Kunde inte spara ändringen: ") + e.message); });
    }
  }

  // det du loggat senast (olika livsmedel, nyast först) — ett tryck loggar samma sak igen
  const recentFoods = (() => {
    const seen = new Set();
    const out = [];
    for (const d of Object.keys(dayFoodLogs).sort().reverse().slice(0, 21)) {
      for (const e of [...(dayFoodLogs[d] || [])].reverse()) {
        const k = (e.name || "").trim().toLowerCase();
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(e);
        if (out.length >= 8) return out;
      }
    }
    return out;
  })();
  function relog(e) {
    const { id, tmpId, ...rest } = e;
    addLogEntry(rest);
    setJustLogged(e.name || tr("Måltid"));
    reset();
  }

  function reset() {
    setMode("idle"); setFoodName(""); setWeight(""); setWeightUnit("g"); setPhotoDesc("");
    setPhotoData(null); setResult(null); setConfirmed(false);
    setChatOpen(false); setChatMsgs([]); setError("");
    setKnown100({}); setShow100(false); setCandidates([]); setScanned(null);
    setPhotoItems([]); setPhotoMissing([]); setSearchNote("");
  }

  async function handleScanned(code) {
    setLoading(true); setError("");
    const product = await lookupBarcode(code);
    setLoading(false);
    if (!product) {
      setScanned(null);
      setMode("manual");
      setError(trf("Produkten ({0}) finns inte i databasen än. Sök på namnet i stället, eller fyll i värdena från förpackningen här nedanför.", code));
      return;
    }
    setScanned(product);
    setCandidates([product]);
    setFoodName(product.name);
    setWeight(String(product.servingGrams || 100));
    setWeightUnit("g");
    setMode("manual");
  }

  async function estimateManual() {
    if (scanned && foodName.trim() === scanned.name) {
      if (!weight.trim()) { setError(tr("Skriv hur många gram du åt.")); return; }
      await finishManual(scanned, { name: scanned.name, amount: weight.trim(), unit: weightUnit });
      return;
    }
    setScanned(null);
    const original = foodName.trim();
    let name = original;
    let amount = weight.trim();
    let unit = weightUnit;
    let altQueries = [];
    let parsed = parseFoodInput(name);
    // vardagliga mått i texten ("ett glas mjölk", "en skål havregrynsgröt") → tolka utan AI först
    const vague = !parsed ? parseVagueAmount(name) : null;
    // ingen siffra i texten → låt AI tolka den (även om du fyllt i mängden själv: då behålls din mängd)
    if (!parsed && name && (!amount || vague || name.split(/\s+/).length > 1)) {
      setLoading(true); setError("");
      const ai = await aiInterpret(name);
      setLoading(false);
      if (ai) { parsed = ai; altQueries = ai.alternatives || []; }
      // säger texten själv hur mycket ("ett glas") gäller det — annars din siffra i Mängd, om du fyllt i en
      if (vague) parsed = { ...(parsed || {}), ...vague, name: parsed?.name || vague.name };
      else if (parsed && amount) parsed = { ...parsed, amount: Number(amount.replace(",", ".")) || parsed.amount, unit };
    }
    if (parsed) {
      name = parsed.name;
      if (parsed.unit === "st") {
        let pg = pieceGrams(parsed.name);
        if (!pg) {
          setLoading(true);
          const g = await aiEstimateGrams(parsed.name, 1, "st");
          setLoading(false);
          if (g) pg = g;
        }
        if (!pg) {
          setFoodName(name); setWeight(""); setWeightUnit("g");
          setMode("manual");
          setError(trf("Jag vet inte hur mycket en \"{0}\" väger ungefär — skriv mängden i gram i fältet här nedanför.", name));
          return;
        }
        amount = String(Math.round(parsed.amount * pg));
        unit = "g";
        setDisplayQty({ amount: parsed.amount, unit: "st" });
      } else {
        amount = String(parsed.amount);
        unit = parsed.unit;
        setDisplayQty(null);
      }
      setFoodName(name); setWeight(amount); setWeightUnit(unit);
    } else {
      setDisplayQty(null);
    }
    if (!name) return;
    if (!amount) {
      setFoodName(name);
      setMode("manual");
      setError(tr("Hur mycket? Fyll i mängden här nedanför — eller skriv den direkt, t.ex. \"150 g ris\" eller \"2 kiwi\"."));
      return;
    }

    // har du fyllt i värden från förpackningen används BARA dem — ingen databasvara blandas in
    const hasOwnValues = KNOWN_FIELDS.some(({ key }) => known100[key] !== undefined && String(known100[key]).trim() !== "");
    if (hasOwnValues) {
      // dina värden används alltid — välj ett liknande livsmedel för att fylla i resten (eller hoppa över)
      setLoading(true); setError(""); setSearchNote("");
      const similar = await lookupFoodDatabase(name, profileInfo.country);
      setLoading(false);
      const list = (similar.results || []).filter((c) => !String(c.id).startsWith("off-") || c.micros100);
      if (list.length) { setCandidates(list); setOwnValuesPick(true); setMode("pick"); return; }
      setCandidates([]);
      await finishManual(null, { name, amount, unit });
      return;
    }
    setOwnValuesPick(false);

    setLoading(true); setError(""); setCandidates([]);
    const query = normalizeQuery(name);
    const [lookup, remembered] = await Promise.all([lookupFoodDatabase(name, profileInfo.country), loadChoices(session, query)]);
    let merged = mergeCandidates(remembered, lookup.results);
    setSearchNote("");
    // inga träffar på hela texten → prova kortare varianter: "arla feta ost" → "arla feta", "kiwi med skal" → "kiwi"
    const words = name.toLowerCase().split(/\s+/).filter(Boolean);
    if (merged.length === 0 && words.length > 1) {
      const STOP = new Set(["med", "utan", "och", "m", "u", "m.", "u.", "with", "without", "and", "i", "på", "en", "ett", "a"]);
      const core = words.filter((w) => !STOP.has(w));
      const tries = [];
      if (words.length > 2) tries.push(words.slice(0, -1).join(" "));
      if (core.length && core.length < words.length) tries.push(core.join(" "));
      core.filter((w) => w.length >= 3).forEach((w) => tries.push(w));
      for (const q of [...new Set(tries)].filter((q) => q !== name.toLowerCase())) {
        const shorter = await lookupFoodDatabase(q, profileInfo.country);
        if ((shorter.results || []).length) {
          merged = shorter.results;
          setSearchNote(trf("Inga träffar för \"{0}\" — visar träffar för \"{1}\".", name, q));
          break;
        }
      }
    }
    // fortfarande inget → be AI om andra sökord (t.ex. rättstavat eller på engelska)
    if (merged.length === 0) {
      if (!altQueries.length) {
        const ai = await aiInterpret(`${amount} ${UNIT_LABELS[unit] || unit} ${name}`);
        altQueries = ai ? [ai.name, ...(ai.alternatives || [])] : [];
      }
      for (const q of [...new Set(altQueries)].filter((q) => q && q.toLowerCase() !== name.toLowerCase())) {
        const alt = await lookupFoodDatabase(q, profileInfo.country);
        if ((alt.results || []).length) {
          merged = alt.results;
          setSearchNote(trf("Inga träffar för \"{0}\" — visar träffar för \"{1}\".", name, q));
          break;
        }
      }
    }
    setCandidates(merged);
    const ctx = { name, amount, unit };
    if (merged.length === 0) { setLoading(false); await finishManual(null, ctx); return; }
    // minnet först: har du valt något för exakt den här sökningen förut → använd det direkt (du kan byta träff efteråt)
    if (remembered.length > 0) { setLoading(false); await finishManual(merged[0], ctx); return; }
    // annars väljer AI den rad som passar bäst. Osäker AI (eller ingen AI) → du väljer själv.
    const pick = await aiPickCandidate(original, merged);
    setLoading(false);
    if (pick) { await finishManual(pick, ctx); return; }
    setMode("pick");
  }

  async function finishManual(hit, ctx = null) {
    const name = ctx ? ctx.name : foodName;
    const amount = ctx ? ctx.amount : weight;
    const unit = ctx ? ctx.unit : weightUnit;
    setLoading(true); setError(""); setConfirmed(false);
    const res = await estimateFoodValues(name, amount, unit, known100, hit);
    setLoading(false);
    if (res.notFound) {
      setError(trf("Hittade inte \"{0}\" i databasen. Kolla stavningen, prova ett annat ord eller engelska (t.ex. \"chicken breast\") — eller fyll i värdena från förpackningen här nedanför.", name));
      setShow100(true);
      setMode("manual");
      return;
    }
    if (hit) saveChoice(session, normalizeQuery(name), hit);
    setResult(res);
    setMode("result");
    if (res.microsMissing) setError(tr("Vitaminer och mineraler finns inte uppmätta för den här träffen, så de räknas inte med."));
  }

  // "Byt träff": visa alla träffar igen — söker på nytt om listan inte finns kvar
  async function switchHit() {
    setConfirmed(false); setError("");
    if (candidates.length > 1) { setMode("pick"); return; }
    setLoading(true);
    const lookup = await lookupFoodDatabase(foodName, profileInfo.country);
    setLoading(false);
    const list = lookup.results || [];
    if (list.length) { setCandidates(list); setOwnValuesPick(false); setMode("pick"); }
    else setError(trf("Hittade inga andra träffar för \"{0}\". Prova att söka med ett annat ord.", foodName));
  }

  // foto: AI ser VAD som ligger på tallriken och ungefär hur mycket — värdena hämtas från databasen
  async function estimatePhoto() {
    if (!photoData) return;
    setLoading(true); setError("");
    let items;
    try {
      items = await aiPhotoItems(photoData, photoDesc.trim());
    } catch (e) {
      setLoading(false);
      setError(/inte aktiverad/i.test(e.message) ? tr("Bildloggning kräver AI, som inte är aktiverad än. Logga manuellt så länge.") : tr("Kunde inte tolka bilden: ") + e.message);
      return;
    }
    if (!items.length) { setLoading(false); setError(tr("Hittade ingen mat på bilden. Prova en annan bild eller lägg till en beskrivning.")); return; }
    const found = [];
    const missing = [];
    for (const it of items) {
      const [lookup, remembered] = await Promise.all([lookupFoodDatabase(it.name, profileInfo.country), loadChoices(session, normalizeQuery(it.name))]);
      const merged = mergeCandidates(remembered, lookup.results);
      if (!merged.length) { missing.push(it.name); continue; }
      const hit = remembered.length ? merged[0] : (await aiPickCandidate(it.name, merged)) || merged[0];
      const res = await estimateFoodValues(it.name, String(it.grams), "g", {}, hit);
      if (res.notFound) { missing.push(it.name); continue; }
      found.push({ key: `${it.name}-${found.length}`, name: it.name, grams: it.grams, res });
    }
    setLoading(false);
    if (!found.length) { setError(trf("Hittade inte {0} i databasen. Logga manuellt i stället.", missing.join(", "))); return; }
    setPhotoItems(found);
    setPhotoMissing(missing);
    setConfirmed(false);
    setMode("photo-result");
  }

  function logPhotoItems() {
    if (confirmed) return;
    setConfirmed(true);
    photoItems.forEach((it) => addLogEntry({ name: it.name, ...it.res, grams: it.res.estimatedGrams, amount: it.grams, unit: "g" }));
    setJustLogged(photoItems.map((it) => it.name).join(", "));
    reset();
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
        `Du är en kort, konkret hjälpreda inne i en matloggningsapp. Användaren loggar just nu ` +
        `"${foodName}" (${weight || "okänd"} ${UNIT_LABELS[weightUnit] || "g"}) med dessa värden från livsmedelsdatabasen: ` +
        `${JSON.stringify({ kcal: result.kcal, protein_g: result.protein_g, carbs_g: result.carbs_g, fat_g: result.fat_g, fiber_g: result.fiber_g, gram: result.estimatedGrams, källa: result.source, träff: result.matchedName })}. ` +
        `Svara kort (max 3 meningar) på ${LANG === "sv" ? "svenska" : "engelska"}. Hitta aldrig på egna näringsvärden — utgå från siffrorna ovan. ` +
        `Neutral ton: informera, moralisera inte. Håll dig till bred forskningskonsensus.`;
      const apiMsgs = nextMsgs.map((m) => ({ role: m.role, content: m.text }));
      const text = await callClaude(apiMsgs, system);
      setChatMsgs((m) => [...m, { role: "assistant", text: text || tr("Kunde inte svara just nu.") }]);
    } catch (e) {
      setChatMsgs((m) => [...m, { role: "assistant", text: /inte aktiverad/i.test(e.message) ? tr("AI är inte aktiverad än.") : tr("Kunde inte nå AI:n just nu.") }]);
    } finally {
      setChatLoading(false);
    }
  }

  const update = (key) => (v) => setResult((r) => ({ ...r, [key]: v }));
  const isOnboarding = page === "login" || page === "email-login" || page === "auth" || page === "profile";

  if (restoring) {
    return (
      <div style={{ minHeight: "100vh", background: C.bgGradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{tr("@keyframes spin { to { transform: rotate(360deg) } }")}</style>
        <Loader2 size={24} color={C.accent} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

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
<DotLogo size={30} />
            </div>

            {page === "login" && (
              <>
                <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 4, textAlign: "center" }}>
                  {tr("Välkommen")}
                </p>
                <p style={{ fontSize: 12.5, color: C.textDim, marginBottom: 30, textAlign: "center" }}>
                  {tr("Discipline Over Time.")}
                </p>

                <button onClick={startGoogleLogin} style={socialBtn}>
                  <GoogleIcon /> {tr("Fortsätt med Google")}
                </button>
                <p style={{ fontSize: 10.5, color: C.textFaint, textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
                  {tr("Är du ny godkänner du att DOT sparar dina kost- och hälsouppgifter enligt")}{" "}
                  <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>{tr("integritetspolicyn")}</a> {tr("(16 år eller äldre).")}
                </p>
                <button disabled style={{ ...socialBtn, marginTop: 10, opacity: 0.45, cursor: "default" }}>
                  <AppleIcon /> {tr("Apple — kommer snart")}
                </button>
                {authError && <p style={{ fontSize: 11.5, color: "#E08F8F", marginTop: 12, textAlign: "center" }}>{authError}</p>}

                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 11, color: C.textFaint }}>{tr("eller")}</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                <button onClick={() => setPage("email-login")} style={{ ...ghostBtn, width: "100%", padding: "12px 0" }}>
                  <Mail size={15} /> {tr("Fortsätt med mail")}
                </button>

                <p style={{ fontSize: 12, color: C.textFaint, textAlign: "center", marginTop: 30 }}>
                  {tr("Inget konto än?")} <span onClick={() => setPage("auth")} style={{ color: C.accent, cursor: "pointer" }}>{tr("Skapa konto")}</span>
                </p>
              </>
            )}

            {page === "email-login" && (
              <>
                <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{tr("Logga in")}</p>
                <p style={{ fontSize: 12.5, color: C.textDim, marginBottom: 26 }}>{tr("Med din e-post och ditt lösenord.")}</p>
                <label style={onbLabel}>{tr("E-post")}</label>
                <input
                  value={authInfo.email} onChange={(e) => setAuthInfo((a) => ({ ...a, email: e.target.value }))}
                  placeholder={tr("du@exempel.se")} style={onbInput}
                />
                <label style={onbLabel}>{tr("Lösenord")}</label>
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
                  {authLoading ? tr("Loggar in…") : <>{tr("Logga in")} <ChevronRight size={15} /></>}
                </button>
                <p onClick={() => { setPage("login"); setAuthError(""); }} style={{ fontSize: 11.5, color: C.textFaint, textAlign: "center", marginTop: 14, cursor: "pointer" }}>
                  {tr("← Tillbaka")}
                </p>
              </>
            )}

            {page === "auth" && (
              <>
                <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{tr("Skapa konto")}</p>
                <p style={{ fontSize: 12.5, color: C.textDim, marginBottom: 26 }}>
                  {tr("Discipline Over Time.")}
                </p>
                <label style={onbLabel}>{tr("E-post")}</label>
                <input
                  value={authInfo.email} onChange={(e) => setAuthInfo((a) => ({ ...a, email: e.target.value }))}
                  placeholder={tr("du@exempel.se")} style={onbInput}
                />
                <label style={onbLabel}>{tr("Lösenord")}</label>
                <input
                  type="password" value={authInfo.password} onChange={(e) => setAuthInfo((a) => ({ ...a, password: e.target.value }))}
                  placeholder={tr("•••••••• (minst 6 tecken)")} style={{ ...onbInput, marginBottom: 12 }}
                />
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: C.textDim, lineHeight: 1.5, cursor: "pointer", marginTop: 4 }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: 3, accentColor: C.accent, width: 16, height: 16, flexShrink: 0 }} />
                  <span>
                    {tr("Jag är minst 16 år och godkänner att DOT sparar mina kost- och hälsouppgifter enligt")}{" "}
                    <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>{tr("integritetspolicyn")}</a>.
                  </span>
                </label>
                {authError && <p style={{ fontSize: 11.5, color: "#E08F8F", marginTop: 12, marginBottom: 0 }}>{authError}</p>}
                <button
                  onClick={handleSignup}
                  disabled={!authInfo.email.trim() || !authInfo.password.trim() || !consent || authLoading}
                  style={{ ...primaryBtn, width: "100%", opacity: !authInfo.email.trim() || !authInfo.password.trim() || !consent ? 0.5 : 1, marginTop: 16 }}
                >
                  {authLoading ? tr("Skapar konto…") : <>{tr("Skapa konto")} <ChevronRight size={15} /></>}
                </button>
                <p style={{ fontSize: 11.5, color: C.textFaint, textAlign: "center", marginTop: 14 }}>
                  {tr("Har du redan ett konto?")} <span onClick={() => { setPage("login"); setAuthError(""); }} style={{ color: C.accent, cursor: "pointer" }}>{tr("Logga in")}</span>
                </p>
              </>
            )}

            {page === "profile" && (() => {
              const STEPS = ["country", "sex", "age", "height", "weight", "activity", "goal"];
              const step = STEPS[profileStep];
              const stepValid = {
                sex: !!profileInfo.sex,
                age: !!profileInfo.age,
                height: !!profileInfo.height,
                weight: !!profileInfo.weight,
                activity: !!profileInfo.activity,
                goal: profileInfo.goal.length > 0,
                country: !!profileInfo.country,
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
                    {step === "country" && (
                      <>
                        <p style={onbQ}>{tr("Var bor du?")}</p>
                        <p style={onbSub}>{tr("Då visar vi livsmedel och varor från ditt land först när du loggar.")}</p>
                        <ChipGroup options={COUNTRIES} value={profileInfo.country}
                          onChange={(v) => setProfileInfo((p) => ({ ...p, country: v }))} large stack />
                      </>
                    )}
                    {step === "sex" && (
                      <>
                        <p style={onbQ}>{tr("Vilket kön har du?")}</p>
                        <p style={onbSub}>{tr("Hjälper oss räkna ut dina mål mer exakt.")}</p>
                        <ChipGroup options={[{ v: "kvinna", l: tr("Kvinna") }, { v: "man", l: tr("Man") }]}
                          value={profileInfo.sex} onChange={(v) => setProfileInfo((p) => ({ ...p, sex: v }))} large />
                      </>
                    )}
                    {step === "age" && (
                      <>
                        <p style={onbQ}>{tr("Hur gammal är du?")}</p>
                        <p style={onbSub}>{tr("Ålder påverkar din dagliga energiförbrukning.")}</p>
                        <input value={profileInfo.age} inputMode="numeric" autoFocus
                          onChange={(e) => setProfileInfo((p) => ({ ...p, age: e.target.value.replace(/[^0-9]/g, "") }))}
                          placeholder="28" style={onbInputBig} />
                      </>
                    )}
                    {step === "height" && (
                      <>
                        <p style={onbQ}>{tr("Hur lång är du?")}</p>
                        <p style={onbSub}>{units.height === "ft" ? tr("I tum.") : tr("I centimeter.")}</p>
                        <input value={displayHeight(profileInfo.height, units.height)} inputMode="numeric" autoFocus
                          onChange={(e) => setProfileInfo((p) => ({ ...p, height: parseHeightInput(e.target.value.replace(/[^0-9]/g, ""), units.height) }))}
                          placeholder={units.height === "ft" ? "70" : "178"} style={onbInputBig} />
                      </>
                    )}
                    {step === "weight" && (
                      <>
                        <p style={onbQ}>{tr("Hur mycket väger du?")}</p>
                        <p style={onbSub}>{units.weight === "lbs" ? tr("I pund, ungefärligt räcker.") : tr("I kilo, ungefärligt räcker.")}</p>
                        <input value={displayWeight(profileInfo.weight, units.weight)} inputMode="numeric" autoFocus
                          onChange={(e) => setProfileInfo((p) => ({ ...p, weight: parseWeightInput(e.target.value.replace(/[^0-9.]/g, ""), units.weight) }))}
                          placeholder={units.weight === "lbs" ? "165" : "75"} style={onbInputBig} />
                      </>
                    )}
                    {step === "activity" && (
                      <>
                        <p style={onbQ}>{tr("Hur aktiv är du i vardagen?")}</p>
                        <p style={onbSub}>{tr("Räknat utanför träningspass.")}</p>
                        <ChipGroup
                          options={ACTIVITY_LEVELS}
                          value={profileInfo.activity} onChange={(v) => setProfileInfo((p) => ({ ...p, activity: v }))} large stack
                        />
                      </>
                    )}
                    {step === "goal" && (
                      <>
                        <p style={onbQ}>{tr("Vad vill du fokusera på?")}</p>
                        <p style={onbSub}>{tr("Välj gärna flera — det här styr hur vi sätter dina mål, du kan ändra senare.")}</p>
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
                      {profileStep === STEPS.length - 1 ? tr("Räkna ut mina mål") : tr("Fortsätt")} <ChevronRight size={15} />
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
<DotLogo size={19} />
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
            {Math.round(dailyLog.reduce((s, e) => s + (e.kcal || 0), 0))} / {targets.kcal} {tr("kcal")}
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
              try {
                const res = await fetch("/api/delete-account", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || tr("Okänt fel"));
              } catch (e) {
                console.error("Kunde inte radera kontot:", e.message);
                setSyncError(tr("Kunde inte radera kontot: ") + e.message + tr(" Försök igen om en stund."));
                return;
              }
            }
            saveStoredSession(null);
            setSession(null); setDataLoaded(false);
            setDayFoodLogs({}); setWeekLog({}); setSavedMeals([]);
            setProfileInfo({ name: "", age: "", sex: "kvinna", height: "", weight: "", activity: "moderat", goal: [], country: guessCountry() });
            setTargets(DAILY_TARGETS); setUnits({ weight: "kg", height: "cm" });
            setAuthInfo({ email: "", password: "" });
            setProfileStep(0);
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
            addLogEntry({ ...meal, name: meal.name, grams: null });
            setPage("log");
          }}
          onCreateNew={() => { setMealName(""); setMealIngredients([]); setPage("meal-builder"); }}
        />
      )}

      {page === "meal-builder" && (
        <MealBuilderPage
          mealName={mealName} setMealName={setMealName} session={session} country={profileInfo.country}
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
          dailyLog={dailyLog} dayFoodLogs={dayFoodLogs} weekLog={weekLog} setWeekLog={setWeekLog}
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
          const greeting = hour < 5 ? tr("God natt") : hour < 11 ? tr("God morgon") : hour < 17 ? tr("God eftermiddag") : tr("God kväll");
          const dateStr = new Date().toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
          return (
            <div className="fade-up" style={{ paddingBottom: 90 }}>
              {justLogged && (
                <div className="fade-up" style={{ ...glass, borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: C.accent, display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={14} /> {tr("Loggat:")} {justLogged}
                </div>
              )}
              <div style={{ marginBottom: 22 }}>
                <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 2 }}>{greeting}</p>
                <p style={{ fontSize: 12, color: C.textFaint, textTransform: "capitalize" }}>{dateStr}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
                <Ring value={t.kcal} max={targets.kcal} size={184} stroke={12} color={C.ringKcal} trackColor="rgba(255,255,255,0.05)">
                  <span style={{ ...display, fontSize: 32, fontWeight: 700 }}>{Math.round(kcalLeft)}</span>
                  <span style={{ fontSize: 12, color: C.textDim }}>{tr("kcal kvar")}</span>
                </Ring>
                <div style={{ display: "flex", gap: 26, marginTop: 14 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ ...mono, fontSize: 15, fontWeight: 600 }}>{targets.kcal}</div>
                    <div style={{ fontSize: 10.5, color: C.textFaint }}>{tr("Behov")}</div>
                  </div>
                  <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ ...mono, fontSize: 15, fontWeight: 600 }}>{Math.round(t.kcal)}</div>
                    <div style={{ fontSize: 10.5, color: C.textFaint }}>{tr("Ätit")}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 32 }}>
                {[
                  { label: tr("Protein"), value: t.protein_g, max: targets.protein_g, color: C.ringProtein },
                  { label: tr("Kolhydrater"), value: t.carbs_g, max: targets.carbs_g, color: C.ringCarbs },
                  { label: tr("Fett"), value: t.fat_g, max: targets.fat_g, color: C.ringFat },
                ].map((m) => (
                  <div key={m.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Ring value={m.value} max={m.max} size={62} stroke={6} color={m.color} trackColor="rgba(255,255,255,0.05)">
                      <span style={{ ...mono, fontSize: 12.5, fontWeight: 600 }}>{Math.round(m.value)}</span>
                    </Ring>
                    <span style={{ fontSize: 10.5, color: C.textFaint, marginTop: 8 }}>{m.label} · {m.max}{tr("g")}</span>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {tr("Dagens måltider")}
                </p>
                {dailyLog.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: C.textFaint }}>{tr("Inget loggat än idag.")}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dailyLog.map((e, i) => (
                      <LogRow
                        key={e.id || e.tmpId || i} entry={e}
                        onDelete={() => removeLogEntry(todayKey, e)}
                        onScale={(factor, newGrams, newAmount, newUnit) => scaleLogEntry(todayKey, e, factor, newGrams, newAmount, newUnit)}
                      />
                    ))}
                    <p style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{tr("Tryck på en rad för att ändra mängd eller ta bort.")}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* log screen: search, scan, recent foods */}
        {mode === "choose" && (
          <div className="fade-up" style={{ maxWidth: 480, margin: "10px auto" }}>
            <p style={{ ...display, fontSize: 19, fontWeight: 600, marginBottom: 14 }}>{tr("Logga")}</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                autoFocus value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && foodName.trim() && !loading && estimateManual()}
                placeholder={tr("t.ex. \"150 g ris\" eller \"2 kiwi\"")}
                style={{ ...onbInput, flex: 1 }}
              />
              <button onClick={estimateManual} disabled={!foodName.trim() || loading} style={{ ...primaryBtn, opacity: foodName.trim() ? 1 : 0.5 }}>
                {loading ? tr("Söker…") : tr("Sök")}
              </button>
            </div>
            <button onClick={() => { setError(""); setMode("scan"); }} style={{ ...ghostBtn, width: "100%", marginBottom: 20 }}>
              <BarcodeIcon size={16} /> {tr("Skanna streckkod")}
            </button>
            {error && <p style={{ fontSize: 12, color: C.estimate, marginTop: -8, marginBottom: 14 }}>{error}</p>}

            {recentFoods.length > 0 && (
              <>
                <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>{tr("Senaste")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {recentFoods.map((e, i) => (
                    <div key={i} style={{ ...glass, borderRadius: 14, padding: "10px 12px 10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5 }}>{e.name || tr("Måltid")}</div>
                        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>
                          {[formatLogQty(e), `${Math.round(e.kcal || 0)} kcal`].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button onClick={() => relog(e)} style={{ ...primaryBtn, padding: "8px 14px", fontSize: 12.5 }}>
                        <Plus size={14} /> {tr("Logga")}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setError(""); setMode("photo"); }} style={{ ...ghostBtn, flex: 1 }}><Camera size={14} /> {tr("Foto")}</button>
              <button onClick={() => { setError(""); setShow100(true); setMode("manual"); }} style={{ ...ghostBtn, flex: 1 }}>{tr("Egna värden")}</button>
              <button onClick={reset} style={ghostBtn}>{tr("Stäng")}</button>
            </div>
          </div>
        )}

        {/* barcode scanning */}
        {mode === "scan" && (
          <BarcodeScanner onCode={handleScanned} onCancel={() => setMode("choose")} loading={loading} />
        )}

        {/* manual entry */}
        {mode === "manual" && (
          <div className="fade-up" style={{ maxWidth: 420, margin: "20px auto" }}>
            {scanned && foodName.trim() === scanned.name && (
              <div className="fade-up" style={{ ...glass, borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>
                <span style={{ color: C.accent }}>{tr("Skannad produkt:")}</span> {scanned.name}{scanned.brand ? ` (${scanned.brand})` : ""} · {Math.round(scanned.per100.kcal)} {tr("kcal per 100 g.")}
                {scanned.servingGrams ? trf(" En portion är {0} g enligt förpackningen.", scanned.servingGrams) : ""} {tr("Ändra mängden om du åt mer eller mindre.")}
              </div>
            )}
            <label style={{ fontSize: 12.5, color: C.textDim, display: "block", marginBottom: 6 }}>{tr("Matvara")}</label>
            <input
              value={foodName} onChange={(e) => setFoodName(e.target.value)}
              placeholder={tr("t.ex. \"150 g ris\" eller \"2 kiwi\"")}
              style={{
                width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 16, outline: "none",
              }}
            />
            <label style={{ fontSize: 12.5, color: C.textDim, display: "block", marginBottom: 6 }}>{tr("Mängd")}</label>
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
              {tr("T.ex. \"1 kopp grönt te\" — skriv 1 och välj kopp. DOT räknar om till gram åt dig.")}
            </p>
            <button
              onClick={() => setShow100((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                cursor: "pointer", color: C.textDim, fontSize: 12.5, padding: "4px 0", marginBottom: 6,
              }}
            >
              <ChevronDown size={13} style={{ transform: show100 ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
              {tr("Fyll i kända värden per 100g (valfritt)")}
            </button>
            <p style={{ fontSize: 11.5, color: C.textFaint, marginBottom: show100 ? 12 : 22 }}>
              {show100
                ? tr("Precis som på förpackningen — DOT räknar om till din faktiska vikt. Lämna resten tomt, så fylls det i från ett liknande livsmedel du väljer.")
                : tr("Vet du t.ex. protein- eller fettinnehållet per 100g (från förpackningen)? Fyll i det du vet — resten hämtas från ett liknande livsmedel.")}
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
                      <span style={{ ...mono, fontSize: 11, color: C.textFaint, width: 34 }}>{f.unit}{tr("/100g")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="fade-up" style={{ fontSize: 12, color: C.estimate, marginBottom: 14, lineHeight: 1.5 }}>{error}</p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setMode("choose"); setError(""); }} style={ghostBtn}>{tr("Tillbaka")}</button>
              <button
                onClick={estimateManual} disabled={!foodName.trim() || loading}
                style={{ ...primaryBtn, opacity: !foodName.trim() ? 0.5 : 1 }}
              >
                {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {loading ? tr("Räknar ut värden…") : tr("Logga")}
              </button>
            </div>
          </div>
        )}

        {/* pick the right database hit */}
        {mode === "pick" && (
          <div className="fade-up" style={{ maxWidth: 480, margin: "20px auto" }}>
            <p style={{ ...display, fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{ownValuesPick ? tr("Vad liknar din vara mest?") : tr("Vilken menar du?")}</p>
            <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 16, lineHeight: 1.5 }}>
              {ownValuesPick
                ? tr("Dina egna värden används alltid. Det du inte fyllt i — t.ex. mättat fett, vitaminer och mineraler — hämtas från det du väljer och märks som uppskattat.")
                : trf("Träffar för \"{0}\" — värdena är per 100 g. Du loggar {1} {2}.", foodName, weight, UNIT_LABELS[weightUnit])}
            </p>
            {searchNote && <p style={{ fontSize: 12, color: C.estimate, marginTop: -8, marginBottom: 14 }}>{searchNote}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {candidates.map((c) => (
                <CandidateButton key={c.id} c={c} disabled={loading} onPick={() => finishManual(c)} />
              ))}
            </div>
            {loading && <p style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>{tr("Räknar ut…")}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMode("manual")} style={ghostBtn}>{tr("Tillbaka")}</button>
              <button onClick={() => finishManual(null)} disabled={loading} style={{ ...ghostBtn, flex: 1 }}>
                {ownValuesPick ? tr("Hoppa över — använd bara mina värden") : tr("Inget av dessa — fyll i själv")}
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
                <img src={photoData.preview} alt={tr("förhandsvisning")} style={{ maxHeight: 160, borderRadius: 8 }} />
              ) : (
                <>
                  <Camera size={22} color={C.textDim} />
                  <span style={{ fontSize: 13, color: C.textDim }}>{tr("Ta eller välj en bild")}</span>
                </>
              )}
            </label>
            <input id="photo-input" type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <label style={{ fontSize: 12.5, color: C.textDim, display: "block", marginBottom: 6 }}>
              {tr("Beskrivning (valfritt)")}
            </label>
            <textarea
              value={photoDesc} onChange={(e) => setPhotoDesc(e.target.value)}
              placeholder={tr("t.ex. kycklingwrap med lite majonnäs, ingen ost")}
              rows={3}
              style={{
                width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "10px 12px", color: C.text, fontSize: 13.5, marginBottom: 22, outline: "none", resize: "vertical",
              }}
            />
            {error && (
              <p className="fade-up" style={{ fontSize: 12, color: C.estimate, marginBottom: 14, lineHeight: 1.5 }}>{error}</p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setMode("choose"); setError(""); }} style={ghostBtn}>{tr("Tillbaka")}</button>
              <button
                onClick={estimatePhoto} disabled={!photoData || loading}
                style={{ ...primaryBtn, opacity: !photoData ? 0.5 : 1 }}
              >
                {loading ? tr("Analyserar bild…") : tr("Analysera bild")}
              </button>
            </div>
          </div>
        )}

        {/* photo result: det AI såg på bilden, med värden från databasen */}
        {mode === "photo-result" && (
          <div className="fade-up" style={{ maxWidth: 480, margin: "20px auto" }}>
            <p style={{ ...display, fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{tr("Det här såg jag på bilden")}</p>
            <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 16, lineHeight: 1.5 }}>
              {tr("Vikterna är uppskattade från bilden. Värdena kommer från livsmedelsdatabasen. Ta bort det som inte stämmer — mängderna kan du ändra efter loggningen genom att trycka på raden.")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {photoItems.map((it) => (
                <div key={it.key} style={{ ...glass, borderRadius: 14, padding: "10px 12px 10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5 }}>{it.name} <span style={{ color: C.textFaint, fontSize: 11.5 }}>{tr("· ca")} {it.grams} {tr("g")}</span></div>
                    <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 2 }}>
                      {tr("Träff:")} {it.res.matchedName}
                      {it.res.uncooked && <span style={{ color: C.estimate }}> {tr("· okokt vikt")}</span>}
                    </div>
                  </div>
                  <span style={{ ...mono, fontSize: 12.5, color: C.accent, flexShrink: 0 }}>{Math.round(it.res.kcal)} {tr("kcal")}</span>
                  <button onClick={() => setPhotoItems((list) => list.filter((x) => x.key !== it.key))} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <X size={14} color={C.textFaint} />
                  </button>
                </div>
              ))}
            </div>
            {photoMissing.length > 0 && (
              <p style={{ fontSize: 11.5, color: C.estimate, marginBottom: 12 }}>
                {tr("Hittades inte i databasen och räknas inte med:")} {photoMissing.join(", ")}{tr(". Logga dem gärna separat.")}
              </p>
            )}
            <div style={{ ...glass, borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: C.textDim }}>{tr("Totalt")}</span>
              <span style={{ ...mono, fontSize: 13, fontWeight: 600 }}>
                {Math.round(photoItems.reduce((s, it) => s + (it.res.kcal || 0), 0))} {tr("kcal ·")} {Math.round(photoItems.reduce((s, it) => s + (it.res.protein_g || 0), 0))}{tr("g protein")}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setMode("photo"); setError(""); }} style={ghostBtn}>{tr("Tillbaka")}</button>
              <button onClick={logPhotoItems} disabled={confirmed || photoItems.length === 0} style={{ ...primaryBtn, flex: 1, opacity: photoItems.length ? 1 : 0.5 }}>
                <Check size={15} /> {tr("Logga allt")}
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
                  <div style={{ ...display, fontSize: 19, fontWeight: 600 }}>{foodName || tr("Måltid")}</div>
                  {weight && <div style={{ ...mono, fontSize: 12.5, color: C.textFaint }}>{weight} {UNIT_LABELS[weightUnit]}</div>}
                  {result.source && (
                    <div style={{ fontSize: 10.5, color: C.accent, marginTop: 3 }}>
                      {tr("Källa:")} {tr(result.source)}{result.matchedName ? trf(" · Träff: \"{0}\"", result.matchedName) : ""}
                    </div>
                  )}
                  {(result.matchedName || candidates.length > 1) && (
                    <button
                      onClick={switchHit} disabled={loading}
                      style={{ background: "none", border: "none", color: C.accent, fontSize: 11.5, cursor: "pointer", padding: 0, marginTop: 6, textDecoration: "underline" }}
                    >
                      {loading ? tr("Söker…") : tr("Byt träff")}
                    </button>
                  )}
                </div>
                <div style={{ ...mono, fontSize: 22, fontWeight: 600, color: C.accent }}>
                  {Math.round(result.kcal)} <span style={{ fontSize: 12, color: C.textFaint }}>{tr("kcal")}</span>
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: C.estimate, marginTop: 8, marginBottom: 4 }}>{error}</p>
              )}
              {result.uncooked && (
                <div className="fade-up" style={{ background: C.estimateDim, border: `1px solid ${C.estimate}55`, borderRadius: 10, padding: "9px 12px", marginTop: 10, fontSize: 12, color: C.estimate, lineHeight: 1.5 }}>
                  {tr("Obs: värdena gäller")} <b>{tr("okokt (torr) vikt")}</b>{tr(". Vägde du maten kokt blir det för mycket — tryck")} <b>{tr("Byt träff")}</b> {tr("och välj en kokt variant.")}
                </div>
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
                {tr("Vitaminer, mineraler och bra ämnen läggs till din dagliga översikt när du loggar — se fliken")} <b>{tr("Översikt")}</b> {tr("för hela bilden.")}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => {
                    if (confirmed) return;
                    setConfirmed(true);
                    addLogEntry({
                      name: foodName, ...result, grams: result.estimatedGrams ?? null,
                      amount: displayQty ? displayQty.amount : Number(weight) || null,
                      unit: displayQty ? displayQty.unit : weightUnit,
                    });
                  }}
                  disabled={confirmed}
                  style={{ ...primaryBtn, width: "100%", opacity: confirmed ? 0.6 : 1 }}
                >
                  <Check size={15} /> {confirmed ? tr("Loggat") : tr("Bekräfta & logga")}
                </button>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setChatOpen((v) => !v)} style={{ ...ghostBtn, flex: 1 }}>
                    <Sparkles size={14} color={C.accent} /> {tr("Fråga AI")}
                  </button>
                  <button onClick={reset} style={{ ...ghostBtn, flex: 1 }}>
                    <Home size={14} /> {tr("Tillbaka hem")}
                  </button>
                </div>
              </div>
              {confirmed && (
                <p className="fade-up" style={{ fontSize: 12.5, color: C.textDim, marginTop: 10 }}>
                  {tr("Sparat till din dagslogg.")}
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
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{tr("Fråga om värdena")}</span>
                  <button onClick={() => setChatOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
                    <X size={14} color={C.textFaint} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {chatMsgs.length === 0 && (
                    <p style={{ fontSize: 12, color: C.textFaint }}>
                      {tr("T.ex. \"varför gissar du så mycket protein?\" eller \"är det här en stor banan?\"")}
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
                    placeholder={tr("Skriv en fråga…")}
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
      <style>{tr("@keyframes spin { to { transform: rotate(360deg) } }")}</style>
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
            <Plus size={17} /> {tr("Logga")}
          </button>
        )}

        {!isOnboarding && (
          <div style={{
            display: "flex", justifyContent: "space-around", alignItems: "center",
            padding: "10px 8px calc(10px + env(safe-area-inset-bottom, 0px))",
            borderTop: `1px solid rgba(255,255,255,0.06)`, background: "#0A100C",
          }}>
            {[
              { key: "history", label: tr("Kalender"), icon: CalendarDays },
              { key: "progress", label: tr("Progress"), icon: TrendingUp },
              { key: "log", label: tr("Hem"), icon: Home },
              { key: "dashboard", label: tr("Översikt"), icon: LayoutGrid },
              { key: "meals", label: tr("Måltider"), icon: BookOpen },
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
  { v: "stillasittande", l: tr("Stillasittande"), sub: tr("Kontorsjobb, mest still, ingen eller sällan träning") },
  { v: "lätt", l: tr("Lätt aktiv"), sub: tr("Går/rör dig lite dagligen, tränar lätt 1–3 ggr/vecka") },
  { v: "moderat", l: tr("Måttligt aktiv"), sub: tr("Tränar 3–5 ggr/vecka, en del rörelse i vardagen") },
  { v: "aktiv", l: tr("Aktiv"), sub: tr("Tränar hårt 6–7 ggr/vecka, eller fysiskt jobb + viss träning") },
  { v: "mycket aktiv", l: tr("Mycket aktiv"), sub: tr("Fysiskt tungt jobb och hård träning, dagligen") },
];

const GOALS = [
  { v: "gå ner i vikt", l: tr("Gå ner i vikt") },
  { v: "gå upp i vikt", l: tr("Gå upp i vikt") },
  { v: "bibehålla", l: tr("Bibehålla vikt") },
  { v: "bygga muskler", l: tr("Bygga muskler") },
  { v: "må bättre", l: tr("Må bättre allmänt") },
  { v: "fixa min hälsa", l: tr("Fixa min hälsa") },
  { v: "äta mer varierat", l: tr("Äta mer varierat") },
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

// D●T — O:et är en punkt
function DotLogo({ size = 20 }) {
  const dot = Math.round(size * 0.66);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: Math.max(2, Math.round(size * 0.06)),
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: size, lineHeight: 1, color: C.text, letterSpacing: "0.02em",
    }}>
      {tr("D")}
      <span style={{
        width: dot, height: dot, borderRadius: 999, display: "inline-block",
        background: "linear-gradient(135deg, #F2C063, #8FD9A8)", boxShadow: "0 0 12px rgba(143,217,168,.5)",
      }} />
      {tr("T")}
    </span>
  );
}

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
  const keys = new Set(defs.map((d) => d.key));
  const measured = (k) => dailyLog.some((e) => (e.microAmounts || {})[k] !== undefined);
  // klorid kommer nästan bara från salt (NaCl): klorid ≈ natrium × 1,54
  if (keys.has("chloride") && !measured("chloride")) {
    totals.chloride = dailyLog.reduce((s, e) => s + (Number((e.microAmounts || {}).sodium) || 0) * 1.54, 0);
  }
  // svavel kommer från proteinets aminosyror: ca 10 mg per gram protein
  if (keys.has("sulfur") && !measured("sulfur")) {
    totals.sulfur = dailyLog.reduce((s, e) => s + (Number(e.protein_g) || 0) * 10, 0);
  }
  return totals;
}

// finns det något att visa för det här ämnet? (uppmätt, eller uträknat från natrium/protein)
function microHasData(log, key) {
  if (key === "chloride") return log.some((e) => { const m = e.microAmounts || {}; return m.chloride !== undefined || m.sodium !== undefined; });
  if (key === "sulfur") return log.some((e) => Number(e.protein_g) > 0 || (e.microAmounts || {}).sulfur !== undefined);
  return log.some((e) => (e.microAmounts || {})[key] !== undefined);
}

// "bra ämnen" som finns uppmätta i databaserna — visas när dagens mängd är värd att nämna
const BONUS_DEFS = [
  { key: "omega3", name: tr("Omega-3"), unit: "mg", min: 100, reason: tr("Fleromättat fett som är viktigt för hjärta och hjärna.") },
  { key: "epa_dha", name: tr("varav EPA + DHA"), unit: "mg", min: 50, reason: tr("Den form av omega-3 som främst finns i fisk och skaldjur.") },
  { key: "beta_carotene", name: tr("Betakaroten"), unit: "µg", min: 300, reason: tr("Antioxidant som kroppen omvandlar till A-vitamin.") },
  { key: "lycopene", name: tr("Lykopen"), unit: "µg", min: 500, reason: tr("Antioxidant som ger tomater och vattenmelon sin röda färg.") },
  { key: "lutein", name: tr("Lutein & zeaxantin"), unit: "µg", min: 300, reason: tr("Antioxidanter som samlas i ögat och hjälper till att skydda synen.") },
  { key: "wholegrain", name: tr("Fullkorn"), unit: "g", min: 5, reason: tr("Ger fibrer och långsamma kolhydrater som håller dig mätt längre.") },
];
// nyttiga ämnen som INTE finns uppmätta i våra databaser.
// För de flesta anges en ungefärlig typisk halt per 100 g (från forskningsdata, t.ex. USDA:s flavonoiddatabas och
// Phenol-Explorer). Den räknas om efter mängden du loggat och jämförs med en referensmängd → nivå + "ca X mg".
// För några (probiotika, capsaicin) finns inget meningsfullt mått, där visas bara en fast nivå.
const LEVEL_LABELS = { 1: tr("Mycket låg"), 2: tr("Låg"), 3: tr("Medel"), 4: tr("Hög"), 5: tr("Mycket hög") };
function levelFromRatio(r) {
  if (r >= 1) return 5;
  if (r >= 0.6) return 4;
  if (r >= 0.3) return 3;
  if (r >= 0.1) return 2;
  return 1;
}
const COMPOUNDS = [
  { name: "Katekiner", unit: "mg", ref: 300, reason: "Antioxidanterna i te och kakao. Kan stödja hjärta och blodkärl.",
    foods: [[["matcha"], 6000], [["kakao", "cocoa"], 200], [["grönt te", "grön te", "green tea", "tea, green"], 80],
            [["mörk choklad", "dark chocolate", "chocolate, dark"], 50], [["vitt te", "white tea"], 60],
            [["svart te", "black tea", "tea, black"], 15], [["äpple", "apple"], 10]] },
  { name: "L-teanin", unit: "mg", ref: 100, reason: "Aminosyra i te som ger ett lugnt fokus och kan mildra koffeinets påslag. Effekter ses oftast vid 100–200 mg.",
    foods: [[["matcha"], 2000], [["grönt te", "grön te", "green tea", "tea, green"], 8], [["vitt te", "white tea"], 10],
            [["svart te", "black tea", "tea, black", "oolong"], 7]] },
  { name: "Koffein", unit: "mg", ref: 200, reason: "Pigger upp och skärper fokus. Lagom för de flesta är ungefär 100–200 mg om dagen, helst före lunch — redan runt 100 mg senare på dagen kan försämra sömnen.",
    foods: [[["espresso"], 212], [["kaffe", "coffee"], 40], [["energidryck", "energy drink"], 32], [["matcha"], 3200],
            [["svart te", "black tea", "tea, black"], 20], [["grönt te", "grön te", "green tea", "tea, green"], 12],
            [["cola"], 10], [["mörk choklad", "dark chocolate", "chocolate, dark"], 80], [["kakao", "cocoa"], 230]] },
  { name: "Klorogensyra", unit: "mg", ref: 200, reason: "Polyfenol med antioxiderande effekt — kaffe är den största källan.",
    foods: [[["kaffe", "coffee", "espresso"], 70], [["aubergine", "eggplant"], 20], [["blåbär", "blueberr"], 10],
            [["päron", "pear"], 10], [["äpple", "apple"], 10]] },
  { name: "Teobromin", unit: "mg", ref: 250, reason: "Milt uppiggande ämne i kakao, mildare och mer långvarigt än koffein.",
    foods: [[["kakao", "cocoa"], 2000], [["mörk choklad", "dark chocolate", "chocolate, dark"], 800],
            [["mjölkchoklad", "milk chocolate"], 150]] },
  { name: "Antocyaniner", unit: "mg", ref: 150, reason: "Färgämnen i blå och röda bär och grönsaker som fungerar som antioxidanter.",
    foods: [[["aronia", "chokeberr"], 1400], [["blåbär", "bilberr"], 400], [["blueberr"], 160], [["björnbär", "blackberr"], 100],
            [["svarta vinbär", "blackcurrant", "currants, european black"], 450], [["rödkål", "red cabbage", "cabbage, red"], 110],
            [["körsbär", "cherr"], 80], [["hallon", "raspberr"], 40], [["lingon", "lingonberr"], 50],
            [["jordgubb", "strawberr"], 20], [["röda vindruvor", "red grapes"], 30]] },
  { name: "Ellagitanniner", unit: "mg", ref: 100, reason: "Polyfenoler i bär och nötter som tarmfloran omvandlar till nyttiga ämnen.",
    foods: [[["granatäpple", "pomegranate"], 100], [["valnöt", "walnut"], 60], [["hallon", "raspberr"], 60],
            [["björnbär", "blackberr"], 50], [["jordgubb", "strawberr"], 30]] },
  { name: "Sulforafan", unit: "mg", ref: 20, reason: "Bildas när man tuggar korsblommiga grönsaker och stöttar kroppens egna skyddssystem.",
    foods: [[["broccoligroddar", "broccoli sprouts"], 50], [["broccoli"], 5], [["grönkål", "kale"], 2],
            [["brysselkål", "brussels sprouts"], 2], [["blomkål", "cauliflower"], 1], [["vitkål"], 1]] },
  { name: "Allicin", unit: "mg", ref: 10, reason: "Svavelförening i vitlök som bildas när den hackas eller krossas.",
    foods: [[["vitlök", "garlic"], 400]] },
  { name: "Kvercetin", unit: "mg", ref: 30, reason: "Flavonoid med antioxiderande egenskaper, finns rikligt i lök.",
    foods: [[["kapris", "capers"], 230], [["rödlök", "red onion", "onions, red"], 30], [["gul lök", "onion"], 20],
            [["grönkål", "kale"], 20], [["äpple", "apple"], 4], [["broccoli"], 3]] },
  { name: "Kurkumin", unit: "mg", ref: 100, reason: "Det gula ämnet i gurkmeja. Tas upp bättre tillsammans med svartpeppar och fett.",
    foods: [[["gurkmeja", "turmeric"], 3000], [["curry"], 100]] },
  { name: "Betaglukan", unit: "g", ref: 3, reason: "Löslig fiber i havre och korn. Runt 3 g om dagen kan bidra till lägre kolesterol.",
    foods: [[["havre", "oat"], 4], [["korngryn", "pärlgryn", "barley"], 5]] },
  { name: "Kostnitrat", unit: "mg", ref: 300, reason: "Omvandlas i kroppen till kväveoxid, som vidgar blodkärlen.",
    foods: [[["ruccola", "rucola", "arugula", "rocket"], 480], [["rödbet", "beetroot", "beets"], 250],
            [["spenat", "spinach"], 250], [["selleri", "celery"], 150]] },
  { name: "Olivpolyfenoler", unit: "mg", ref: 10, reason: "Antioxidanter i olivolja, främst i extra jungfruolja.",
    foods: [[["extra virgin", "extra jungfru"], 50], [["olivolja", "olive oil", "oil, olive"], 10], [["oliver", "olives"], 100]] },
  { name: "Hesperidin", unit: "mg", ref: 150, reason: "Flavonoid i citrusfrukter som kan stödja blodkärlen.",
    foods: [[["apelsin", "orange"], 40], [["mandarin", "clementin", "tangerine"], 30],
            [["citron", "lemon"], 20], [["lime"], 15], [["grapefrukt", "grapefruit"], 3]] },
  { name: "Gingerol", unit: "mg", ref: 50, reason: "Det starka ämnet i ingefära, kan lindra illamående.",
    foods: [[["ingefära", "ginger"], 250]] },
  { name: "Lignaner", unit: "mg", ref: 50, reason: "Växtämnen i fröer och fullkorn med antioxiderande egenskaper.",
    foods: [[["linfrö", "flaxseed", "flax seed"], 300], [["sesam", "sesame"], 40], [["råg", "rye"], 3]] },
  { name: "Isoflavoner", unit: "mg", ref: 50, reason: "Växtämnen i soja som kan stödja hjärta och benhälsa.",
    foods: [[["tempeh"], 60], [["sojabön", "soybean"], 55], [["tofu"], 25], [["edamame"], 20], [["soja", "soy"], 10]] },
  { name: "Ergotionein", unit: "mg", ref: 5, reason: "Antioxidant som främst finns i svamp.",
    foods: [[["ostronskivling", "oyster mushroom"], 13], [["shiitake"], 5], [["champinjon", "mushroom"], 1], [["svamp"], 2]] },
  { name: "Astaxantin", unit: "mg", ref: 4, reason: "Rött färgämne i lax och skaldjur med stark antioxiderande effekt. Vildfångad lax har mycket mer än odlad.",
    foods: [[["vild lax", "wild salmon", "salmon, sockeye"], 3], [["lax", "salmon"], 0.6], [["röding", "char"], 0.5],
            [["räkor", "räka", "shrimp"], 0.5], [["kräft", "crayfish"], 1]] },
  { name: "Kreatin", unit: "mg", ref: 2000, reason: "Ger musklerna snabb energi vid korta, intensiva ansträngningar. Finns i kött och fisk.",
    foods: [[["sill", "strömming", "herring"], 800], [["nötfärs", "köttfärs", "nötkött", "biff", "entrecote", "oxfilé", "beef"], 450],
            [["lax", "salmon"], 450], [["tonfisk", "tuna"], 400], [["fläsk", "pork"], 400], [["lamm", "lamb"], 400],
            [["kyckling", "chicken"], 350], [["kalkon", "turkey"], 350]] },
  // fasta nivåer — inget meningsfullt mått i mg
  { name: "Probiotika", fixed: true, reason: "Levande mjölksyrabakterier som kan stödja tarmfloran.",
    foods: [[["kefir"], 5], [["filmjölk"], 4], [["kimchi"], 4], [["surkål", "sauerkraut"], 3],
            [["kombucha"], 3], [["yoghurt", "yogurt"], 3]] },
  { name: "Capsaicin", fixed: true, reason: "Det starka ämnet i chili.",
    foods: [[["cayenne"], 5], [["habanero"], 5], [["chili"], 4], [["jalapeño", "jalapeno"], 3]] },
];

// ordet måste börja ett ord i namnet: "havre" hittar "havregryn", men "oat" hittar inte "goat" och "apple" inte "pineapple"
function startsWord(text, word) {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-zåäöéü])${esc}`).test(text);
}

// vilka av ämnena ovan ett livsmedel innehåller, utifrån dess namn
function compoundsFor(texts, grams) {
  const t = (Array.isArray(texts) ? texts : [texts]).filter(Boolean).join(" | ").toLowerCase();
  if (!t) return [];
  const g = Number(grams) > 0 ? Number(grams) : 100; // äldre loggar utan vikt räknas som 100 g
  const out = [];
  COMPOUNDS.forEach((c) => {
    let best = 0;
    c.foods.forEach(([words, v]) => { if (v > best && words.some((w) => startsWord(t, w))) best = v; });
    if (!best) return;
    if (c.fixed) out.push({ name: c.name, level: best, reason: c.reason, fixed: true });
    else out.push({ name: c.name, qty: (best * g) / 100, unit: c.unit, reason: c.reason });
  });
  return out;
}

function formatQty(v, unit) {
  const n = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${tr("ca")} ${n.toLocaleString(LOCALE)} ${unit}`;
}

function formatBonusAmount(v, unit) {
  const n = v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
  return `${n.toLocaleString(LOCALE)} ${unit}`;
}

function sumBonus(dailyLog) {
  const fromDb = [];
  BONUS_DEFS.forEach((d) => {
    const total = dailyLog.reduce((s, e) => s + (Number((e.microAmounts || {})[d.key]) || 0), 0);
    if (total >= d.min) fromDb.push({ name: d.name, amount: formatBonusAmount(total, d.unit), reason: d.reason });
  });
  const totals = {};
  dailyLog.forEach((entry) => {
    const found = [
      ...compoundsFor([entry.name, entry.matchedName], entry.grams).map((b) => ({ ...b, from: entry.name })),
      ...(entry.bonus || []),
    ];
    found.forEach((b) => {
      if (!b.name) return;
      const cur = totals[b.name] || (totals[b.name] = { name: b.name, reason: b.reason, qty: 0, level: 0, amount: null, from: new Set() });
      if (b.from) cur.from.add(b.from);
      if (typeof b.qty === "number") { cur.qty += b.qty; cur.unit = b.unit; }
      else if (b.level) cur.level = Math.max(cur.level, b.level);
      else if (b.amount && !cur.amount) cur.amount = b.amount; // t.ex. från AI senare
      if (b.reason && !cur.reason) cur.reason = b.reason;
    });
  });
  const qualitative = Object.values(totals).map((b) => {
    const def = COMPOUNDS.find((c) => c.name === b.name);
    let amount = b.amount;
    let level = b.level;
    if (b.qty > 0 && def && def.ref) {
      level = levelFromRatio(b.qty / def.ref);
      amount = `${LEVEL_LABELS[level]} · ${formatQty(b.qty, b.unit || def.unit)}`;
    } else if (level) {
      amount = LEVEL_LABELS[level];
    }
    const reason = tr(def ? def.reason : b.reason);
    return {
      name: tr(b.name), amount, level,
      reason: b.from.size ? `${reason || ""} ${tr("Finns i:")} ${[...b.from].join(", ")}.`.trim() : reason,
    };
  });
  const dbNames = new Set(fromDb.map((b) => b.name.toLowerCase()));
  return [...fromDb, ...qualitative.filter((b) => !dbNames.has(b.name.toLowerCase()))];
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

function MicroRow({ def, amount, color, colorDim, open, onToggle, noData }) {
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
            aria-label={trf("Om {0}", def.name)}
          >
            {tr("i")}
          </button>
        </div>
        <span style={{ ...mono, fontSize: 11.5, color: noData ? C.textFaint : C.textDim }}>
          {noData ? tr("ingen data") : `${Math.round(amount * 10) / 10}${def.unit} · ${pct}%`}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: colorDim, overflow: "hidden" }}>
        <div style={{ width: `${barPct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s ease" }} />
      </div>
      {open && (
        <p className="fade-up" style={{ fontSize: 11.5, color: C.textDim, marginTop: 6, marginBottom: 0, paddingLeft: 2 }}>
          {def.blurb}
          {noData && tr(" Det här ämnet finns inte uppmätt för det du loggat idag, så vi kan inte visa någon mängd — det betyder inte att du får för lite.")}
        </p>
      )}
    </div>
  );
}

const DAY_LABELS = [tr("Mån"), tr("Tis"), tr("Ons"), tr("Tors"), tr("Fre"), tr("Lör"), tr("Sön")];

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
  const [view, setView] = useState("menu"); // menu | profile | units | language | privacy | help | about
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  // ---------- profile ----------
  if (view === "profile") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title={tr("Profil")} onBack={() => setView("menu")} />
        <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={onbLabel}>{tr("Ålder")}</label>
              <input value={profileInfo.age} inputMode="numeric"
                onChange={(e) => setProfileInfo((p) => ({ ...p, age: e.target.value.replace(/[^0-9]/g, "") }))}
                style={onbInput} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={onbLabel}>{tr("Längd (")}{units.height === "ft" ? tr("tum") : tr("cm")})</label>
              <input value={displayHeight(profileInfo.height, units.height)} inputMode="numeric"
                onChange={(e) => setProfileInfo((p) => ({ ...p, height: parseHeightInput(e.target.value.replace(/[^0-9]/g, ""), units.height) }))}
                style={onbInput} />
            </div>
          </div>
          <label style={onbLabel}>{tr("Vikt (")}{units.weight === "lbs" ? tr("lbs") : tr("kg")})</label>
          <input value={displayWeight(profileInfo.weight, units.weight)} inputMode="decimal"
            onChange={(e) => setProfileInfo((p) => ({ ...p, weight: parseWeightInput(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""), units.weight) }))}
            style={{ ...onbInput, marginBottom: 4 }} />

          <label style={onbLabel}>{tr("Land")}</label>
          <ChipGroup options={COUNTRIES} value={profileInfo.country}
            onChange={(v) => setProfileInfo((p) => ({ ...p, country: v }))} />

          <label style={onbLabel}>{tr("Kön")}</label>
          <ChipGroup
            options={[{ v: "kvinna", l: tr("Kvinna") }, { v: "man", l: tr("Man") }]}
            value={profileInfo.sex} onChange={(v) => setProfileInfo((p) => ({ ...p, sex: v }))}
          />

          <label style={onbLabel}>{tr("Aktivitetsnivå")}</label>
          <ChipGroup options={ACTIVITY_LEVELS} value={profileInfo.activity}
            onChange={(v) => setProfileInfo((p) => ({ ...p, activity: v }))} stack />

          <label style={onbLabel}>{tr("Mål (välj gärna flera)")}</label>
          <ChipGroup
            options={GOALS} value={profileInfo.goal} multi
            onChange={(v) => setProfileInfo((p) => ({
              ...p, goal: p.goal.includes(v) ? p.goal.filter((g) => g !== v) : [...p.goal, v],
            }))}
            stack wrapStyle={{ marginBottom: 4 }}
          />
        </div>
        <button onClick={handleSave} style={{ ...primaryBtn, width: "100%" }}>
          <Check size={15} /> {tr("Spara ändringar")}
        </button>
        {saved && (
          <p className="fade-up" style={{ fontSize: 12, color: C.accent, textAlign: "center", marginTop: 10 }}>
            {tr("Sparat — dina mål är omräknade.")}
          </p>
        )}
      </div>
    );
  }

  // ---------- language ----------
  if (view === "language") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title="Språk / Language" onBack={() => setView("menu")} />
        <ChipGroup options={[{ v: "sv", l: "Svenska" }, { v: "en", l: "English" }]} value={LANG}
          onChange={(v) => { if (v !== LANG) setLanguage(v); }} />
        <p style={{ fontSize: 11, color: C.textFaint, marginTop: 16 }}>
          {tr("Appen laddas om på det valda språket. Livsmedelsnamnen visas på engelska när det finns en översättning.")}
        </p>
      </div>
    );
  }

  // ---------- units ----------
  if (view === "units") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title={tr("Enheter")} onBack={() => setView("menu")} />
        <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{tr("Vikt")}</p>
        <ChipGroup options={[{ v: "kg", l: tr("Kilogram (kg)") }, { v: "lbs", l: tr("Pund (lbs)") }]} value={units.weight}
          onChange={(v) => setUnits((u) => ({ ...u, weight: v }))} />
        <p style={{ fontSize: 12, color: C.textFaint, margin: "14px 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{tr("Längd")}</p>
        <ChipGroup options={[{ v: "cm", l: tr("Centimeter (cm)") }, { v: "ft", l: tr("Fot/tum (ft/in)") }]} value={units.height}
          onChange={(v) => setUnits((u) => ({ ...u, height: v }))} />
        <p style={{ fontSize: 11, color: C.textFaint, marginTop: 16 }}>
          {tr("Ändringen gäller direkt — vikt och längd visas och räknas om i din valda enhet överallt i appen (sparas alltid i kg/cm internt).")}
        </p>
      </div>
    );
  }

  // ---------- privacy ----------
  if (view === "privacy") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title={tr("Dataskydd")} onBack={() => setView("menu")} />
        <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6, marginBottom: 10 }}>
            {tr("Din data (loggar, vikt, måltider och progressbilder) sparas på ditt konto och säljs eller delas aldrig för reklam.")}
          </p>
          <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6, marginBottom: 10 }}>
            {tr("När du loggar med fri text eller foto skickas texten eller bilden till vår AI-leverantör (Anthropic) för att tolkas — vad du åt och ungefär hur mycket. Näringsvärdena kommer alltid från livsmedelsdatabaserna, aldrig från AI:n.")}
          </p>
          <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>
            {tr("Du kan när som helst radera ditt konto under Inställningar — då raderas all din data permanent.")}
          </p>
        </div>
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer"
          style={{ ...ghostBtn, width: "100%", justifyContent: "flex-start", padding: "13px 16px", textDecoration: "none", boxSizing: "border-box" }}>
          {tr("Läs hela integritetspolicyn")}
        </a>
      </div>
    );
  }

  // ---------- help ----------
  if (view === "help") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title={tr("Hjälp & support")} onBack={() => setView("menu")} />
        <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <p style={{ fontSize: 13, color: C.textDim, marginBottom: 14, lineHeight: 1.6 }}>
            {tr("Stötte du på ett problem, eller har du en idé till en ny funktion? Hör av dig.")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.accent }}>
            <Mail size={14} /> {tr("Kontaktadress kommer snart")}
          </div>
        </div>
      </div>
    );
  }

  // ---------- about ----------
  if (view === "about") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
        <SettingsSubHeader title={tr("Om DOT")} onBack={() => setView("menu")} />
        <div style={{ textAlign: "center", padding: "30px 0" }}>
<div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><DotLogo size={34} /></div>
          <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 4 }}>{tr("Version 0.1 (prototyp)")}</p>
          <p style={{ ...display, fontSize: 14, color: C.text, marginTop: 14 }}>{tr("Discipline Over Time.")}</p>
          <p style={{ fontSize: 12.5, color: C.textDim, marginTop: 14, maxWidth: 320, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            {tr("DOT står för disciplin och tålamod — de två saker som krävs för att lyckas, i livet och med kosten. Små val varje dag, under lång tid.")}
          </p>
          <p style={{ fontSize: 11, color: C.textFaint, marginTop: 24, maxWidth: 320, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            {tr("Näringsdata: Livsmedelsverkets livsmedelsdatabas (Livsmedelsverket, CC BY 4.0), USDA FoodData Central och Open Food Facts (ODbL).")}
          </p>
        </div>
      </div>
    );
  }

  // ---------- main menu ----------
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 40px" }}>
      <SettingsSubHeader title={tr("Inställningar")} onBack={onBack} />

      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{tr("Konto")}</p>
      <SettingsRow icon={User} label={tr("Profil")} sub={tr("Ålder, vikt, mål och aktivitetsnivå")} onClick={() => setView("profile")} />

      <p style={{ fontSize: 12, color: C.textFaint, margin: "22px 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{tr("Preferenser")}</p>
      <SettingsRow icon={Globe} label="Språk / Language" sub={LANG === "sv" ? "Svenska" : "English"} onClick={() => setView("language")} />
      <SettingsRow icon={Ruler} label={tr("Enheter")} sub={`${units.weight} · ${units.height}`} onClick={() => setView("units")} />

      <p style={{ fontSize: 12, color: C.textFaint, margin: "22px 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{tr("Data & support")}</p>
      <SettingsRow icon={ShieldCheck} label={tr("Dataskydd")} onClick={() => setView("privacy")} />
      <SettingsRow icon={HelpCircle} label={tr("Hjälp & support")} onClick={() => setView("help")} />
      <SettingsRow icon={Info} label={tr("Om DOT")} sub={tr("Version 0.1")} onClick={() => setView("about")} />

      <p style={{ fontSize: 12, color: C.textFaint, margin: "22px 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>&nbsp;</p>
      <SettingsRow icon={LogOut} label={tr("Logga ut")} onClick={onLogout} />

      {!confirmDelete && (
        <SettingsRow icon={Trash2} label={tr("Radera konto")} danger onClick={() => setConfirmDelete(true)} />
      )}
      {confirmDelete && (
        <div className="fade-up" style={{ ...glass, borderRadius: 14, padding: 16, marginTop: 12 }}>
          <p style={{ fontSize: 13, marginBottom: 12 }}>
            {tr("Är du säker? All din data (loggar, måltider, vikt, bilder) raderas permanent.")}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirmDelete(false)} style={{ ...ghostBtn, flex: 1 }}>{tr("Avbryt")}</button>
            <button onClick={onDeleteAccount} style={{ ...primaryBtn, flex: 1, background: "#E08F8F", boxShadow: "none", color: "#2a0f0f" }}>
              {tr("Ja, radera")}
            </button>
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 11, color: C.textFaint, marginTop: 26 }}>
        {tr("DOT · prototyp v0.1")}
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
    const withData = defs.filter((d) => microHasData(entries, d.key));
    if (!withData.length) return 0;
    const pcts = withData.map((d) => Math.min(((tot[d.key] || 0) / d.rdi) * 100, 100));
    return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
  };

  const monthLabel = viewMonth.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
  const isCurrentMonth = viewMonth.getMonth() === new Date().getMonth() && viewMonth.getFullYear() === new Date().getFullYear();

  function changeMonth(delta) {
    setViewMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + delta); return d; });
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 0" }}>
      <p style={{ ...display, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{tr("Kalender")}</p>
      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 18 }}>{tr("Titta tillbaka på vilken dag som helst — bläddra hur långt bak du vill.")}</p>

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
          {tr("Inget loggat den här dagen.")}
        </p>
      )}

      {(entries.length > 0 || dayInfo.weight || dayInfo.photo) && (
        <>
          <div style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <MiniStat label={tr("Kalorier")} value={Math.round(totals.kcal)} unit="kcal" color={C.accent} />
              <MiniStat label={tr("Vitaminer")} value={entries.length ? avgPct(VITAMINS, vitaminTotals) : 0} unit="%" color={C.vitamin} />
              <MiniStat label={tr("Mineraler")} value={entries.length ? avgPct(MINERALS, mineralTotals) : 0} unit="%" color={C.mineral} />
            </div>
          </div>

          {dayInfo.weight && (
            <div style={{ ...glass, borderRadius: 16, padding: "14px 18px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13 }}>{tr("Vikt")}</span>
              <span style={{ ...mono, fontSize: 13, color: C.text }}>{displayWeight(dayInfo.weight, units.weight)} {units.weight === "lbs" ? tr("lbs") : tr("kg")}</span>
            </div>
          )}

          {dayInfo.photo && (
            <div style={{ ...glass, borderRadius: 16, padding: 12, marginBottom: 14, display: "flex", justifyContent: "center" }}>
              <img src={dayInfo.photo} alt={tr("progressbild")} style={{ maxHeight: 180, borderRadius: 10 }} />
            </div>
          )}

          {entries.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {tr("Loggade måltider")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ ...glass, borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13.5 }}>{e.name || tr("Måltid")}</span>
                    <span style={{ ...mono, fontSize: 12.5, color: C.accent }}>{Math.round(e.kcal || 0)} {tr("kcal")}</span>
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

function MealBuilderPage({ mealName, setMealName, ingredients, setIngredients, onCancel, onSave, session, country }) {
  const [adding, setAdding] = useState(ingredients.length === 0);
  const [ingName, setIngName] = useState("");
  const [ingWeight, setIngWeight] = useState("");
  const [ingUnit, setIngUnit] = useState("g");
  const [ingKnown100, setIngKnown100] = useState({});
  const [ingShow100, setIngShow100] = useState(false);
  const [ingLoading, setIngLoading] = useState(false);
  const [ingError, setIngError] = useState("");
  const [ingCandidates, setIngCandidates] = useState([]);

  const totals = ingredients.reduce((acc, ing) => {
    KNOWN_FIELDS.forEach(({ key }) => { acc[key] = (acc[key] || 0) + (ing[key] || 0); });
    return acc;
  }, {});

  async function addIngredient() {
    if (!ingName.trim() || !ingWeight.trim()) return;
    setIngLoading(true); setIngError(""); setIngCandidates([]);
    const [lookup, remembered] = await Promise.all([lookupFoodDatabase(ingName, country), loadChoices(session, normalizeQuery(ingName))]);
    const results = mergeCandidates(remembered, lookup.results);
    setIngLoading(false);
    if (results.length > 0) {
      setIngCandidates(results);
      return;
    }
    await finishIngredient(null);
  }
  async function finishIngredient(hit) {
    setIngLoading(true); setIngError("");
    const res = await estimateFoodValues(ingName, ingWeight, ingUnit, ingKnown100, hit);
    setIngCandidates([]);
    if (res.notFound) {
      setIngError(trf("Hittade inte \"{0}\" i databasen. Kolla stavningen, prova engelska (t.ex. \"chicken breast\") eller fyll i värdena per 100g nedanför.", ingName));
      setIngShow100(true);
      setIngLoading(false);
      return;
    }
    if (hit) saveChoice(session, normalizeQuery(ingName), hit);
    setIngredients((list) => [...list, { name: ingName, weight: ingWeight, unit: ingUnit, ...res }]);
    if (res.microsMissing) setIngError(tr("Ingrediensen är tillagd, men vitaminer och mineraler finns inte uppmätta för den."));
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
    ingredients.forEach((ing) => {
      [...compoundsFor([ing.name, ing.matchedName], ing.estimatedGrams), ...(ing.bonus || [])].forEach((b) => {
        const cur = bonusMap[b.name];
        if (!cur) bonusMap[b.name] = { ...b };
        else if (typeof b.qty === "number") cur.qty = (cur.qty || 0) + b.qty;
        else if ((b.level || 0) > (cur.level || 0)) cur.level = b.level;
      });
    });
    const bonus = Object.values(bonusMap);
    onSave({ id: Date.now(), name: mealName, ...totals, microAmounts, bonus, estimatedKeys: [] });
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ChevronLeft size={19} color={C.textDim} />
        </button>
        <p style={{ ...display, fontSize: 16, fontWeight: 600 }}>{tr("Ny måltid")}</p>
      </div>

      <label style={onbLabel}>{tr("Namn på måltiden")}</label>
      <input
        value={mealName} onChange={(e) => setMealName(e.target.value)}
        placeholder={tr("t.ex. Min PWO-måltid")} style={{ ...onbInput, marginBottom: 20 }}
      />

      {ingError && (
        <p style={{ fontSize: 11.5, color: "#F2A94B", marginBottom: 12 }}>{ingError}</p>
      )}

      {ingredients.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {tr("Ingredienser (")}{ingredients.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{ ...glass, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5 }}>{ing.name} <span style={{ color: C.textFaint, fontSize: 11.5 }}>· {ing.weight} {UNIT_LABELS[ing.unit] || tr("g")}</span></p>
                </div>
                <span style={{ ...mono, fontSize: 12, color: C.accent }}>{Math.round(ing.kcal)} {tr("kcal")}</span>
                <button onClick={() => removeIngredient(i)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <X size={14} color={C.textFaint} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ ...glass, borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.textDim }}>{tr("Totalt")}</span>
            <span style={{ ...mono, fontSize: 13, fontWeight: 600 }}>
              {Math.round(totals.kcal || 0)} {tr("kcal ·")} {Math.round(totals.protein_g || 0)}{tr("g protein")}
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
          <Plus size={16} /> {tr("Lägg till ingrediens")}
        </button>
      )}

      {adding && (
        <div className="fade-up" style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <label style={onbLabel}>{tr("Ingrediens")}</label>
          <input value={ingName} onChange={(e) => setIngName(e.target.value)} placeholder={tr("t.ex. kycklingfilé")} style={onbInput} />
          <label style={onbLabel}>{tr("Mängd")}</label>
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
            {tr("Kända värden per 100g (valfritt)")}
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

          {ingCandidates.length > 0 && (
            <div className="fade-up" style={{ marginTop: 12, marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>{tr("Vilken menar du? (värden per 100 g)")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ingCandidates.map((c) => (
                  <CandidateButton key={c.id} c={c} disabled={ingLoading} onPick={() => finishIngredient(c)} />
                ))}
                <button onClick={() => finishIngredient(null)} disabled={ingLoading} style={{ ...ghostBtn, width: "100%" }}>
                  {tr("Inget av dessa — använd mina värden")}
                </button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => { setAdding(false); setIngName(""); setIngWeight(""); setIngError(""); setIngCandidates([]); }} style={ghostBtn}>{tr("Avbryt")}</button>
            <button
              onClick={addIngredient} disabled={!ingName.trim() || !ingWeight.trim() || ingLoading}
              style={{ ...primaryBtn, opacity: !ingName.trim() || !ingWeight.trim() ? 0.5 : 1 }}
            >
              {ingLoading ? tr("Räknar ut…") : tr("Lägg till")}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={saveMeal}
        disabled={!mealName.trim() || ingredients.length === 0}
        style={{ ...primaryBtn, width: "100%", opacity: !mealName.trim() || ingredients.length === 0 ? 0.5 : 1 }}
      >
        <Check size={15} /> {tr("Spara måltid")}
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
      <p style={{ ...display, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{tr("Mina måltider")}</p>
      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 18 }}>
        {tr("Spara måltider du äter ofta — logga dem sen med ett klick istället för att fylla i allt igen.")}
      </p>

      <button
        onClick={onCreateNew}
        style={{
          ...glass, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          borderRadius: 14, padding: "14px 0", marginBottom: 18, color: C.accent, cursor: "pointer", border: "none",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5,
        }}
      >
        <Plus size={16} /> {tr("Skapa ny måltid")}
      </button>

      {savedMeals.length === 0 && (
        <p style={{ fontSize: 12.5, color: C.textFaint, textAlign: "center", padding: "20px 0" }}>
          {tr("Inga sparade måltider än. T.ex. din vanliga PWO-måltid — skapa den en gång, logga den sen på en sekund.")}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {savedMeals.map((meal) => (
          <div key={meal.id} style={{ ...glass, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{meal.name}</p>
              <p style={{ ...mono, fontSize: 11.5, color: C.textFaint }}>
                {Math.round(meal.kcal)} {tr("kcal ·")} {Math.round(meal.protein_g)}{tr("g protein")}
              </p>
            </div>
            <button onClick={() => removeMeal(meal.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Trash2 size={15} color={C.textFaint} />
            </button>
            <button onClick={() => onLogMeal(meal)} style={{ ...primaryBtn, padding: "9px 16px", fontSize: 12.5 }}>
              {tr("Logga")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressPage({ dailyLog, dayFoodLogs = {}, weekLog, setWeekLog, selectedDay, setSelectedDay, goals = [], units = { weight: "kg", height: "cm" }, session }) {
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
      if (weightChange < -0.2) return tr("Bra jobbat, du är på rätt spår mot ditt mål! 📉");
      if (flat) return tr("Vikten låg still — kolla gärna över kalorierna om nedgång är målet.");
      return tr("Inte den bästa veckan för viktnedgång, men du kommer dit. 💪");
    }
    if (wantsUp) {
      if (weightChange > 0.2) return tr("Bra jobbat, du är på rätt spår mot ditt mål! 📈");
      if (flat) return tr("Vikten låg still — kolla gärna över kalorierna om uppgång är målet.");
      return tr("Inte den bästa veckan för viktuppgång, men du kommer dit. 💪");
    }
    // maintain / feel-better / health-focused goals
    if (flat) return tr("Stabil vecka — precis vad som passar om du vill bibehålla vikten. 👍");
    return tr("Vikten rörde sig en del denna vecka — helt normalt, följ trenden över flera veckor.");
  }

  // siffrorna för den valda dagen, från matloggningen
  const dayLog = dayFoodLogs[selectedDay] || (isToday ? dailyLog : []);
  const kcalToday = dayLog.reduce((s, e) => s + (e.kcal || 0), 0);
  const vitaminTotals = sumMicroAmounts(dayLog, VITAMINS);
  const mineralTotals = sumMicroAmounts(dayLog, MINERALS);
  const avgPct = (defs, totals) => {
    const withData = defs.filter((d) => microHasData(dayLog, d.key));
    if (!withData.length) return 0;
    const pcts = withData.map((d) => Math.min(((totals[d.key] || 0) / d.rdi) * 100, 100));
    return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
  };
  const hasFood = dayLog.length > 0;
  const vitaminPct = hasFood ? avgPct(VITAMINS, vitaminTotals) : 0;
  const mineralPct = hasFood ? avgPct(MINERALS, mineralTotals) : 0;

  function updateDay(field, value, extra = {}) {
    setWeekLog((w) => {
      const merged = { ...w[selectedDay], [field]: value, ...extra };
      if (field === "photo" && !value) merged.photoPath = null;
      if (session) {
        supabaseRest("day_info", {
          method: "POST", accessToken: session.access_token, upsert: true,
          body: { user_id: session.user.id, log_date: selectedDay, weight_kg: merged.weight || null, photo_url: merged.photoPath || null },
        }).catch((e) => console.error("Kunde inte spara:", e.message));
      }
      return { ...w, [selectedDay]: merged };
    });
  }
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // utan inloggning finns ingen lagring att ladda upp till — visa bilden lokalt istället
    if (!session) {
      const reader = new FileReader();
      reader.onload = () => updateDay("photo", reader.result);
      reader.readAsDataURL(file);
      return;
    }

    setPhotoUploading(true); setPhotoError("");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${session.user.id}/${selectedDay}.${ext}`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/progress-photos/${path}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": file.type || "image/jpeg",
          "x-upsert": "true", // skriv över om man laddar upp en ny bild för samma dag
        },
        body: file,
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(trf("Uppladdningen misslyckades ({0}): {1}", res.status, errBody));
      }
      const signed = await signPhotoPaths(session.access_token, [path]);
      if (!signed[path]) throw new Error(tr("Bilden laddades upp men kunde inte visas. Ladda om sidan."));
      updateDay("photo", signed[path], { photoPath: path });
    } catch (err) {
      setPhotoError(err.message);
      console.error("Kunde inte ladda upp bilden:", err.message);
    } finally {
      setPhotoUploading(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 0" }}>
      <p style={{ ...display, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{tr("Denna vecka")}</p>
      <p style={{ fontSize: 12, color: C.textFaint, marginBottom: 18 }}>
        {tr("Logga vikt och valfria bilder per dag — så mycket eller lite som du vill.")}
      </p>

      {isSunday && (
        <div className="fade-up" style={{
          ...glass, borderRadius: 16, padding: "16px 18px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div>
            <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{tr("🎉 1 hel vecka avklarad!")}</p>
            <p style={{ fontSize: 11.5, color: C.textFaint }}>{tr("Här är översikten för denna vecka.")}</p>
          </div>
          <button onClick={() => setShowSummary((s) => !s)} style={{ ...ghostBtn, padding: "8px 14px", flexShrink: 0 }}>
            {showSummary ? tr("Dölj") : tr("Visa")}
          </button>
        </div>
      )}

      {showSummary && (
        <div className="fade-up" style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 18 }}>
          <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{tr("Veckosammanfattning")}</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
            <MiniStat label={tr("Dagar loggade")} value={daysLogged} unit="/7" color={C.accent} />
            <MiniStat
              label={tr("Viktförändring")}
              value={weightChange === null ? "–" : (() => {
                const converted = units.weight === "lbs" ? Math.round(weightChange * 2.20462 * 10) / 10 : weightChange;
                return converted > 0 ? `+${converted}` : converted;
              })()}
              unit={units.weight === "lbs" ? "lbs" : "kg"} color={C.vitamin}
            />
          </div>
          <p style={{ fontSize: 11, color: C.textFaint, marginTop: 12 }}>
            {daysLogged === 0
              ? tr("Logga vikt några dagar den här veckan så räknar vi ut din trend.")
              : weightChange === null
                ? tr("Logga vikt minst två dagar för att se en förändring över veckan.")
                : tr("Baserat på första och senaste viktloggningen denna vecka.")}
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
          {tr("Se exempel på veckosammanfattning →")}
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

      {!hasFood && (
        <p style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 14 }}>
          {tr("Ingen mat loggad den här dagen.")}
        </p>
      )}

      <div style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: C.textDim, marginBottom: 14 }}>{tr("Från matloggningen")}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <MiniStat label={tr("Kalorier")} value={hasFood ? Math.round(kcalToday) : "–"} unit="kcal" color={C.accent} />
          <MiniStat label={tr("Vitaminer")} value={hasFood ? vitaminPct : "–"} unit="%" color={C.vitamin} />
          <MiniStat label={tr("Mineraler")} value={hasFood ? mineralPct : "–"} unit="%" color={C.mineral} />
        </div>
      </div>

      <div style={{ ...glass, borderRadius: 16, padding: 18, marginBottom: 14 }}>
        <label style={onbLabel}>{tr("Vikt denna dag (")}{units.weight === "lbs" ? tr("lbs") : tr("kg")})</label>
        <input
          value={dayData.weight ? displayWeight(dayData.weight, units.weight) : ""} inputMode="decimal"
          onChange={(e) => updateDay("weight", parseWeightInput(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""), units.weight))}
          placeholder={units.weight === "lbs" ? tr("t.ex. 164") : tr("t.ex. 74.5")} style={onbInput}
        />
      </div>

      <label
        htmlFor="progress-photo"
        style={{
          ...glass, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8, borderRadius: 16, padding: "26px 12px", cursor: "pointer", marginBottom: 24, overflow: "hidden",
        }}
      >
        {photoUploading ? (
          <>
            <Loader2 size={20} color={C.accent} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 12.5, color: C.textDim }}>{tr("Laddar upp bilden…")}</span>
          </>
        ) : dayData.photo ? (
          <img src={dayData.photo} alt={tr("progressbild")} style={{ maxHeight: 160, borderRadius: 10 }} />
        ) : (
          <>
            <Camera size={20} color={C.textDim} />
            <span style={{ fontSize: 12.5, color: C.textDim }}>{tr("Lägg till progressbild för")} {DAY_LABELS[selectedDay]}</span>
            <span style={{ fontSize: 11, color: C.textFaint }}>{tr("Helt valfritt — dagligen, veckovis, eller aldrig")}</span>
          </>
        )}
      </label>
      <input id="progress-photo" type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
      {photoError && (
        <p style={{ fontSize: 11, color: "#E08F8F", marginTop: -12, marginBottom: 20 }}>{photoError}</p>
      )}
    </div>
  );
}

function BarcodeIcon({ size = 20, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 8v8M10 8v8M13 8v8M16 8v8" />
    </svg>
  );
}

// kameran läser streckkoden: inbyggd BarcodeDetector där den finns (Chrome/Android), annars ZXing (t.ex. iPhone)
function BarcodeScanner({ onCode, onCancel, loading }) {
  const videoRef = useRef(null);
  const doneRef = useRef(false);
  const [status, setStatus] = useState("Startar kameran…");
  const [typed, setTyped] = useState("");

  function submit(code) {
    if (doneRef.current || !code) return;
    doneRef.current = true;
    onCode(code);
  }

  useEffect(() => {
    let cancelled = false;
    let stop = null;
    (async () => {
      try {
        if ("BarcodeDetector" in window) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          const video = videoRef.current;
          video.srcObject = stream;
          await video.play();
          const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
          let timer = null;
          stop = () => { clearTimeout(timer); stream.getTracks().forEach((t) => t.stop()); };
          setStatus(tr("Rikta kameran mot streckkoden"));
          const tick = async () => {
            if (cancelled || doneRef.current) return;
            try {
              const codes = await detector.detect(video);
              if (codes.length) { stop(); submit(codes[0].rawValue); return; }
            } catch (e) { /* försök igen */ }
            timer = setTimeout(tick, 250);
          };
          tick();
        } else {
          const mod = await import(/* @vite-ignore */ "https://esm.sh/@zxing/browser@0.1.5");
          if (cancelled) return;
          const reader = new mod.BrowserMultiFormatReader();
          const controls = await reader.decodeFromConstraints(
            { video: { facingMode: "environment" } },
            videoRef.current,
            (result) => { if (result && !doneRef.current) { controls.stop(); submit(result.getText()); } }
          );
          if (cancelled) { controls.stop(); return; }
          stop = () => controls.stop();
          setStatus(tr("Rikta kameran mot streckkoden"));
        }
      } catch (e) {
        setStatus(tr("Kunde inte starta kameran. Tillåt kameran i webbläsaren, eller skriv streckkoden här nedanför."));
      }
    })();
    return () => { cancelled = true; if (stop) stop(); };
  }, []);

  return (
    <div className="fade-up" style={{ maxWidth: 420, margin: "20px auto" }}>
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000", aspectRatio: "3 / 4", marginBottom: 12 }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", left: "10%", right: "10%", top: "40%", height: "20%",
          border: `2px solid ${C.accent}`, borderRadius: 12, boxShadow: "0 0 0 9999px rgba(0,0,0,.35)",
        }} />
      </div>
      <p style={{ fontSize: 12.5, color: C.textDim, textAlign: "center", marginBottom: 18 }}>
        {loading ? tr("Hämtar produkten…") : status}
      </p>
      <label style={onbLabel}>{tr("Eller skriv siffrorna under streckkoden")}</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={typed} inputMode="numeric" placeholder={tr("t.ex. 7310500088853")}
          onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && typed.length >= 8 && submit(typed)}
          style={{ ...onbInput, flex: 1 }}
        />
        <button onClick={() => typed.length >= 8 && submit(typed)} style={{ ...primaryBtn, opacity: typed.length >= 8 ? 1 : 0.5 }}>{tr("Sök")}</button>
      </div>
      <button onClick={onCancel} style={ghostBtn}>{tr("Tillbaka")}</button>
    </div>
  );
}

// gram per enhet när en loggad rad ändras (vätskor räknas som 1 g per ml)
const UNIT_TO_GRAMS = { g: 1, ml: 1, dl: 100, msk: 15, tsk: 5, kopp: 240 };
function gramsFor(amount, unit, name) {
  if (unit === "st") { const pg = pieceGrams((name || "").toLowerCase()); return pg ? amount * pg : null; }
  return UNIT_TO_GRAMS[unit] ? amount * UNIT_TO_GRAMS[unit] : null;
}
function formatLogQty(entry) {
  if (entry.amount && entry.unit && entry.unit !== "g") {
    const n = Math.round(entry.amount * 10) / 10;
    return `${n.toLocaleString(LOCALE)} ${UNIT_LABELS[entry.unit] || entry.unit}`;
  }
  return Number(entry.grams) > 0 ? `${Math.round(entry.grams)} g` : null;
}

function LogRow({ entry, onDelete, onScale }) {
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const hasGrams = Number(entry.grams) > 0;
  const startUnit = entry.unit && entry.amount ? entry.unit : "g";
  const startValue = entry.unit && entry.amount ? String(entry.amount) : hasGrams ? String(Math.round(entry.grams)) : "1";
  const [unit, setUnit] = useState(startUnit);
  const [value, setValue] = useState(startValue);
  const [msg, setMsg] = useState("");
  const qty = formatLogQty(entry);

  function save() {
    const v = Number(String(value).replace(",", "."));
    if (!(v > 0)) return;
    if (!hasGrams) { onScale(v, null); setOpen(false); return; } // äldre logg utan vikt: antal portioner
    const g = gramsFor(v, unit, entry.name);
    if (!g) { setMsg(trf("Vet inte vad en \"{0}\" väger — välj gram i stället.", entry.name)); return; }
    onScale(g / Number(entry.grams), Math.round(g), v, unit);
    setOpen(false);
  }

  return (
    <div style={{ ...glass, borderRadius: 14, overflow: "hidden" }}>
      <button
        onClick={() => { setOpen((o) => !o); setConfirmDel(false); setMsg(""); setUnit(startUnit); setValue(startValue); }}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer", color: C.text,
          padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 13.5 }}>
          {entry.name || tr("Måltid")}
          {qty && <span style={{ color: C.textFaint, fontSize: 11.5 }}> · {qty}</span>}
        </span>
        <span style={{ ...mono, fontSize: 12.5, color: C.accent }}>{Math.round(entry.kcal || 0)} {tr("kcal")}</span>
      </button>
      {open && (
        <div className="fade-up" style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: C.textDim, flex: 1 }}>{hasGrams ? tr("Mängd") : tr("Antal portioner")}</span>
            <input
              value={value} inputMode="decimal"
              onChange={(ev) => setValue(ev.target.value.replace(/[^0-9.,]/g, ""))}
              onKeyDown={(ev) => ev.key === "Enter" && save()}
              style={{ ...onbInput, width: 90, padding: "8px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <button onClick={save} style={{ ...primaryBtn, padding: "8px 14px", fontSize: 12.5 }}>{tr("Spara")}</button>
          </div>
          {hasGrams && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {UNITS.map((u) => (
                <button
                  key={u.v} onClick={() => { setUnit(u.v); setMsg(""); }}
                  style={{
                    fontSize: 11, padding: "5px 9px", borderRadius: 7, cursor: "pointer",
                    border: unit === u.v ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                    background: unit === u.v ? C.accent : "rgba(255,255,255,0.05)",
                    color: unit === u.v ? "#08150E" : C.textDim, fontWeight: unit === u.v ? 600 : 400,
                  }}
                >
                  {u.l}
                </button>
              ))}
            </div>
          )}
          {msg && <p style={{ fontSize: 11.5, color: C.estimate }}>{msg}</p>}
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} style={{ ...ghostBtn, color: "#E08F8F", padding: "8px 12px" }}>
              <Trash2 size={13} /> {tr("Ta bort")}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDel(false)} style={{ ...ghostBtn, flex: 1, padding: "8px 12px" }}>{tr("Avbryt")}</button>
              <button onClick={onDelete} style={{ ...primaryBtn, flex: 1, padding: "8px 12px", background: "#E08F8F", boxShadow: "none", color: "#2a0f0f" }}>
                {tr("Ja, ta bort")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CandidateButton({ c, onPick, disabled }) {
  const src = c.source === "Open Food Facts" ? `${tr("Märkesvara")}${c.brand ? ` · ${c.brand}` : ""}` : null;
  return (
    <button
      onClick={onPick} disabled={disabled}
      style={{
        ...glass, borderRadius: 14, padding: "12px 16px", textAlign: "left", cursor: disabled ? "default" : "pointer",
        color: C.text, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, width: "100%",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, marginBottom: 3 }}>{c.name}</div>
        <div style={{ fontSize: 10.5, color: C.textFaint }}>
          {src ? `${src} · ` : ""}{tr("P")} {Math.round(c.per100.protein_g)}{tr("g · K")} {Math.round(c.per100.carbs_g)}{tr("g · F")} {Math.round(c.per100.fat_g)}{tr("g")}
          {c.remembered ? <span style={{ color: C.estimate }}> {tr("· ditt val")}</span> : null}
          {isUncookedWeight(c.name) ? <span style={{ color: C.estimate }}> {tr("· okokt vikt")}</span> : null}
        </div>
      </div>
      <span style={{ ...mono, fontSize: 12.5, color: C.accent, flexShrink: 0 }}>{Math.round(c.per100.kcal)} {tr("kcal")}</span>
    </button>
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
    { key: "macros", label: tr("Makros") },
    { key: "vitamins", label: tr("Vitaminer") },
    { key: "minerals", label: tr("Mineraler") },
    { key: "bonus", label: tr("Bra ämnen") },
    { key: "ranking", label: tr("Hälsoranking") },
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
          {tr("Inget loggat idag än — här är hur det ser ut tills du loggar något.")}
        </p>
      )}

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div key={pageIdx} className="fade-up">
          {/* macros */}
          {pageIdx === 0 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 18, color: C.accent }}>{tr("Makros idag")}</p>
              <BarRow label={tr("Kalorier")} value={Math.round(totals.kcal)} max={targets.kcal} unit="kcal" sublabel={targets.kcal} color={C.accent} colorDim={C.accentDim} />
              <BarRow label={tr("Protein")} value={Math.round(totals.protein_g)} max={targets.protein_g} unit="g" sublabel={targets.protein_g} color={C.accent} colorDim={C.accentDim} />
              <BarRow label={tr("Kolhydrater")} value={Math.round(totals.carbs_g)} max={targets.carbs_g} unit="g" sublabel={targets.carbs_g} color={C.accent} colorDim={C.accentDim} />
              <BarRow label={tr("Fett")} value={Math.round(totals.fat_g)} max={targets.fat_g} unit="g" sublabel={targets.fat_g} color={C.accent} colorDim={C.accentDim} />
            </div>
          )}

          {/* vitamins — full canonical list, always shown, even at 0 */}
          {pageIdx === 1 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 18, color: C.vitamin }}>{tr("Vitaminer idag")}</p>
              {VITAMINS.filter((v) => dailyLog.length === 0 || microHasData(dailyLog, v.key)).map((v) => (
                <MicroRow
                  key={v.key} def={v} amount={vitaminTotals[v.key] || 0}
                  noData={dailyLog.length > 0 && !dailyLog.some((e) => (e.microAmounts || {})[v.key] !== undefined)}
                  color={C.vitamin} colorDim={C.vitaminDim}
                  open={openInfo === v.key} onToggle={() => toggle(v.key)}
                />
              ))}
              {dailyLog.length > 0 && VITAMINS.some((d) => !microHasData(dailyLog, d.key)) && (
                <p style={{ fontSize: 11, color: C.textFaint, marginTop: 10 }}>
                  {VITAMINS.filter((d) => !microHasData(dailyLog, d.key)).map((d) => d.name).join(", ")} {tr("visas inte — de finns inte uppmätta för det du ätit idag.")}
                </p>
              )}
            </div>
          )}

          {/* minerals — full canonical list, always shown, even at 0 */}
          {pageIdx === 2 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 18, color: C.mineral }}>{tr("Mineraler idag")}</p>
              {MINERALS.filter((m) => dailyLog.length === 0 || microHasData(dailyLog, m.key)).map((m) => (
                <MicroRow
                  key={m.key} def={m} amount={mineralTotals[m.key] || 0}
                  noData={dailyLog.length > 0 && !dailyLog.some((e) => (e.microAmounts || {})[m.key] !== undefined)}
                  color={C.mineral} colorDim={C.mineralDim}
                  open={openInfo === m.key} onToggle={() => toggle(m.key)}
                />
              ))}
              {dailyLog.length > 0 && MINERALS.some((d) => !microHasData(dailyLog, d.key)) && (
                <p style={{ fontSize: 11, color: C.textFaint, marginTop: 10 }}>
                  {MINERALS.filter((d) => !microHasData(dailyLog, d.key)).map((d) => d.name).join(", ")} {tr("visas inte — de finns inte uppmätta för det du ätit idag.")}
                </p>
              )}
            </div>
          )}

          {/* bonus — open-ended, only what's actually been eaten */}
          {pageIdx === 3 && (
            <div className="glass-card" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 6, color: C.bonus }}>{tr("Bra ämnen idag")}</p>
              <p style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 16 }}>
                {tr("Visas bara här om du faktiskt fått i dig något av det. Uppmätta ämnen visas med mängd; övriga med en ungefärlig nivå (låg–mycket hög) utifrån typiska halter i livsmedlet.")}
              </p>
              {bonusList.length === 0 && <p style={{ fontSize: 12.5, color: C.textFaint }}>{tr("Inget upptäckt än idag.")}</p>}
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
                            {tr("i")}
                          </button>
                        )}
                      </div>
                      <span style={{ ...mono, fontSize: 12, color: C.bonus }}>{b.amount || tr("spårmängd")}</span>
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
              <p style={{ ...display, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{tr("Hälsoranking idag")}</p>
              <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 16 }}>
                {tr("Uppskattat stöd från det du ätit — inte ett medicinskt mått.")}
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
                          {tr("i")}
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
            {pages[pageIdx].label} {tr("— svep för fler")}
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
