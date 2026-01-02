import React from "react";

const GAMES = [
  { value: "mega_millions", label: "Mega Millions" },
  { value: "texas_two_step", label: "Texas Two Step" },
  { value: "modified_2_step_beta", label: "Modified 2 Step (Beta OCR)" },
  { value: "lotto_texas", label: "Lotto Texas (TX)" },
  { value: "powerball", label: "Powerball (TX)" },
  { value: "cash_five", label: "Cash Five (TX)" },
  { value: "pick_3", label: "Pick 3 (TX)" },
  { value: "daily_4", label: "Daily 4 (TX)" },
  { value: "all_or_nothing", label: "All or Nothing (TX)" },
];

export default function Forms({
  game,
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
        Game
        <select
          value={game}
          onChange={(e) => onGameChange(e.target.value)}
          disabled={busy}
        >
          {GAMES.map((g) => (
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
              onChange={(e) => onThresholdDivisorChange(Number(e.target.value))}
              disabled={busy}
            />
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

      {enableUploads && (
        <>
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

          <label style={{ display: "grid", gap: "0.35rem" }}>
            Upload ticket photo
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              capture="environment"
              onClick={(e) => {
                // allow selecting the same file again
                e.target.value = "";
              }}
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
