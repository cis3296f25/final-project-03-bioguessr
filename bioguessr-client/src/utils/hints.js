// bioguessr-client/src/utils/hints.js

// Safe getter
function get(obj, path, dflt = "") {
  try {
    const out = path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
    if (out == null) return dflt;
    return typeof out === "string" ? out.trim() : out;
  } catch {
    return dflt;
  }
}

// Pick first non-empty string from candidate paths
function pickFirst(obj, paths) {
  for (const p of paths) {
    const v = get(obj, p, "");
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

// 1) Distinctive feature → fallbacks (diet → habitat → prey → lifestyle → slogan)
export function getFeatureHint(animal) {
  // Try both nested and root, and a few name variants we’ve seen in different datasets
  const feature = pickFirst(animal, [
    "characteristics.most_distinctive_feature",
    "characteristics.distinctive_feature",
    "most_distinctive_feature",
    "distinctive_feature",
  ]);

  if (feature) return `Most distinctive feature: ${feature}`;

  const diet = pickFirst(animal, ["characteristics.diet", "diet"]);
  if (diet) return `Diet: ${diet}`;

  const habitat = pickFirst(animal, ["characteristics.habitat", "habitat"]);
  if (habitat) return `Habitat: ${habitat}`;

  const prey = pickFirst(animal, ["characteristics.prey", "prey"]);
  if (prey) return `Typical prey: ${prey}`;

  const lifestyle = pickFirst(animal, ["characteristics.lifestyle", "lifestyle"]);
  if (lifestyle) return `Lifestyle: ${lifestyle}`;

  const slogan = pickFirst(animal, ["characteristics.slogan", "slogan"]);
  if (slogan) return slogan;

  return "No feature hint available";
}

// 2) Weight → fallbacks (top_speed → height/length → location/region)
export function getWeightHint(animal) {
  const weight = pickFirst(animal, ["characteristics.weight", "weight"]);
  if (weight) return `Weight: ${weight}`;

  const speed = pickFirst(animal, ["characteristics.top_speed", "top_speed", "speed"]);
  if (speed) return `Top speed: ${speed}`;

  const height = pickFirst(animal, ["characteristics.height", "height"]);
  if (height) return `Height: ${height}`;

  const length = pickFirst(animal, ["characteristics.length", "length", "size"]);
  if (length) return `Length/size: ${length}`;

  const location = pickFirst(animal, ["characteristics.location", "location", "region"]);
  if (location) return `Typical region: ${location}`;

  return "No weight/speed hint available";
}

// (Optional) If you later need the countries array:
export function extractCountries(animal) {
  return get(animal, "countries", []);
}
