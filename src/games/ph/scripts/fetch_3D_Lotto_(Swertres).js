import fs from "fs";
import path from "path";

// Build a 3D Lotto (Swertres) dataset from Philnews history.

const OUTPUT = path.resolve("./src/games/ph/data/3D_Lotto_(Swertres).json");
const PHILNEWS_URL =
  "https://philnews.ph/pcso-lotto-result/swertres-result-history-summary/";
const PROXY_BASE = process.env.PCSO_PROXY_BASE || process.env.VITE_PROXY_BASE || "";
const ALLOWED_TIMES = ["02:00 PM", "05:00 PM", "09:00 PM"];

function stripTags(txt) {
  return txt.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function toIsoDate(raw) {
  const dt = new Date(stripTags(raw));
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function parseMain(val) {
  const clean = val.replace(/\s+/g, "");
  const parts = clean.includes("-") ? clean.split("-") : clean.split("");
  if (parts.length !== 3) return null;
  const nums = parts.map((n) => Number(n));
  return nums.some((n) => Number.isNaN(n)) ? null : nums;
}

function parseTable(html) {
  const rows = [];
  const clean = html.replace(/\r?\n/g, " ");
  const tableMatch = clean.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return rows;
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr;
  while ((tr = trRe.exec(tableMatch[1]))) {
    const cells = [];
    const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let td;
    while ((td = tdRe.exec(tr[1]))) {
      cells.push(stripTags(td[1]));
    }
    if (!cells.length) continue;
    const dateIso = toIsoDate(cells[0]);
    if (!dateIso) continue;
    for (let i = 1; i < cells.length && i <= 3; i += 1) {
      const main = parseMain(cells[i]);
      if (!main) continue;
      const time = ALLOWED_TIMES[i - 1];
      rows.push({
        date: dateIso,
        time,
        label: `3D Lotto ${time}`,
        main,
        special: [],
      });
    }
  }
  return rows;
}

async function fetchPhilnews() {
  const target = PROXY_BASE ? `${PROXY_BASE}?url=${encodeURIComponent(PHILNEWS_URL)}` : PHILNEWS_URL;
  const res = await fetch(target, {
    method: "GET",
    headers: { "User-Agent": "Mozilla/5.0", Referer: PHILNEWS_URL },
  });
  if (!res.ok) throw new Error(`Philnews fetch failed: ${res.status}`);
  const html = await res.text();
  return parseTable(html);
}

function buildCounts(draws) {
  const counts = {};
  for (const d of draws) {
    for (const n of d.main) {
      counts[n] = (counts[n] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ category: "main", value: Number(value), count }))
    .sort((a, b) => b.count - a.count || a.value - b.value);
}

async function main() {
  let draws = await fetchPhilnews();
  const seen = new Set();
  const deduped = [];
  for (const d of draws) {
    const key = `${d.date}|${d.time}|${d.main.join("-")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(d);
  }
  draws = deduped.sort((a, b) =>
    a.date === b.date ? (a.time > b.time ? -1 : 1) : a.date > b.date ? -1 : 1
  );
  console.log(`Fetched ${draws.length} draws from Philnews`);

  const payload = {
    source: PHILNEWS_URL,
    updatedAt: new Date().toISOString(),
    totalDraws: draws.length,
    counts: buildCounts(draws),
    draws,
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Saved ${draws.length} draws to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
