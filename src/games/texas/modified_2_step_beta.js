import Tesseract from "tesseract.js";

const MIN_NUM = 1;
const MAX_NUM = 35; // Texas Two Step range for main and bonus

async function ocrImage(file) {
  const { data } = await Tesseract.recognize(file, "eng", {
    tessedit_char_whitelist: "0123456789",
  });
  return data.text || "";
}

function extractNumbers(text) {
  const matches = text.match(/\d+/g) || [];
  return matches
    .map((m) => Number(m))
    .filter((n) => !Number.isNaN(n) && n >= MIN_NUM && n <= MAX_NUM);
}

function normalizeToFive(nums) {
  const merged = [];
  let i = 0;
  while (i < nums.length && merged.length < 5) {
    const current = nums[i];
    const next = nums[i + 1];
    if (
      current < 10 &&
      Number.isInteger(next) &&
      next < 10 &&
      current * 10 + next <= MAX_NUM &&
      merged.length <= 3
    ) {
      merged.push(current * 10 + next);
      i += 2;
      continue;
    }
    merged.push(current);
    i += 1;
  }
  if (merged.length === 5) return merged;
  return null;
}

function normalizeDigits(str) {
  return str
    .replace(/\{O\}/gi, "")
    .replace(/\{OP\}/gi, " QP ")
    .replace(/\{COR\}/gi, " ")
    .replace(/[Oo]/g, "");
}

function chunkDigitsToFive(digits) {
  const clean = normalizeDigits(digits).replace(/\D+/g, "");
  const parts = [];
  for (let i = 0; i + 1 < clean.length && parts.length < 5; i += 2) {
    const val = Number(clean.slice(i, i + 2));
    if (val >= MIN_NUM && val <= MAX_NUM) parts.push(val);
  }
  return parts.length === 5 ? parts : null;
}

function extractNumberGroupsByLine(rawText) {
  const text = normalizeDigits(rawText);
  const groups = [];

  const pattern =
    /([A-E])\s*[.:]?\s+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})\D+(?:QP\D+)?(\d{1,2})(?:\D+QP)?/gi;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const numsRaw = match.slice(2, 7).map((n) => Number(n));
    const nums = normalizeToFive(numsRaw.filter((n) => n >= MIN_NUM && n <= MAX_NUM));
    if (nums && nums.length === 5) {
      const main = nums.slice(0, 4);
      const special = nums.slice(4, 5);
      groups.push({ main, special });
    }
  }

  if (!groups.length) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const playMatch = line.match(/^[A-E]/i);
      if (!playMatch) continue;
      const chunked = chunkDigitsToFive(line);
      if (chunked) {
        groups.push({ main: chunked.slice(0, 4), special: chunked.slice(4, 5) });
        continue;
      }
      const nums = extractNumbers(line);
      const normalized = normalizeToFive(nums);
      if (normalized) {
        const main = normalized.slice(0, 4);
        const special = normalized.slice(4, 5);
        groups.push({ main, special });
      }
    }
  }

  return groups;
}

export async function parseModified2StepBeta(files) {
  const pools = [];
  const ocrTexts = [];
  for (const f of files) {
    const text = await ocrImage(f);
    ocrTexts.push(text);
    const lineGroups = extractNumberGroupsByLine(text);
    if (lineGroups.length) {
      pools.push(...lineGroups);
    }
  }
  const draws = pools.map((entry) => ({
    main: entry.main || [],
    special: entry.special || [],
  }));
  return { draws, totalDraws: draws.length, ocrTexts };
}

export function parseModified2StepBetaText(rawText) {
  const lineGroups = extractNumberGroupsByLine(rawText);
  const draws = lineGroups.map((entry) => ({
    main: entry.main || [],
    special: entry.special || [],
  }));
  return { draws, totalDraws: draws.length };
}
