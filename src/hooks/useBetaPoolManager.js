import { useState, useRef } from "react";
import { downloadBlob } from "../components/Downloads.jsx";

export function useBetaPoolManager() {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [editablePools, setEditablePools] = useState([]); // pending edits
  const [committedPools, setCommittedPools] = useState([]); // finalized pools
  const [ocrTexts, setOcrTexts] = useState([]);
  const [showOcrDebug, setShowOcrDebug] = useState(false);
  const loadPoolsInput = useRef(null);

  const toggleOcrDebug = () => setShowOcrDebug((s) => !s);

  const appendPending = (draws, ocrArr = []) => {
    setOcrTexts((prev) => [...prev, ...ocrArr]);
    const newPools = draws.map((d, idx) => ({ id: idx, numbers: d.main, special: d.special }));
    setEditablePools(newPools);
  };

  const applyEdits = () => {
    const combined = [...committedPools, ...editablePools];
    setCommittedPools(combined);
    setEditablePools([]);
    setUploadFiles([]);
    setUploadResetKey((k) => k + 1);
    return combined;
  };

  const downloadPoolsJson = () => {
    if (!committedPools.length) return;
    const payload = committedPools.map(({ numbers, special }) => ({ numbers, special }));
    downloadBlob(`modified_2_step_beta_pools.json`, JSON.stringify(payload, null, 2));
  };

  const handleLoadPools = (file) => {
    if (!file) return [];
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!Array.isArray(parsed)) throw new Error("Invalid pools file");
          const pools = parsed.map((p, idx) => ({
            id: idx,
            numbers: Array.isArray(p.numbers) ? p.numbers.map(Number) : [],
            special: Array.isArray(p.special) ? p.special.map(Number) : [],
          }));
          setCommittedPools(pools);
          setEditablePools([]);
          resolve(pools);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const resetAfterGenerate = () => {
    setEditablePools([]);
    setCommittedPools([]);
    setUploadFiles([]);
    setUploadResetKey((k) => k + 1);
    setOcrTexts([]);
  };

  const clearNonBeta = () => {
    setEditablePools([]);
    setCommittedPools([]);
    setUploadFiles([]);
    setUploadResetKey((k) => k + 1);
    setOcrTexts([]);
  };

  return {
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
  };
}
