import fs from "fs";
import path from "path";

const TARGET_URL = "https://www.texaslottery.com/export/sites/lottery/Games/Texas_Two_Step/Winning_Numbers/index.html";
const DOWNLOAD_URL = "https://www.texaslottery.com/export/sites/lottery/Games/Texas_Two_Step/Winning_Numbers/download.html";
const CSV_URL =
  "https://www.texaslottery.com/export/sites/lottery/Games/Texas_Two_Step/Winning_Numbers/texastwostep.csv";
const OUTPUT = path.resolve("./src/games/texas/data/texas_two_step.json");
const MIN = 1;
const MAX = 35;

function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ");
}

function parseCsv(text, accumulator, seen) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.toLowerCase().includes("draw date")) continue;
    const parts = line.split(/,/).map((p) => p.trim());
    // Expected: Game Name, Month, Day, Year, Num1, Num2, Num3, Num4, Bonus
    if (parts.length < 9) continue;
    const [game, month, day, year, ...rest] = parts;
    if (game && game.toLowerCase().includes("texas two step") === false) continue;
    if (!month || !day || !year) continue;
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const yyyy = year.length === 2 ? `20${year}` : year;
    const date = `${mm}/${dd}/${yyyy}`;
    const nums = rest
      .slice(0, 5)
      .map((n) => Number(n))
      .filter((n) => !Number.isNaN(n) && n >= MIN && n <= MAX);
    if (nums.length !== 5) continue;
    const main = nums.slice(0, 4);
    const special = nums.slice(4, 5);
    const key = `${main.join("-")}|${special.join("-")}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    accumulator.push({ date, main, special });
  }
}

function parseDraws(html, accumulator, seen) {
  // Flatten all text to catch table and CSV-style blobs.
  const flat = stripTags(html).replace(/\s+/g, " ").trim();
  const tokens =
    flat.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}/g)?.map((t) => t.trim()) || [];
  for (let i = 0; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (!tok.includes("/")) continue;
    const date = tok;
    const nums = [];
    let j = i + 1;
    let steps = 0;
    while (nums.length < 5 && j < tokens.length && steps < 40) {
      const n = Number(tokens[j]);
      if (!Number.isNaN(n) && n >= MIN && n <= MAX) nums.push(n);
      j += 1;
      steps += 1;
    }
    if (nums.length !== 5) continue;
    const main = nums.slice(0, 4);
    const special = nums.slice(4, 5);
    const key = `${main.join("-")}|${special.join("-")}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    accumulator.push({ date, main, special });
  }
}

async function main() {
  const draws = [];
  const seen = new Set();

  async function fetchAndParse(url, label, parser = parseDraws) {
    console.log(`Fetching ${label}: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    parser(html, draws, seen);
  }

  // Primary source: official CSV (full history).
  await fetchAndParse(CSV_URL, "CSV full history", parseCsv);
  // Secondary (light) fallback: current page/dl page if CSV ever fails.
  if (draws.length === 0) {
    await fetchAndParse(TARGET_URL, "current page");
    await fetchAndParse(DOWNLOAD_URL, "download page (full history html)");
  }

  // Count occurrences (main vs bonus separately)
  const counts = {
    main: {},
    bonus: {},
  };
  for (const { main, special } of draws) {
    for (const m of main) {
      counts.main[m] = (counts.main[m] || 0) + 1;
    }
    for (const b of special) {
      counts.bonus[b] = (counts.bonus[b] || 0) + 1;
    }
  }

  const payload = {
    sourceUrl: TARGET_URL,
    downloadUrl: DOWNLOAD_URL,
    csvUrl: CSV_URL,
    updatedAt: new Date().toISOString(),
    totalDraws: draws.length,
    counts,
    draws,
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Saved ${draws.length} draws to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
