# Strategy: Texas Two Step (standard)

## Flow
1) Fetch (via proxy): call `/proxy.php?game=texas_two_step` to bypass CORS and get the HTML page.
2) Parse: read table rows; each draw = 4 main numbers (1–35) + 1 bonus (1–35).
3) Count: tally occurrences across all draws (separate main vs bonus).
4) Generate: apply threshold divisor (default 31) and build suggestion sets (default 5), using frequent or random selection.
5) Outputs: raw draws CSV, counts CSV, suggestions TXT/JSON (via downloads in the UI).

## Tips
- Ensure the proxy URL matches `VITE_PROXY_BASE` in `.env`.
- Keep selectors in `src/games/texas_two_step.js` aligned with the lottery site table structure; adjust if the HTML changes.
- If a draw row is partially missing numbers, skip or log it to avoid skewing counts.

## Defaults
- Main: 4 numbers, 1–35.
- Bonus: 1 number, 1–35.
- Threshold divisor: 31.
- Suggestion sets: 5.
