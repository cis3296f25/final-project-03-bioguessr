import { useMemo, useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";

export default function CountryDropdown({ setGuess, onSubmit, value = "" }) {
  const [query, setQuery] = useState(value);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2");
        const data = await res.json();
        const normalized = data.map((c) => ({
          name: c.name.common,
          code: c.cca2,
        })).sort((a, b) => a.name.localeCompare(b.name));
        setCountries(normalized);
      } catch (err) {
        console.error("Error fetching countries:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(countries, { keys: ["name", "code"], threshold: 0.3 });
  }, [countries]);

  const results = query ? fuse.search(query).slice(0, 8).map((r) => r.item) : [];

  const selectCountry = (country) => {
    setQuery(country.name);
    setShowDropdown(false);
    setGuess(country.name);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (results.length === 0) return;

      switch (e.key) {
        case "Tab":
          e.preventDefault();
          selectCountry(results[0]);
          break;
        case "Enter":
          onSubmit();
          break;
      }

      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Tab":
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          selectCountry(results[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Sync with external value (for reset between rounds)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  if (loading) {
    return (
      <div className="country-input-wrapper">
        <div className="country-input loading">Loading countries...</div>
      </div>
    );
  }

  return (
    <div className="country-input-wrapper">
      <input
        ref={inputRef}
        type="text"
        className="country-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
          setGuess(e.target.value);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Type a country..."
        autoComplete="off"
        autoFocus
      />

      {query && results.length > 0 && (
        <span className="tab-hint">Tab to complete</span>
      )}

      {showDropdown && results.length > 0 && (
        <ul className="country-dropdown">
          {results.map((c, i) => (
            <li
              key={c.code}
              className={`country-option ${i === selectedIndex ? "selected" : ""}`}
              onMouseDown={() => selectCountry(c)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="country-name">{c.name}</span>
              <span className="country-code">{c.code}</span>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && query && results.length === 0 && (
        <div className="country-dropdown no-results">
          No countries found
        </div>
      )}
    </div>
  );
}
