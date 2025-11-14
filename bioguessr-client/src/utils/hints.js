const ISO2_TO_NAME = {
  BW:"Botswana", CF:"Central African Republic", GA:"Gabon", KE:"Kenya",
  MZ:"Mozambique", NA:"Namibia", TD:"Chad", TZ:"Tanzania",
  ZA:"South Africa", ZM:"Zambia", AU:"Australia", BG:"Bulgaria",
  CA:"Canada", CN:"China", DE:"Germany", DK:"Denmark", EG:"Egypt",
  ES:"Spain", FR:"France", GB:"United Kingdom", GR:"Greece",
  HR:"Croatia", HU:"Hungary", ID:"Indonesia", IN:"India",
  IR:"Iran", IT:"Italy", JP:"Japan", MX:"Mexico", MY:"Malaysia",
  NZ:"New Zealand", PA:"Panama", PE:"Peru", PL:"Poland",
  RO:"Romania", RS:"Serbia", RU:"Russia", SG:"Singapore",
  TH:"Thailand", TR:"Türkiye", TW:"Taiwan", UA:"Ukraine",
  US:"United States", VN:"Vietnam", AT:"Austria", CH:"Switzerland",
  CZ:"Czechia", SE:"Sweden", NO:"Norway", FI:"Finland"
};

const COUNTRY_TO_CONTINENT = {
  "Botswana":"Africa","Namibia":"Africa","South Africa":"Africa","Gabon":"Africa",
  "Kenya":"Africa","Tanzania, United Republic of":"Africa","Tanzania":"Africa",
  "Zambia":"Africa","Zimbabwe":"Africa","Nigeria":"Africa","Ghana":"Africa",
  "Algeria":"Africa","Morocco":"Africa","Tunisia":"Africa","Chad":"Africa",
  "Central African Republic":"Africa","Ethiopia":"Africa","Somalia":"Africa",
  "Sudan":"Africa","Egypt":"Africa","Rwanda":"Africa","Uganda":"Africa",
  "Madagascar":"Africa","Mozambique":"Africa","Republic of the Congo":"Africa",
  "Congo":"Africa","Congo, The Democratic Republic of the":"Africa",
  "Eswatini":"Africa","Burundi":"Africa","Mali":"Africa","Niger":"Africa",
  "Senegal":"Africa","Gambia":"Africa","Benin":"Africa","Togo":"Africa",
  "Libya":"Africa","Lesotho":"Africa",
  "Austria":"Europe","Germany":"Europe","France":"Europe","Spain":"Europe",
  "Italy":"Europe","Greece":"Europe","Croatia":"Europe","Hungary":"Europe",
  "Romania":"Europe","Serbia":"Europe","Poland":"Europe","Bulgaria":"Europe",
  "Czechia":"Europe","Switzerland":"Europe","Sweden":"Europe","Norway":"Europe",
  "United Kingdom":"Europe","Ireland":"Europe",
  "United States":"North America","Canada":"North America","Mexico":"North America",
  "India":"Asia","China":"Asia","Japan":"Asia","Malaysia":"Asia",
  "Indonesia":"Asia","Thailand":"Asia","Vietnam":"Asia","Türkiye":"Asia",
  "Iran, Islamic Republic of":"Asia","Singapore":"Asia","Taiwan, Province of China":"Asia",
  "Taiwan":"Asia","Israel":"Asia",
  "Australia":"Oceania","New Zealand":"Oceania",
  "Antarctica":"Antarctica","AQ":"Antarctica"
};

export function normalizeCountries(rawList = []) {
  const out = new Set();
  for (const c of rawList) {
    if (!c) continue;
    const t = String(c).trim();
    if (ISO2_TO_NAME[t]) { out.add(ISO2_TO_NAME[t]); continue; }
    if (t === "TZ") { out.add("Tanzania"); continue; }
    if (t === "ZA") { out.add("South Africa"); continue; }
    if (t === "MZ") { out.add("Mozambique"); continue; }
    if (t === "NA") { out.add("Namibia"); continue; }
    if (t === "TD") { out.add("Chad"); continue; }
    out.add(t);
  }
  return Array.from(out);
}

export function deriveContinent(countries = []) {
  const counts = {};
  for (const c of countries) {
    const cont = COUNTRY_TO_CONTINENT[c] || null;
    if (cont) counts[cont] = (counts[cont] || 0) + 1;
  }
  const best = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  return best ? best[0] : null;
}

export function deriveBiome(habitat = "") {
  const h = (habitat || "").toLowerCase();
  if (h.includes("desert") || h.includes("semi-desert") || h.includes("semidesert")) return "Desert";
  if (h.includes("savanna") || h.includes("grass")) return "Savanna/Grassland";
  if (h.includes("forest") || h.includes("wood")) return "Forest";
  if (h.includes("marine") || h.includes("ocean") || h.includes("coastal")) return "Marine/Coastal";
  if (h.includes("tundra") || h.includes("antarctic")) return "Polar/Tundra";
  if (h.includes("wetland") || h.includes("swamp") || h.includes("delta")) return "Wetland";
  return "Mixed/Other";
}

export function buildHintsForAnimal(animal) {
  const countries = normalizeCountries(animal?.countries || []);
  const continent = deriveContinent(countries);
  const biome = deriveBiome(animal?.characteristics?.habitat || "");
  return { biome, continent, countries };
}
