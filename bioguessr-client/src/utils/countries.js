export function cleanCountries(countries) {
  if (!countries || !Array.isArray(countries)) return [];
  
  const isCountryCode = (s) => /^[A-Z]{2,3}$/.test(s);
  
  const seen = new Set();
  const result = [];
  
  for (const country of countries) {
    if (!country || typeof country !== 'string') continue;
    if (isCountryCode(country)) continue;
    if (country === country.toUpperCase() && country.length > 3) continue;
    
    const normalized = country.toLowerCase().trim();
    if (seen.has(normalized)) continue;
    
    seen.add(normalized);
    result.push(country);
  }
  
  return result.sort();
}
