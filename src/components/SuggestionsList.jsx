import React from "react";

export default function SuggestionsList({ suggestions }) {
  if (!suggestions?.length) return null;

  const pad2 = (v) => v.toString().padStart(2, "0");

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3>Suggestion Sets</h3>
      <ol>
        {suggestions.map((set, idx) => (
          <li key={idx}>{set.map(pad2).join(", ")}</li>
        ))}
      </ol>
    </div>
  );
}
