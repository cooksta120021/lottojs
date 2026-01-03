import React, { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { fetchDrawHtml } from "./services/fetchDraws.js";
import { parseDraws } from "./services/parseDraws.js";
import { countFrequencies } from "./logic/counts.js";
import { buildSuggestions } from "./logic/suggestions.js";
import { downloadBlob } from "./components/Downloads.jsx";
import Forms from "./components/Forms.jsx";
import ResultsTable from "./components/ResultsTable.jsx";
import SuggestionsList from "./components/SuggestionsList.jsx";
import BetaPanel from "./components/BetaPanel.jsx";
import GameInfo from "./components/GameInfo.jsx";
import { parseModified2StepBeta } from "./games/texas/modified_2_step_beta.js";
import { useBetaPoolManager } from "./hooks/useBetaPoolManager.js";
import texasTwoStepData from "./games/texas/data/texas_two_step.json";
import { COUNTRIES, GAMES as GAME_CONFIG } from "./config/games.js";

const DEFAULT_DIVISOR = 31;
const DEFAULT_SETS = 5;
const DEFAULT_MODE = "highest"; // highest | lowest | random
const MODIFIED_GAME_KEY = "modified_2_step_beta";

export default function App() {
  const [country, setCountry] = useState("us");
  const [region, setRegion] = useState("tx");
  const [game, setGame] = useState("mega_millions");
  const [thresholdDivisor, setThresholdDivisor] = useState(DEFAULT_DIVISOR);
  const [suggestionSets, setSuggestionSets] = useState(DEFAULT_SETS);
  const [frequencyMode, setFrequencyMode] = useState(DEFAULT_MODE);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [draws, setDraws] = useState([]);
  const [totalDraws, setTotalDraws] = useState(0);
  const [counts, setCounts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [threshold, setThreshold] = useState(0);
  const [tab, setTab] = useState("analyze"); // analyze | info | guide
  const {
    uploadFiles,
    setUploadFiles,
    uploadResetKey,
    editablePools,
    setEditablePools,
    committedPools,
    ocrTexts,
    showOcrDebug,
    toggleOcrDebug,
    appendPending,
    applyEdits,
    downloadPoolsJson,
    handleLoadPools,
    resetAfterGenerate,
    clearNonBeta,
    loadPoolsInput,
  } = useBetaPoolManager();

  const busy = status === "loading";

  const recomputeCountsOnly = (drawArr, total, overrideMode) => {
    const freq = countFrequencies(drawArr);
    setCounts(freq);
    setThreshold(total / thresholdDivisor);
    setSuggestions([]); // clear until user clicks generate
  };

  const downloadSuggestionsPdf = () => {
    if (!suggestions.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Suggestions", 14, 16);
    let y = 26;
    suggestions.forEach((s, i) => {
      const line = `Set ${i + 1}: ${s.join(" ")}`;
      doc.text(line, 14, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`${game}_suggestions.pdf`);
  };

  const poolsToDraws = (pools) =>
    pools.map((p) => ({
      main: p.numbers.filter((n) => !Number.isNaN(n)),
      special: p.special || [],
    }));

  const handleAnalyze = async () => {
    setStatus("loading");
    setError("");
    try {
      let parsed;
      if (game === MODIFIED_GAME_KEY) {
        if (!uploadFiles.length) {
          throw new Error("Upload at least one image for modified game.");
        }
        parsed = await parseModified2StepBeta(uploadFiles);
        appendPending(parsed.draws, parsed.ocrTexts || []);
      } else if (game === "texas_two_step") {
        // Use bundled official data (no uploads).
        const { draws: officialDraws = [] } = texasTwoStepData;
        setDraws(officialDraws);
        setTotalDraws(officialDraws.length);
        recomputeCountsOnly(officialDraws, officialDraws.length, frequencyMode);
        clearNonBeta();
      } else if (game === "ph_lotto_2d") {
        // Local JSON for 2D Lotto (EZ2)
        parsed = parseDraws("", game);
        clearNonBeta();
        setDraws(parsed.draws);
        setTotalDraws(parsed.totalDraws);
        recomputeCountsOnly(parsed.draws, parsed.totalDraws, "random");
      } else {
        const html = await fetchDrawHtml(game);
        parsed = parseDraws(html, game);
        clearNonBeta();
        setDraws(parsed.draws);
        setTotalDraws(parsed.totalDraws);
        recomputeCountsOnly(parsed.draws, parsed.totalDraws, "random");
      }
      setStatus("analyzed");
    } catch (e) {
      setError(e.message || "Fetch failed");
      setStatus("idle");
    }
  };

  const handleGenerate = () => {
    if (!draws.length) {
      setError("Analyze first, then generate.");
      return;
    }
    const mainCount =
      game === MODIFIED_GAME_KEY || game === "texas_two_step"
        ? 4
        : game === "ph_lotto_2d"
        ? 2
        : game === "ph_swertres_3d"
        ? 3
        : 5;
    const specialCount =
      game === "ph_lotto_2d" || game === "ph_swertres_3d" ? 0 : 1;
    const { threshold: th, suggestions: sugg } = buildSuggestions(
      counts,
      totalDraws,
      thresholdDivisor,
      suggestionSets,
      {
        mode:
          game === MODIFIED_GAME_KEY || game === "texas_two_step"
            ? frequencyMode
            : "random",
        mainCount,
        specialCount,
      }
    );
    setThreshold(th);
    setSuggestions(sugg);
    setStatus("generated");
    if (game === MODIFIED_GAME_KEY) {
      setEditablePools([]);
      setDraws([]);
      setCounts([]);
      setTotalDraws(0);
      resetAfterGenerate();
    }
  };

  const handleApplyEdits = () => {
    if (game !== MODIFIED_GAME_KEY) return;
    const combinedPools = applyEdits();
    const currentDraws = poolsToDraws(combinedPools);
    setDraws(currentDraws);
    setTotalDraws(currentDraws.length);
    recomputeCountsOnly(currentDraws, currentDraws.length, frequencyMode);
  };

  const totalsLabel = useMemo(
    () =>
      totalDraws
        ? `Parsed ${totalDraws} draws. Threshold ≈ ${threshold.toFixed(2)}`
        : "",
    [totalDraws, threshold]
  );

  return (
    <div className="app-shell">
      <h1>LottoJS</h1>
      <div className="tabs">
        <button
          type="button"
          className="btn"
          onClick={() => setTab("analyze")}
          disabled={tab === "analyze"}
        >
          Analyzer
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setTab("info")}
          disabled={tab === "info"}
        >
          Game Guide
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setTab("guide")}
          disabled={tab === "guide"}
        >
          Guide
        </button>
      </div>

      {tab === "analyze" ? (
        <div className="stack">
          <div className="card">
            <Forms
              game={game}
              country={country}
              region={region}
              onCountryChange={(val) => {
                const nextCountry = val;
                const regions = Array.from(
                  new Set(GAME_CONFIG.filter((g) => g.country === nextCountry).map((g) => g.region))
                );
                const nextRegion = regions[0] || "";
                const games = GAME_CONFIG.filter(
                  (g) => g.country === nextCountry && g.region === nextRegion
                );
                const nextGame = games[0]?.value || game;
                setCountry(nextCountry);
                setRegion(nextRegion);
                setGame(nextGame);
              }}
              onRegionChange={(val) => {
                const games = GAME_CONFIG.filter(
                  (g) => g.country === country && g.region === val
                );
                const nextGame = games.find((g) => g.value === game)?.value || games[0]?.value || game;
                setRegion(val);
                setGame(nextGame);
              }}
              onGameChange={setGame}
              thresholdDivisor={thresholdDivisor}
              onThresholdDivisorChange={setThresholdDivisor}
              suggestionSets={suggestionSets}
              onSuggestionSetsChange={setSuggestionSets}
              frequencyMode={frequencyMode}
              onFrequencyModeChange={setFrequencyMode}
              onFilesChange={setUploadFiles}
              onAnalyze={handleAnalyze}
              busy={busy}
              enableUploads={game === MODIFIED_GAME_KEY}
              fileInputKey={uploadResetKey}
            />
            {status === "done" && totalsLabel && (
              <div className="pill" style={{ marginTop: "0.75rem" }}>
                {totalsLabel}
              </div>
            )}
            {error && <div className="alert">{error}</div>}
          </div>

          {game === MODIFIED_GAME_KEY && ocrTexts.length > 0 && (
            <div className="card ocr-box">
              <button
                className="btn"
                type="button"
                onClick={toggleOcrDebug}
                style={{ marginBottom: "0.5rem" }}
              >
                {showOcrDebug ? "Hide OCR text (debug)" : "Show OCR text (debug)"}
              </button>
              {showOcrDebug && <pre>{ocrTexts.join("\n----\n")}</pre>}
            </div>
          )}

          {game === MODIFIED_GAME_KEY && (
            <BetaPanel
              pendingPools={editablePools}
              committedPools={committedPools}
              onChangePending={setEditablePools}
              onApplyPending={handleApplyEdits}
              onDownloadPools={downloadPoolsJson}
              busy={busy}
            />
          )}

          <div className="card">
            <ResultsTable counts={counts} />
          </div>

          <div className="card">
            <SuggestionsList suggestions={suggestions} />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              <button className="btn" onClick={downloadSuggestionsPdf} disabled={!suggestions.length}>
                Download Suggestions (PDF)
              </button>
              {game === MODIFIED_GAME_KEY && (
                <>
                  <button className="btn" onClick={downloadPoolsJson} disabled={editablePools.length === 0}>
                    Download Pools (JSON)
                  </button>
                  <label className="btn" style={{ marginBottom: 0 }}>
                    Upload Pools (JSON)
                    <input
                      ref={loadPoolsInput}
                      type="file"
                      accept="application/json"
                      onChange={(e) => {
                        handleLoadPools(e.target.files?.[0]);
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="card actions">
            <button className="btn primary" onClick={handleGenerate} disabled={busy || !draws.length}>
              Generate
            </button>
          </div>
        </div>
      ) : tab === "info" ? (
        <div className="card">
          <GameInfo />
        </div>
      ) : (
        <div className="card">
          <h3>Guide</h3>
          <details open>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Threshold divisor (quick take)</summary>
            <p style={{ marginTop: "0.5rem" }}>
              A quick way to flag “strong” numbers. We divide total draws by this number; if a number meets that
              cutoff or higher, it’s strong. Bigger divisor = stricter. Smaller divisor = easier.
            </p>
            <ul>
              <li>Total draws 600, divisor 30 → cutoff 20. Seen 22 times = strong; 8 times = weak.</li>
              <li>Total draws 600, divisor 60 → cutoff 10. Seen 12 times = strong; 6 times = weak.</li>
              <li>Total draws 600, divisor 10 → cutoff 60. Only very frequent numbers (60+) pass.</li>
              <li>Raise divisor to tighten; lower to let more numbers through.</li>
            </ul>
          </details>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Analyze</summary>
            <p style={{ marginTop: "0.5rem" }}>
              Fetches/reads draws for the selected game, counts frequencies, and sets the threshold cutoff.
            </p>
          </details>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Generate</summary>
            <p style={{ marginTop: "0.5rem" }}>
              Builds suggestion sets using the counts and your threshold divisor. Adjust “Suggestion sets” to change how
              many sets you get.
            </p>
          </details>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Threshold divisor</summary>
            <p style={{ marginTop: "0.5rem" }}>
              We divide total draws by this number to decide if a number is “strong.” Bigger = stricter; smaller = easier.
              Pair it with Analyze/Generate for best results.
            </p>
          </details>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Suggestion sets</summary>
            <p style={{ marginTop: "0.5rem" }}>
              How many suggested number sets to produce on Generate. Increase to see more options.
            </p>
          </details>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Frequency mode</summary>
            <p style={{ marginTop: "0.5rem" }}>
              Chooses how we weight numbers: highest/lowest/random. Some games force random for variety.
            </p>
          </details>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Downloads</summary>
            <p style={{ marginTop: "0.5rem" }}>
              Download generated suggestions as PDF. For beta OCR, you can also download pools as JSON.
            </p>
          </details>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Uploads (Beta OCR only)</summary>
            <p style={{ marginTop: "0.5rem" }}>
              Upload ticket images for the modified 2-step beta. OCR reads numbers—always review/edit before generating.
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
