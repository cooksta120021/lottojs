import { describe, it, expect } from "vitest";
import { parseModified2StepBetaText } from "../src/games/modified_2_step_beta.js";

describe("modified_2_step_beta parser", () => {
  it("parses play line with QP tokens", () => {
    const text = "A. 01 10 18 24 QP 31 QP";
    const { draws, totalDraws } = parseModified2StepBetaText(text);
    expect(totalDraws).toBe(1);
    expect(draws[0].main).toEqual([1, 10, 18, 24]);
    expect(draws[0].special).toEqual([31]);
  });

  it("keeps exact numbers from capitalized play line", () => {
    const text = "A. 01 10 18 24 QP 31 QP";
    const { draws } = parseModified2StepBetaText(text);
    expect(draws[0].main).toEqual([1, 10, 18, 24]);
    expect(draws[0].special).toEqual([31]);
  });

  it("parses play line without trailing QP", () => {
    const text = "B: 05 12 19 27 08";
    const { draws, totalDraws } = parseModified2StepBetaText(text);
    expect(totalDraws).toBe(1);
    expect(draws[0].main).toEqual([5, 12, 19, 27]);
    expect(draws[0].special).toEqual([8]);
  });

  it("ignores lines with fewer than 5 numbers", () => {
    const text = "C. 07 04 08 26";
    const { draws, totalDraws } = parseModified2StepBetaText(text);
    expect(totalDraws).toBe(0);
  });
});
