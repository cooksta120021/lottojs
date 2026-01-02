export function countFrequencies(draws) {
  const tally = new Map(); // key: `${category}:${value}` -> count

  draws.forEach((draw) => {
    draw.main.forEach((n) => {
      const key = `main:${n}`;
      tally.set(key, (tally.get(key) || 0) + 1);
    });
    draw.special.forEach((n) => {
      const key = `special:${n}`;
      tally.set(key, (tally.get(key) || 0) + 1);
    });
  });

  return Array.from(tally.entries()).map(([key, count]) => {
    const [category, value] = key.split(":");
    return { category, value: Number(value), count };
  });
}
