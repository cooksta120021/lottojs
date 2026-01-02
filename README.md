# LottoJS

React + Vite app for lottery analysis and OCR-assisted ticket capture. Supports fetching draw pages, counting frequencies, generating suggestion sets, and a beta OCR flow for Texas Two Step tickets.

## Features
- Fetch & parse draw pages (browser or proxy) for:
  - Mega Millions
  - Texas Two Step
- Beta OCR (Modified 2 Step) for photo uploads (Tesseract.js), edit-then-commit pools, JSON import/export, PDF suggestion export.
- Frequency counts + suggestion generation with configurable divisor/sets.
- Downloads: raw draws, counts, suggestions.
- Mobile-friendly upload with camera capture and re-upload of same file after edits.

### Texas game placeholders (under construction)
- Lotto Texas (TX)
- Powerball (TX)
- Cash Five (TX)
- Pick 3 (TX)
- Daily 4 (TX)
- All or Nothing (TX)
Selecting these shows an under-construction status; parsers are stubs in `src/games/texas/`.

## Tech stack
- React + Vite
- Tesseract.js for OCR
- jsPDF for suggestion PDF export
- Custom CSS (`src/styles.css`)

## Project structure (key parts)
- `src/App.jsx` — main UI wiring
- `src/components/` — forms, results, suggestions, beta panel, etc.
- `src/hooks/useBetaPoolManager.js` — beta OCR state/handlers
- `src/games/` — game parsers (Texas games under `src/games/texas/`)
- `src/services/` — fetch + parse dispatch
- `src/logic/` — counts and suggestion logic
- `strategies/` — per-game strategy docs

## OCR beta flow
1) Choose **Modified 2 Step (Beta OCR)**.
2) Upload ticket photo (camera allowed); analyze to OCR.
3) Pending edits: adjust numbers (leading zeros shown), then Apply Edits to commit.
4) Committed pool is read-only; generate suggestions, download PDF/JSON as needed.
5) File input resets after apply so the same file can be re-uploaded.

## Notes
- Leading zeros are display-only; values stored as numbers.
- Under-construction games return empty draws with status; they are listed in the dropdown for visibility.
