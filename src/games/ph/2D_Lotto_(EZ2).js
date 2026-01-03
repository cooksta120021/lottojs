import data from "./data/2D_Lotto_(EZ2).json";

export function parseLotto2D() {
  if (!data || !Array.isArray(data.draws)) {
    return { draws: [], totalDraws: 0, status: "NO_DATA" };
  }

  const counts =
    Array.isArray(data.counts) && data.counts.length
      ? data.counts
      : buildCounts(data.draws);

  return {
    source: data.source || "local",
    updatedAt: data.updatedAt || null,
    totalDraws: data.totalDraws || data.draws.length,
    counts,
    draws: data.draws,
    status: "OK",
  };
}

function buildCounts(draws) {
  const tally = {};
  for (const d of draws) {
    for (const n of d.main || []) {
      tally[n] = (tally[n] || 0) + 1;
    }
  }
  return Object.entries(tally)
    .map(([value, count]) => ({ category: "main", value: Number(value), count }))
    .sort((a, b) => b.count - a.count || a.value - b.value);
}
