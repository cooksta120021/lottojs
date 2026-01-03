// Parser for Mega Millions draw table.
// Returns array of { main: number[], special: number[] }

function textContentTrim(node) {
  return (node?.textContent || "").trim();
}

export function parseMegaMillions(doc) {
  // TODO: adjust selectors if the HTML structure differs.
  // Example assumes a table with rows where first 5 numbers are main, last is special.
  const rows = Array.from(doc.querySelectorAll("table tr")).slice(1); // skip header

  return rows.map((tr) => {
    const cells = Array.from(tr.querySelectorAll("td")).map(textContentTrim);
    const main = cells.slice(0, 5).map(Number).filter((n) => !Number.isNaN(n));
    const special = cells.slice(5, 6).map(Number).filter((n) => !Number.isNaN(n));
    return { main, special };
  });
}
