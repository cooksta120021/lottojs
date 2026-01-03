// Parser for Texas Two Step draw table from:
// https://www.texaslottery.com/export/sites/lottery/Games/Texas_Two_Step/Winning_Numbers/index.html
// Returns array of { main: number[], special: number[] }

const MIN = 1;
const MAX = 35;

function parseRowNumbers(row) {
  const textBits = Array.from(row.querySelectorAll("td, th, li, span, div")).map(
    (n) => n.textContent || ""
  );
  const nums = textBits
    .join(" ")
    .match(/\d{1,2}/g)?.map(Number)
    .filter((n) => !Number.isNaN(n) && n >= MIN && n <= MAX);
  if (!nums || nums.length < 5) return null;
  const main = nums.slice(0, 4);
  const special = nums.slice(4, 5);
  return { main, special };
}

export function parseTexasTwoStep(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll("table tr"));

  const draws = [];
  const seen = new Set();
  for (const row of rows) {
    const parsed = parseRowNumbers(row);
    if (!parsed) continue;
    const key = `${parsed.main.join("-")}|${parsed.special.join("-")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    draws.push(parsed);
  }

  return draws;
}
