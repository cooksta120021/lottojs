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

const DEFAULT_DIVISOR = 31;
const DEFAULT_SETS = 5;
const DEFAULT_MODE = "highest"; // highest | lowest | random
const MODIFIED_GAME_KEY = "modified_2_step_beta";

export default function App() {
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
  const [tab, setTab] = useState("analyze"); // analyze | info
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
      game === MODIFIED_GAME_KEY || game === "texas_two_step" ? 4 : 5;
    const specialCount = 1;
    const { threshold: th, suggestions: sugg } = buildSuggestions(
      counts,
      totalDraws,
      thresholdDivisor,
      suggestionSets,
      {
        mode: game === MODIFIED_GAME_KEY ? frequencyMode : "random",
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
          Game Features
        </button>
      </div>

      {tab === "analyze" ? (
        <div className="stack">
          <div className="card">
            <Forms
              game={game}
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
          </div>

          <div className="card actions">
            <button className="btn primary" onClick={handleGenerate} disabled={busy || !draws.length}>
              Generate
            </button>
            {game === MODIFIED_GAME_KEY && (
              <>
                <button className="btn" onClick={downloadSuggestionsPdf} disabled={!suggestions.length}>
                  Download Suggestions (PDF)
                </button>
                <button
                  className="btn"
                  onClick={() => loadPoolsInput.current && loadPoolsInput.current.click()}
                >
                  Upload Pools (JSON)
                </button>
                <input
                  type="file"
                  accept="application/json"
                  ref={loadPoolsInput}
                  style={{ display: "none" }}
                  onChange={(e) => handleLoadPools(e.target.files?.[0])}
                />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <GameInfo />
        </div>
      )}
    </div>
  );
}
