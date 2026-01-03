import React from "react";
import { GAMES, COUNTRIES, REGION_LABELS } from "../config/games.js";

export default function Forms({
  game,
  country,
  region,
  onCountryChange,
  onRegionChange,
  onGameChange,
  thresholdDivisor,
  onThresholdDivisorChange,
  suggestionSets,
  onSuggestionSetsChange,
  frequencyMode,
  onFrequencyModeChange,
  onFilesChange,
  enableUploads = false,
  onAnalyze,
  busy,
  fileInputKey = 0,
}) {
  const availableRegions = Array.from(
    new Set(GAMES.filter((g) => g.country === country).map((g) => g.region))
  );
  const availableGames = GAMES.filter(
    (g) => g.country === country && g.region === region
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAnalyze();
      }}
      style={{
        display: "grid",
        gap: "0.75rem",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        marginBottom: "1rem",
      }}
    >
      <label style={{ display: "grid", gap: "0.35rem" }}>
        Country
        <select value={country} onChange={(e) => onCountryChange(e.target.value)} disabled={busy}>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: "0.35rem" }}>
        State/Region
        <select value={region} onChange={(e) => onRegionChange(e.target.value)} disabled={busy}>
          {availableRegions.map((r) => (
            <option key={r} value={r}>
              {REGION_LABELS[r] || r}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: "0.35rem" }}>
        Game
        <select
          value={game}
          onChange={(e) => onGameChange(e.target.value)}
          disabled={busy}
        >
          {availableGames.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>

      {!enableUploads && (
        <>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Threshold divisor
            <input
              type="number"
              min="1"
              value={thresholdDivisor}
              onChange={(e) => onThresholdDivisorChange(Math.max(1, Number(e.target.value)))}
              disabled={busy}
            />
            <small style={{ color: "#555" }}>
              We divide total draws by this number to get a cutoff. Bigger number = stricter. Smaller = easier.
            </small>
          </label>

          <label style={{ display: "grid", gap: "0.35rem" }}>
            Suggestion sets
            <input
              type="number"
              min="1"
              value={suggestionSets}
              onChange={(e) => onSuggestionSetsChange(Number(e.target.value))}
              disabled={busy}
            />
          </label>
        </>
      )}

      <label style={{ display: "grid", gap: "0.35rem" }}>
        Frequency mode
        <select
          value={frequencyMode}
          onChange={(e) => onFrequencyModeChange(e.target.value)}
          disabled={busy}
        >
          <option value="highest">Highest frequency</option>
          <option value="lowest">Lowest frequency</option>
          <option value="random">Random</option>
        </select>
      </label>

      {enableUploads && (
        <>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Upload ticket photo
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const first = e.target.files?.[0] ? [e.target.files[0]] : [];
                  onFilesChange(first);
                }}
                disabled={busy}
              />
          </label>
        </>
      )}

      <button type="submit" disabled={busy}>
        {busy ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}
