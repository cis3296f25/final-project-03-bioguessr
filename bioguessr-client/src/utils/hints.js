// bioguessr-client/src/utils/hints.js

// ---------- Core helpers ----------

// Safe getter: get(obj, "characteristics.location", "default")
function get(obj, path, dflt = "") {
  try {
    const out = path
      .split(".")
      .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
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

// Normalize countries array into a clean string[] list
function normalizeCountries(animal) {
  const raw = get(animal, "countries", []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter((c) => c.length > 0);
}

// Take a long habitat string like
// "deserts, high veld, floodplains, grassland, savanna, farms, marshes, ponds, lakes"
// and shrink it to e.g. "deserts and high veld"
function shortenHabitat(habitat, maxItems = 2) {
  if (!habitat || typeof habitat !== "string") return "";
  const parts = habitat
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const slice = parts.slice(0, maxItems);
  if (slice.length === 2) {
    return `${slice[0]} and ${slice[1]}`;
  }
  return slice.join(", ");
}

// ---------- MAIN HINT: location first, lots of fallbacks ----------

export function getFeatureHint(animal) {
  if (!animal) {
    return "No data for this animal yet.";
  }

  // 1) MAIN: location / region
  const region = pickFirst(animal, [
    "characteristics.location",
    "location",
    "region",
  ]);
  if (region) {
    return `Location – ${region}.`;
  }

  // 2) HABITAT fallback
  const rawHabitat = pickFirst(animal, ["characteristics.habitat", "habitat"]);
  const habitatShort = shortenHabitat(rawHabitat);
  if (habitatShort) {
    return `Habitat – ${habitatShort}.`;
  }

  // 3) DISTINCTIVE FEATURE
  const feature = pickFirst(animal, [
    "characteristics.most_distinctive_feature",
    "characteristics.distinctive_feature",
    "most_distinctive_feature",
    "distinctive_feature",
  ]);
  if (feature) {
    return `Most distinctive feature – ${feature}.`;
  }

  // 4) DIET
  const diet = pickFirst(animal, ["characteristics.diet", "diet"]);
  if (diet) {
    return `Diet – ${diet}.`;
  }

  // 5) LIFESTYLE
  const lifestyle = pickFirst(animal, [
    "characteristics.lifestyle",
    "lifestyle",
  ]);
  if (lifestyle) {
    return `Lifestyle – ${lifestyle}.`;
  }

  // 6) SLOGAN
  const slogan = pickFirst(animal, ["characteristics.slogan", "slogan"]);
  if (slogan) {
    return slogan;
  }

  // 7) Truly nothing
  return "No descriptive information available.";
}

// ---------- Extra info (currently unused in Easy mode) ----------

export function getWeightHint(animal) {
  if (!animal) {
    return "Extra info unavailable.";
  }

  const weight = pickFirst(animal, ["characteristics.weight", "weight"]);
  if (weight) return `Typical weight: ${weight}.`;

  const length = pickFirst(animal, [
    "characteristics.length",
    "length",
    "size",
  ]);
  if (length) return `Typical size: ${length}.`;

  const speed = pickFirst(animal, [
    "characteristics.top_speed",
    "top_speed",
    "speed",
  ]);
  if (speed) return `Top speed: ${speed}.`;

  return "Extra info unavailable.";
}

// ---------- Optional helper: raw countries array ----------

export function extractCountries(animal) {
  return normalizeCountries(animal);
}
