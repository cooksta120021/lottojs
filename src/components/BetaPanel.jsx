import React from "react";
import PoolEditor from "./PoolEditor.jsx";

export default function BetaPanel({
  pendingPools,
  committedPools,
  onChangePending,
  onApplyPending,
  onDownloadPools,
  busy,
}) {
  return (
    <>
      {pendingPools.length > 0 && (
        <div className="card">
          <h3>Pending edits (apply to add to pool)</h3>
          <PoolEditor
            pools={pendingPools}
            onChange={onChangePending}
            onApply={onApplyPending}
            busy={busy}
          />
        </div>
      )}

      {committedPools.length > 0 && (
        <div className="card card-dashed">
          <div className="note-warning">
            Current pool (committed). Generating will clear it; download first if needed.
          </div>
          <div className="pool-list">
            {committedPools.map((p, idx) => {
              const pad2 = (v) => v.toString().padStart(2, "0");
              return (
                <div key={idx}>
                  <strong>Set #{idx + 1}:</strong> {p.numbers.map(pad2).join(", ")} | Bonus:{" "}
                  {p.special && p.special.length ? pad2(p.special[0]) : "--"}
                </div>
              );
            })}
          </div>
          <div className="actions">
            <button className="btn" onClick={onDownloadPools} disabled={!committedPools.length}>
              Download Pools (JSON)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
