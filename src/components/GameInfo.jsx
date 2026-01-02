import React, { useMemo, useState } from "react";

const GAME_DATA = {
  TX: {
    texas_two_step: {
      name: "Texas Two Step",
      draws: "Mon & Thu",
      plays: "4 main numbers (1-35) + 1 Bonus (1-35)",
      quickPick: "QP generates both main and bonus; marked per play.",
      notes: "Jackpot starts at $200k; odds ~1 in 1.8M.",
    },
    mega_millions: {
      name: "Mega Millions",
      draws: "Tue & Fri",
      plays: "5 main numbers (1-70) + 1 Megaball (1-25)",
      quickPick: "QP covers main and Megaball unless you fill part manually.",
      notes: "Megaplier available; jackpots vary.",
    },
    modified_2_step_beta: {
      name: "Modified 2 Step (Beta OCR)",
      draws: "User-uploaded quick pick images",
      plays: "Extracted numbers only; edit before generating",
      quickPick: "Uses OCR to read printed quick-pick lines from images.",
      notes: "Beta feature; verify and edit extracted numbers before generate.",
    },
  },
};

const STATES = Object.keys(GAME_DATA);

export default function GameInfo() {
  const [state, setState] = useState("TX");

  const entries = useMemo(() => Object.entries(GAME_DATA[state] || {}), [state]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <label>
          State:&nbsp;
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
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
