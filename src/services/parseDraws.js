// Dispatches to per-game parsers so each game lives in its own file.
import { parseMegaMillions } from "../games/mega_millions.js";
import { parseTexasTwoStep } from "../games/texas/texas_two_step.js";
import { parseLottoTexas } from "../games/texas/lotto_texas.js";
import { parsePowerball } from "../games/texas/powerball.js";
import { parseCashFive } from "../games/texas/cash_five.js";
import { parsePick3 } from "../games/texas/pick_3.js";
import { parseDaily4 } from "../games/texas/daily_4.js";
import { parseAllOrNothing } from "../games/texas/all_or_nothing.js";

const GAME_PARSERS = {
  mega_millions: parseMegaMillions,
  texas_two_step: parseTexasTwoStep,
  lotto_texas: parseLottoTexas,
  powerball: parsePowerball,
  cash_five: parseCashFive,
  pick_3: parsePick3,
  daily_4: parseDaily4,
  all_or_nothing: parseAllOrNothing,
};

export function parseDraws(html, gameKey) {
  const parser = GAME_PARSERS[gameKey];
  if (!parser) {
    throw new Error(`No parser found for ${gameKey}`);
  }
  const draws = parser(html);
  if (draws?.status === "UNDER_CONSTRUCTION") {
    return { draws: [], totalDraws: 0, status: "UNDER_CONSTRUCTION" };
  }
  const filtered = (draws || []).filter(
    (d) => d && Array.isArray(d.main) && d.main.length
  );
  return { draws: filtered, totalDraws: filtered.length };
}
