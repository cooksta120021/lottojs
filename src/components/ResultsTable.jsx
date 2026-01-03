import React from "react";

export default function ResultsTable({ counts }) {
  if (!counts?.length) return null;

  const pad2 = (v) => v.toString().padStart(2, "0");

  const mains = counts.filter((c) => c.category !== "special");
  const specials = counts.filter((c) => c.category === "special");

  const rows = [
    ...mains.map((c) => ({ type: "main", value: pad2(c.value), count: c.count })),
    ...(specials.length ? [{ type: "separator" }] : []),
    ...specials.map((c) => ({ type: "special", value: pad2(c.value), count: c.count })),
  ];

  return (
    <details style={{ marginTop: "1rem" }} open>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>Counts</summary>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", marginTop: "0.5rem" }}>
        <thead>
          <tr>
            <th>Value</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) =>
            r.type === "separator" ? (
              <tr key={`sep-${idx}`}>
                <td colSpan={2} style={{ textAlign: "center", fontWeight: 700 }}>
                  BONUS
                </td>
              </tr>
            ) : (
              <tr key={`${r.type}-${r.value}-${idx}`}>
                <td>{r.value}</td>
                <td>{r.count}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </details>
  );
}
