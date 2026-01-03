import React, { useMemo, useState } from "react";
import { COUNTRIES, REGION_LABELS } from "../config/games.js";

const GAME_DATA = {
  us: {
    tx: {
      mega_millions: {
        name: "Mega Millions (in-progress)",
        draws: "Tue & Fri",
        plays: "Pick 5 numbers (1-70) + 1 Megaball (1-25).",
        quickPick: "QP fills all six slots; you can edit before play.",
        notes: "Megaplier bumps non-jackpot prizes; jackpots vary.",
      },
      texas_two_step: {
        name: "Texas Two Step",
        draws: "Mon & Thu",
        plays: "Pick 4 numbers (1-35) + 1 Bonus (1-35).",
        quickPick: "QP covers both main and bonus.",
        notes: "Jackpot starts ~$200k; odds ~1 in 1.8M.",
      },
      modified_2_step_beta: {
        name: "Modified 2 Step (Beta OCR)",
        draws: "Upload your ticket image",
        plays: "We read printed numbers via OCR; edit before generating suggestions.",
        quickPick: "Not applicable (user uploads).",
        notes: "Beta—double-check numbers after OCR.",
      },
    },
  },
  ph: {
    capoocan_leyte: {
      ph_swertres_3d: {
        name: "3D Lotto (Swertres)",
        draws: "Daily 2PM / 5PM / 9PM",
        plays: "Pick any 3 digits (000–999). Each digit is 0–9; repeats/doubles/triples allowed. Order matters.",
        quickPick: "QP gives a random 3-digit combo.",
        notes: "Exact match wins the top prize.",
      },
      ph_lotto_2d: {
        name: "2D Lotto (EZ2)",
        draws: "Daily 2PM / 5PM / 9PM",
        plays: "Pick any 2 digits (00–99). Each digit is 0–9; repeats/doubles allowed. Order matters.",
        quickPick: "QP gives a random 2-digit combo.",
        notes: "Exact order match wins.",
      },
      ph_ultra_6_58: {
        name: "Ultra Lotto 6/58 (in-progress)",
        draws: "Tue / Fri / Sun",
        plays: "Pick 6 numbers from 1–58.",
        quickPick: "QP fills all six numbers.",
        notes: "Jackpot grows; hitting all 6 wins.",
      },
      ph_grand_6_55: {
        name: "Grand Lotto 6/55 (in-progress)",
        draws: "Mon / Wed / Sat",
        plays: "Pick 6 numbers from 1–55.",
        quickPick: "QP fills all six numbers.",
        notes: "Match all 6 to win the jackpot.",
      },
      ph_super_6_49: {
        name: "Super Lotto 6/49 (in-progress)",
        draws: "Tue / Thu / Sun",
        plays: "Pick 6 numbers from 1–49.",
        quickPick: "QP fills all six numbers.",
        notes: "Match all 6 to win the jackpot.",
      },
      ph_mega_6_45: {
        name: "Mega Lotto 6/45 (in-progress)",
        draws: "Mon / Wed / Fri",
        plays: "Pick 6 numbers from 1–45.",
        quickPick: "QP fills all six numbers.",
        notes: "Match all 6 to win the jackpot.",
      },
      ph_lotto_6_42: {
        name: "Lotto 6/42 (in-progress)",
        draws: "Tue / Thu / Sat",
        plays: "Pick 6 numbers from 1–42.",
        quickPick: "QP fills all six numbers.",
        notes: "Match all 6 to win the jackpot.",
      },
      ph_6d: {
        name: "6 Digit Game (in-progress)",
        draws: "Select days",
        plays: "Pick 6 digits; exact order pays best.",
        quickPick: "QP gives a 6-digit combo.",
        notes: "Prizes vary by exact/partial match.",
      },
      ph_4d: {
        name: "4 Digit Game (in-progress)",
        draws: "Select days",
        plays: "Pick 4 digits; exact order pays best.",
        quickPick: "QP gives a 4-digit combo.",
        notes: "Prizes vary by exact/partial match.",
      },
      ph_stl_pares: {
        name: "STL Pares (in-progress)",
        draws: "Local STL schedules",
        plays: "Pick 2 numbers (1–40).",
        quickPick: "QP fills both numbers.",
        notes: "Exact match wins.",
      },
      ph_stl_swer2: {
        name: "STL Swer2 (in-progress)",
        draws: "Local STL schedules",
        plays: "Pick 2 digits (00–99), order matters.",
        quickPick: "QP gives 2 digits.",
        notes: "Exact order match wins.",
      },
      ph_stl_swer3: {
        name: "STL Swer3 (in-progress)",
        draws: "Local STL schedules",
        plays: "Pick 3 digits (000–999), order matters.",
        quickPick: "QP gives 3 digits.",
        notes: "Exact order match wins.",
      },
      ph_stl_swer4: {
        name: "STL Swer4 (in-progress)",
        draws: "Local STL schedules",
        plays: "Pick 4 digits (0000–9999), order matters.",
        quickPick: "QP gives 4 digits.",
        notes: "Exact order match wins.",
      },
    },
  },
};

const COUNTRIES_MAP = COUNTRIES.reduce((acc, c) => {
  acc[c.value] = c.label;
  return acc;
}, {});

const REGION_MAP = REGION_LABELS;

export default function GameInfo() {
  const [country, setCountry] = useState("us");
  const [region, setRegion] = useState("tx");

  const regions = useMemo(() => Object.keys(GAME_DATA[country] || {}), [country]);
  const entries = useMemo(
    () => Object.entries(GAME_DATA[country]?.[region] || {}),
    [country, region]
  );

  const handleCountryChange = (nextCountry) => {
    setCountry(nextCountry);
    const nextRegions = Object.keys(GAME_DATA[nextCountry] || {});
    if (!nextRegions.includes(region)) {
      setRegion(nextRegions[0] || "");
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <label>
          Country:&nbsp;
          <select value={country} onChange={(e) => handleCountryChange(e.target.value)}>
            {Object.keys(GAME_DATA).map((c) => (
              <option key={c} value={c}>
                {COUNTRIES_MAP[c] || c.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label>
          Region:&nbsp;
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map((r) => (
              <option key={r} value={r}>
                {REGION_MAP[r] || r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {entries.map(([key, game]) => (
          <div
            key={key}
            style={{ border: "1px solid #eee", borderRadius: "6px", padding: "0.75rem" }}
          >
            <h4 style={{ margin: "0 0 0.25rem 0" }}>{game.name}</h4>
            <div><strong>Draws:</strong> {game.draws}</div>
            <div><strong>Plays:</strong> {game.plays}</div>
            <div><strong>Quick Pick:</strong> {game.quickPick}</div>
            <div><strong>Notes:</strong> {game.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
