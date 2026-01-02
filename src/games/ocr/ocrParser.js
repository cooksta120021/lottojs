import Tesseract from "tesseract.js";

const DEFAULT_PATTERN = /([A-E])\s*[.:]?\s+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})\D+(?:QP\D+)?(\d{1,2})(?:\D+QP)?/gi;

async function ocrImage(file) {
  const { data } = await Tesseract.recognize(file, "eng", {
    tessedit_char_whitelist: "0123456789",
  });
  return data.text || "";
}

function normalizeDigits(str) {
  return str
    .replace(/\{O\}/gi, "")
    .replace(/\{OP\}/gi, " QP ")
    .replace(/\{COR\}/gi, " ")
    .replace(/[Oo]/g, "");
}

function extractNumbers(text, minNum, maxNum) {
  const matches = text.match(/\d+/g) || [];
  return matches
    .map((m) => Number(m))
    .filter((n) => !Number.isNaN(n) && n >= minNum && n <= maxNum);
}

function normalizeToCount(nums, mainCount, bonusCount, maxNum) {
  const target = mainCount + bonusCount;
  const merged = [];
  let i = 0;
  while (i < nums.length && merged.length < target) {
    const current = nums[i];
    const next = nums[i + 1];
    if (
      current < 10 &&
      Number.isInteger(next) &&
      next < 10 &&
      current * 10 + next <= maxNum &&
      merged.length < mainCount
    ) {
      merged.push(current * 10 + next);
      i += 2;
      continue;
    }
    merged.push(current);
    i += 1;
  }
  if (merged.length === target) return merged;
  return null;
}

function chunkDigitsToSet(digits, mainCount, bonusCount, minNum, maxNum) {
  const clean = normalizeDigits(digits).replace(/\D+/g, "");
  const parts = [];
  for (let i = 0; i + 1 <= clean.length && parts.length < mainCount + bonusCount; i += 2) {
    const val = Number(clean.slice(i, i + 2));
    if (val >= minNum && val <= maxNum) parts.push(val);
  }
  return parts.length === mainCount + bonusCount ? parts : null;
}

function extractNumberGroupsByLine(rawText, options) {
  const {
    minNum = 1,
    maxNum = 35,
    mainCount = 4,
    bonusCount = 1,
    linePattern = DEFAULT_PATTERN,
    playLetters = /[A-E]/i,
    maxGroupsPerImage,
  } = options || {};

  const text = normalizeDigits(rawText);
  const groups = [];
  const seenLetters = new Set();

  const pattern = new RegExp(linePattern); // ensure fresh state if provided
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const letter = (match[1] || "").toUpperCase();
    if (letter && seenLetters.has(letter)) continue;
    const numsRaw = match.slice(2, 2 + mainCount + bonusCount).map((n) => Number(n));
    const nums = normalizeToCount(
      numsRaw.filter((n) => n >= minNum && n <= maxNum),
      mainCount,
      bonusCount,
      maxNum
    );
    if (nums && nums.length === mainCount + bonusCount) {
      if (letter) seenLetters.add(letter);
      const main = nums.slice(0, mainCount);
      const special = nums.slice(mainCount, mainCount + bonusCount);
      groups.push({ main, special });
      if (maxGroupsPerImage && groups.length >= maxGroupsPerImage) return groups;
    }
  }

  if (!groups.length) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (playLetters && !playLetters.test(line)) continue;
      const letter = line[0] ? line[0].toUpperCase() : "";
      if (letter && seenLetters.has(letter)) continue;
      const chunked = chunkDigitsToSet(line, mainCount, bonusCount, minNum, maxNum);
      if (chunked) {
        if (letter) seenLetters.add(letter);
        groups.push({ main: chunked.slice(0, mainCount), special: chunked.slice(mainCount) });
        if (maxGroupsPerImage && groups.length >= maxGroupsPerImage) return groups;
        continue;
      }
      const nums = extractNumbers(line, minNum, maxNum);
      const normalized = normalizeToCount(nums, mainCount, bonusCount, maxNum);
      if (normalized) {
        if (letter) seenLetters.add(letter);
        const main = normalized.slice(0, mainCount);
        const special = normalized.slice(mainCount);
        groups.push({ main, special });
        if (maxGroupsPerImage && groups.length >= maxGroupsPerImage) return groups;
      }
    }
  }

  return groups;
}

export async function parseOcrFiles(files, options) {
  const pools = [];
  const ocrTexts = [];
  for (const f of files) {
    const text = await ocrImage(f);
    ocrTexts.push(text);
    const lineGroups = extractNumberGroupsByLine(text, options);
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

export function parseOcrText(rawText, options) {
  const lineGroups = extractNumberGroupsByLine(rawText, options);
  const draws = lineGroups.map((entry) => ({
    main: entry.main || [],
    special: entry.special || [],
  }));
  return { draws, totalDraws: draws.length };
}

export function buildOcrOptions(overrides = {}) {
  return {
    minNum: 1,
    maxNum: 35,
    mainCount: 4,
    bonusCount: 1,
    linePattern: DEFAULT_PATTERN,
    playLetters: /[A-E]/i,
    ...overrides,
  };
}
