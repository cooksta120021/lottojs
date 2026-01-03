import fs from "fs";
import path from "path";

// Build a 2D Lotto (EZ2) dataset from Philnews (public page).

const OUTPUT = path.resolve("./src/games/ph/data/2D_Lotto_(EZ2).json");

const PHILNEWS_URL = "https://philnews.ph/pcso-lotto-result/ez2-result/";
const PROXY_BASE = process.env.PCSO_PROXY_BASE || process.env.VITE_PROXY_BASE || "";
const ALLOWED_TIMES = new Set(["02:00 PM", "05:00 PM", "09:00 PM"]);

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function normalizeTimeLabel(label) {
  const txt = label.replace(/\s+/g, " ").trim().toUpperCase();
  if (txt.includes("2:00")) return "02:00 PM";
  if (txt.includes("5:00")) return "05:00 PM";
  if (txt.includes("9:00")) return "09:00 PM";
  return "";
}

function parsePhilnewsBlocks(html) {
  const rows = [];
  const clean = html.replace(/\r?\n/g, " ");
  // Current draws (may be blank).
  const currentBlock = clean.match(/<table class="tablepress">([\s\S]*?)<\/table>/i);
  if (currentBlock) {
    const dateMatch = clean.match(/EZ2 RESULT Today[^<]*<label id="shortcode_date">([^<]+)<\/label>/i);
    const drawDate = dateMatch ? new Date(dateMatch[1]) : null;
    const dateIso = drawDate && !Number.isNaN(drawDate.getTime()) ? drawDate.toISOString().slice(0, 10) : null;
    const rowRe = /<tr[^>]*>\s*<td[^>]*>\s*<strong>([^<]+)<\/strong><\/td><td[^>]*>[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<\/td>\s*<\/tr>/gi;
    let m;
    while ((m = rowRe.exec(currentBlock[1]))) {
      const timeLabel = normalizeTimeLabel(m[1]);
      const nums = m[2].trim();
      if (!timeLabel || nums.includes("_") || nums.includes("-__")) continue;
      const parts = nums.split("-").map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));
      if (parts.length !== 2) continue;
      rows.push({
        date: dateIso || "",
        time: timeLabel,
        label: `2D Lotto ${timeLabel}`,
        main: parts,
        special: [],
      });
    }
  }
  // Yesterday block.
  const yBlockMatch = clean.match(/id="ez2_prev_draw">([\s\S]*?)<\/table>/i);
  if (yBlockMatch) {
    const yDateMatch = clean.match(/id="ez2_prev_date">([^<]+)<\/label>/i);
    const yDayDate = yDateMatch ? new Date(yDateMatch[1]) : null;
    const yDateIso = yDayDate && !Number.isNaN(yDayDate.getTime()) ? yDayDate.toISOString().slice(0, 10) : "";
    const rowRe = /<tr[^>]*>\s*<td[^>]*>\s*<strong>([^<]+)<\/strong>[^<]*<\/td><td[^>]*>\s*<center>\s*<strong>\s*([^<]+)\s*<\/strong>/gi;
    let m;
    while ((m = rowRe.exec(yBlockMatch[1]))) {
      const timeLabel = normalizeTimeLabel(m[1]);
      const nums = m[2].trim();
      const parts = nums.split("-").map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));
      if (!timeLabel || parts.length !== 2) continue;
      rows.push({
        date: yDateIso,
        time: timeLabel,
        label: `2D Lotto ${timeLabel}`,
        main: parts,
        special: [],
      });
    }
  }
  return rows;
}

async function fetchPhilnewsPage(page = 1) {
  const url = page === 1 ? PHILNEWS_URL : `${PHILNEWS_URL}page/${page}/`;
  const target = PROXY_BASE ? `${PROXY_BASE}?url=${encodeURIComponent(url)}` : url;
  const res = await fetch(target, {
    method: "GET",
    headers: { "User-Agent": "Mozilla/5.0", Referer: PHILNEWS_URL },
  });
  if (!res.ok) throw new Error(`Philnews fetch failed: ${res.status}`);
  const html = await res.text();
  return parsePhilnewsBlocks(html);
}

async function fetchPhilnewsAll(maxPages = 400) {
  const all = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const rows = await fetchPhilnewsPage(page);
    if (!rows.length) break;
    all.push(...rows);
  }
  return all;
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
  let draws = [];
  const perGame = await fetchPhilnewsAll();
  const seen = new Set();
  for (const d of perGame) {
    const key = `${d.date}|${d.time}|${d.main.join("-")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    draws.push(d);
  }
  draws.sort((a, b) => (a.date === b.date ? (a.time > b.time ? -1 : 1) : a.date > b.date ? -1 : 1));
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
