import React, { useMemo, useState, useEffect } from "react";
import Fuse from "fuse.js";

export default function CountryDropdown({ setGuess, disabled }) {
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1); // for arrow navigation

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2"
        );
        const data = await res.json();
        const normalized = data.map((c) => ({
          name: c.name.common,
          code: c.cca2,
        }));
        setCountries(normalized);
      } catch (err) {
        console.error("Error fetching countries:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(countries, { keys: ["name", "code"], threshold: 0.1 });
  }, [countries]);

  const results = query ? fuse.search(query).map((r) => r.item) : [];

  // Keep highlighted index reasonable when results change
  useEffect(() => {
    if (!showDropdown || results.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    // If nothing is highlighted but we have results, start at top
    if (highlightedIndex < 0 || highlightedIndex >= results.length) {
      setHighlightedIndex(0);
    }
  }, [results, showDropdown, highlightedIndex]);

  function handleSelect(country) {
    setQuery(country.name);
    setShowDropdown(false);
    setGuess(country.name);
    console.log("[country picked]", country.name);
  }

  function handleKeyDown(e) {
    if (disabled) return;

    // 🔻 Move highlight down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showDropdown && results.length > 0) {
        setShowDropdown(true);
        setHighlightedIndex(0);
        return;
      }
      if (results.length > 0) {
        setHighlightedIndex((prev) => {
          if (prev < 0) return 0;
          return prev + 1 < results.length ? prev + 1 : 0; // wrap around
        });
      }
      return;
    }

    // 🔺 Move highlight up
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showDropdown && results.length > 0) {
        setShowDropdown(true);
        setHighlightedIndex(0);
        return;
      }
      if (results.length > 0) {
        setHighlightedIndex((prev) => {
          if (prev < 0) return results.length - 1;
          return prev - 1 >= 0 ? prev - 1 : results.length - 1; // wrap around
        });
      }
      return;
    }

    // 🔹 TAB: select highlighted (or first) but DO NOT preventDefault
    // so focus can move to the Submit button. Flow: arrows → Tab (select) → Enter (submit).
    if (e.key === "Tab") {
      const index = highlightedIndex >= 0 ? highlightedIndex : 0;
      const chosen = results[index];
      if (chosen) {
        handleSelect(chosen);
      } else {
        // no match, just sync the raw query
        setGuess(query);
      }
      // no preventDefault -> browser will move focus to next element (usually Submit button)
      return;
    }

    // 🔹 ENTER: select highlighted (or first) and stay in this input
    if (e.key === "Enter") {
      e.preventDefault();
      const index = highlightedIndex >= 0 ? highlightedIndex : 0;
      const chosen = results[index];
      if (chosen) {
        handleSelect(chosen);
      } else {
        setShowDropdown(false);
        setGuess(query);
      }
    }
  }

  if (loading) return <p>Loading countries...</p>;

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setShowDropdown(true);
          setGuess(v); // keep parent guess in sync while typing
        }}
        onFocus={() => !disabled && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          paddingTop: 10,
          paddingBottom: 10,
          textAlign: "center",
          fontSize: 16,
          width: "100%",
          boxSizing: "border-box",
        }}
        placeholder="Type a country (name or code)…"
      />

      {showDropdown && results.length > 0 && !disabled && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            width: "100%",
            maxHeight: "200px",
            overflowY: "auto",
            border: "1px solid #ccc",
            backgroundColor: "#2b2a33",
            margin: 0,
            padding: 0,
            listStyle: "none",
            zIndex: 1000,
          }}
        >
          {results.map((c, index) => (
            <li
              key={c.code}
              style={{
                padding: "5px",
                cursor: "pointer",
                backgroundColor:
                  index === highlightedIndex ? "#444" : "transparent",
              }}
              onMouseDown={() => handleSelect(c)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {c.name} ({c.code})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
