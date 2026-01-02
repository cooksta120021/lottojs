## LottoJS React Project Overview

Goal: Build a React (JavaScript/TypeScript) web app that fetches Texas Lottery draw pages, parses results, computes frequencies, and generates suggestion sets—no Python runtime required.

### Features
- Fetch draw pages (Mega Millions, Texas Two Step).
- Parse draw rows into structured data.
- Count number frequencies (main + special balls).
- Compute a threshold (total_draws / divisor) to flag “frequent” numbers.
- Generate N suggestion sets from frequent numbers.
- Let users view and download outputs (CSV/TXT).

### UI flow
1) **Home / Input**
   - Select game (Mega Millions, Texas Two Step).
   - Adjust threshold divisor (default 31).
   - Adjust number of suggestion sets (default 5).
   - Actions: “Fetch & Analyze”, “Download Outputs”.
2) **Results**
   - Table of counts (number, category, count).
   - Suggestion sets.
   - Status/loading/error messages.

### Data flow (React/JS)
1) Fetch HTML via `fetch`/`axios`.
2) Parse DOM (browser `DOMParser`) to extract draw rows.
   - If CORS blocks browser fetch, route through a tiny proxy (e.g., Next.js API route / Express endpoint) and reuse the parser there with `cheerio`.
3) Build arrays of draws; accumulate counts per number/special.
4) Compute threshold = total_draws / divisor.
5) Select frequent numbers; assemble suggestion sets.
6) Offer downloads (CSV/TXT) using `Blob` + `URL.createObjectURL`.

### Modules (front-end)
- `services/fetchDraws.js`: fetch and return raw HTML/text (swap implementation for proxy vs direct).
- `services/parseDraws.js`: parse HTML into structured draws (pure functions).
- `logic/counts.js`: compute frequency tables.
- `logic/suggestions.js`: build suggestion sets from frequent numbers.
- Components: `Forms`, `ResultsTable`, `SuggestionsList`, `Downloads` (props-driven, stateless where possible).

### CORS / hosting
- Direct browser fetch may be blocked by texaslottery.com. Preferred: server-side fetch via proxy (Node/Express or Next.js API route) and return JSON. Keep parser shared between client and server.

### Downloads / output formats
- Raw draws: CSV download.
- Counts: CSV download.
- Suggestions: TXT/JSON download.

## Vite-based project setup (frontend only)

- Prereqs: Node LTS, npm/yarn/pnpm.
- Init: `npm create vite@latest lottojs -- --template react` (or `react-ts`).
- Install deps (examples): `npm i axios` (for fetch) — keep it minimal.
- Dev: `npm run dev`; Build: `npm run build`; Preview: `npm run preview`.
- Env file: `VITE_PROXY_BASE=https://yourdomain.com/proxy.php` (or your worker/Netlify URL).

### Suggested directory layout (Vite)
```
src/
  services/
    fetchDraws.js      # calls PHP proxy
    parseDraws.js      # DOM parsing helpers (pure)
  logic/
    counts.js          # frequency tallies
    suggestions.js     # suggestion assembly
  components/
    Forms.jsx
    ResultsTable.jsx
    SuggestionsList.jsx
    Downloads.jsx
  App.jsx
```

### PHP proxy for shared hosting (handles CORS)
Save as `proxy.php` on your host (same origin as your site):
```php
<?php
header('Content-Type: text/plain; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$game = $_GET['game'] ?? '';
$urls = [
  'mega_millions' => 'https://www.texaslottery.com/export/sites/lottery/Games/Mega_Millions/Winning_Numbers/index.html_1894996477.html',
  'texas_two_step' => 'https://www.texaslottery.com/export/sites/lottery/Games/Texas_Two_Step/Winning_Numbers/index.html'
];

if (!isset($urls[$game])) { http_response_code(400); echo "Invalid game"; exit; }

$ctx = stream_context_create([
  'http' => [
    'method' => 'GET',
    'header' => [
      'User-Agent: LottoJS/1.0',
      'Accept: text/html'
    ],
    'timeout' => 10
  ]
]);

$html = @file_get_contents($urls[$game], false, $ctx);
if ($html === false) { http_response_code(502); echo "Upstream fetch failed"; exit; }
echo $html;
```
- Deploy it at `https://yourdomain.com/proxy.php`.

### Frontend service stubs (Vite)
`src/services/fetchDraws.js`
```js
const PROXY_BASE = import.meta.env.VITE_PROXY_BASE;

export async function fetchDrawHtml(gameKey) {
  const res = await fetch(`${PROXY_BASE}?game=${encodeURIComponent(gameKey)}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.text();
}
```

`src/services/parseDraws.js` (skeleton; implement selectors per game)
```js
export function parseDraws(html, gameKey) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // TODO: select table rows per game and return structured draws
  // return { draws, totalDraws };
  return { draws: [], totalDraws: 0 };
}
```

`src/logic/counts.js`
```js
export function countFrequencies(draws) {
  // Implement counting of main + special numbers; return array of {category,value,count}
  return [];
}
```

`src/logic/suggestions.js`
```js
export function buildSuggestions(counts, totalDraws, thresholdDivisor = 31, sets = 5) {
  const threshold = totalDraws / thresholdDivisor;
  // Select frequent numbers and assemble suggestion sets
  return { threshold, suggestions: [] };
}
```

`src/components/Downloads.jsx` (CSV/TXT download helper)
```jsx
export function downloadBlob(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

### Wiring the UI (App.jsx outline)
- Form: select game, threshold divisor, suggestion set count; button “Fetch & Analyze”.
- On submit: `fetchDrawHtml` -> `parseDraws` -> `countFrequencies` -> `buildSuggestions`.
- Show counts table and suggestion sets.
- Downloads: use `downloadBlob` for raw draws CSV, counts CSV, suggestions TXT/JSON.

### Defaults (match prior logic)
- threshold_divisor: 31
- suggestion_sets: 5
- Games: mega_millions, texas_two_step

### Implementation checklist
- Recreate scrape selectors for both games.
- Match threshold math (total_draws / divisor).
- Match suggestion assembly rules (frequent-number driven).
- Wire “Fetch & Analyze” -> fetch + parse + count + suggestions.
- Wire downloads via Blob for CSV/TXT.

### Stretch ideas
- Add client-side image OCR upload for ticket number extraction (e.g., `tesseract.js`) as an optional feature.
- Add caching of last fetch in localStorage.

## Adding a new game (modular parsers)

1) Proxy URL: add the game’s upstream URL to `proxy.php` (server-side) keyed by the new `game` value.
2) Parser file: create `src/games/<game_key>.js` exporting `parse<PascalName>` that returns `{ main: number[], special: number[] }[]`.
3) Register parser: import and add it to `GAME_PARSERS` in `src/services/parseDraws.js`.
4) UI option: add the game to the `GAMES` array in `src/components/Forms.jsx` so it appears in the dropdown.
5) Defaults (if needed): adjust any game-specific logic or validation in the UI.
6) Fetch config: ensure `VITE_PROXY_BASE` points to a proxy that accepts the new `game` key.

Parser tips:
- Use `DOMParser` selectors tailored to that game’s table/markup.
- Return empty arrays for missing numbers; the pipeline will filter empty draws.
