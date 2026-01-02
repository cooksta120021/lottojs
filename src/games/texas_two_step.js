// Parser for Texas Two Step draw table.
// Returns array of { main: number[], special: number[] }

function textContentTrim(node) {
  return (node?.textContent || "").trim();
}

export function parseTexasTwoStep(doc) {
  // TODO: adjust selectors if the HTML structure differs.
  // Texas Two Step: 4 main numbers (1-35), 1 bonus (1-35).
  const rows = Array.from(doc.querySelectorAll("table tr")).slice(1); // skip header

  return rows.map((tr) => {
    const cells = Array.from(tr.querySelectorAll("td")).map(textContentTrim);
    const main = cells.slice(0, 4).map(Number).filter((n) => !Number.isNaN(n));
    const special = cells.slice(4, 5).map(Number).filter((n) => !Number.isNaN(n));
    return { main, special };
  });
}
