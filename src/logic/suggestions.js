function pickByMode(counts, threshold, mode) {
  const filtered = counts.filter((c) => c.count >= threshold);
  const byCategory = filtered.reduce(
    (acc, c) => {
      acc[c.category].push(c);
      return acc;
    },
    { main: [], special: [] }
  );

  const sorters = {
    highest: (a, b) => b.count - a.count,
    lowest: (a, b) => a.count - b.count,
    random: () => Math.random() - 0.5,
  };

  const sorter = sorters[mode] || sorters.random;

  return {
    main: byCategory.main.sort(sorter).map((c) => c.value),
    special: byCategory.special.sort(sorter).map((c) => c.value),
  };
}

export function buildSuggestions(
  counts,
  totalDraws,
  thresholdDivisor = 31,
  sets = 5,
  options = {}
) {
  const threshold = totalDraws / thresholdDivisor;
  const mode = options.mode || "random"; // highest | lowest | random
  const mainCount = options.mainCount ?? 5;
  const specialCount = options.specialCount ?? 1;

  const frequent = pickByMode(counts, threshold, mode);

  const randomPick = (arr, size) => {
    const copy = [...arr];
    const result = [];
    while (result.length < size && copy.length) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  };

  const suggestions = [];
  const seen = new Set();
  let attempts = 0;
  const maxAttempts = sets * 50; // generous cap to avoid infinite loops
  while (suggestions.length < sets && attempts < maxAttempts) {
    attempts += 1;
    const mains = randomPick(frequent.main, mainCount);
    const specials = randomPick(frequent.special, specialCount);
    if (mains.length !== mainCount || specials.length !== specialCount) continue;
    const key = `${mains.join("-")}|${specials.join("-")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push([...mains, ...specials]);
  }

  return { threshold, suggestions };
}
