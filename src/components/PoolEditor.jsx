import React from "react";

export default function PoolEditor({ pools, onChange, onApply, busy }) {
  const updateNumber = (poolId, idx, value) => {
    const num = Number(value);
    const next = pools.map((p) =>
      p.id === poolId
        ? {
            ...p,
            numbers: p.numbers.map((n, i) => (i === idx ? num : n)),
          }
        : p
    );
    onChange(next);
  };

  const updateSpecial = (poolId, value) => {
    const num = Number(value);
    const next = pools.map((p) =>
      p.id === poolId
        ? {
            ...p,
            special: [num],
          }
        : p
    );
    onChange(next);
  };

  const addNumber = (poolId) => {
    const next = pools.map((p) =>
      p.id === poolId ? { ...p, numbers: [...p.numbers, 0] } : p
    );
    onChange(next);
  };

  const removeNumber = (poolId, idx) => {
    const next = pools.map((p) =>
      p.id === poolId
        ? { ...p, numbers: p.numbers.filter((_, i) => i !== idx) }
        : p
    );
    onChange(next);
  };

  const formatValue = (val) =>
    val === undefined || val === null || Number.isNaN(val) ? "" : val.toString().padStart(2, "0");

  if (!pools.length) return null;

  return (
    <div>
      <h3>Edit extracted numbers</h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {pools.map((pool) => (
          <div
            key={pool.id}
            style={{ border: "1px solid #ddd", padding: "0.75rem", borderRadius: "6px" }}
          >
            <strong>Image #{pool.id + 1}</strong>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {pool.numbers.map((n, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <input
                    type="text"
                    value={formatValue(n)}
                    onChange={(e) => updateNumber(pool.id, idx, e.target.value)}
                    disabled={busy}
                    style={{ width: "80px" }}
                  />
                  <button type="button" onClick={() => removeNumber(pool.id, idx)} disabled={busy}>
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addNumber(pool.id)} disabled={busy}>
                + Add
              </button>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                Bonus:
                <input
                  type="text"
                  value={
                    pool.special && pool.special.length && !Number.isNaN(pool.special[0])
                      ? formatValue(pool.special[0])
                      : ""
                  }
                  onChange={(e) => updateSpecial(pool.id, e.target.value)}
                  disabled={busy}
                  style={{ width: "80px" }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        style={{ marginTop: "0.75rem" }}
        onClick={onApply}
        disabled={busy}
      >
        Apply edits
      </button>
    </div>
  );
}
