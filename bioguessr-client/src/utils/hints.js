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

function pickFirst(obj, paths) {
  for (const p of paths) {
    const v = get(obj, p, "");
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizeCountries(animal) {
  const raw = get(animal, "countries", []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter((c) => c.length > 0);
}

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

export function getFeatureHint(animal) {
  if (!animal) {
    return "No data for this animal yet.";
  }

  const region = pickFirst(animal, [
    "characteristics.location",
    "location",
    "region",
  ]);
  if (region) {
    return `Location – ${region}.`;
  }

  const rawHabitat = pickFirst(animal, ["characteristics.habitat", "habitat"]);
  const habitatShort = shortenHabitat(rawHabitat);
  if (habitatShort) {
    return `Habitat – ${habitatShort}.`;
  }

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

  const lifestyle = pickFirst(animal, [
    "characteristics.lifestyle",
    "lifestyle",
  ]);
  if (lifestyle) {
    return `Lifestyle – ${lifestyle}.`;
  }

  const slogan = pickFirst(animal, ["characteristics.slogan", "slogan"]);
  if (slogan) {
    return slogan;
  }

  return "No descriptive information available.";
}

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

export function extractCountries(animal) {
  return normalizeCountries(animal);
}
