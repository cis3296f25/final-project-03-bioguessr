import React, { useMemo, useState, useEffect } from "react";
import Fuse from "fuse.js";

export default function CountryDropdown({ setGuess }) {
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2");
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
          setGuess(v);             // <-- keep parent guess in sync while typing
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
        style={{ paddingTop: 10, paddingBottom: 10, textAlign: "center", fontSize: 16, width: "100%", boxSizing: "border-box" }}
        placeholder="Type a country (name or code)…"
      />

      {showDropdown && results.length > 0 && (
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
          {results.map((c) => (
            <li
              key={c.code}
              style={{ padding: "5px", cursor: "pointer" }}
              onMouseDown={() => {
                setQuery(c.name);
                setShowDropdown(false);
                setGuess(c.name);        // still set on selection
                console.log("[country picked]", c.name);
              }}
            >
              {c.name} ({c.code})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
