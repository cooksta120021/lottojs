import { buildOcrOptions, parseOcrFiles, parseOcrText } from "../ocr/ocrParser.js";

const OCR_OPTIONS = buildOcrOptions({
  minNum: 1,
  maxNum: 35,
  mainCount: 4,
  bonusCount: 1,
  playLetters: /^[A-K]/i,
  maxGroupsPerImage: 10,
});

export async function parseModified2StepBeta(files) {
  return parseOcrFiles(files, OCR_OPTIONS);
}

export function parseModified2StepBetaText(rawText) {
  return parseOcrText(rawText, OCR_OPTIONS);
}
