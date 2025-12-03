import { useState } from "react";
import { cleanCountries } from "./utils/countries.js";

const INITIAL_SHOW = 5;

export default function RegionsList({ countries }) {
  const [expanded, setExpanded] = useState(false);
  const cleaned = cleanCountries(countries);
  
  if (cleaned.length === 0) {
    return <span className="regions-empty">No regions listed</span>;
  }

  const shouldTruncate = cleaned.length > INITIAL_SHOW;
  const displayed = expanded ? cleaned : cleaned.slice(0, INITIAL_SHOW);
  const remaining = cleaned.length - INITIAL_SHOW;

  return (
    <div className="regions-list">
      <div className="regions-pills">
        {displayed.map((region, i) => (
          <span key={i} className="region-pill">{region}</span>
        ))}
        {shouldTruncate && !expanded && (
          <button 
            className="region-pill region-more" 
            onClick={() => setExpanded(true)}
          >
            +{remaining} more
          </button>
        )}
        {shouldTruncate && expanded && (
          <button 
            className="region-pill region-less" 
            onClick={() => setExpanded(false)}
          >
            show less
          </button>
        )}
      </div>
    </div>
  );
}
