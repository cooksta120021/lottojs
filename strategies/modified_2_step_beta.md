# Strategy: Modified 2 Step (Beta OCR)

## Flow
1) Upload: up to 5 ticket images; click **Analyze** (only available for the beta game).
2) OCR parse:
   - Targets play lines starting with A/B/C/… and expects 4 main + 1 bonus (range 1–35).
   - Ignores literal “O”; normalizes `{OP}` → `QP` and `{COR}` → separator.
   - Chunks squeezed digits (e.g., `01101824 31` → `01 10 18 24 | 31`) and merges split digits to reach exactly 5 numbers.
3) Preview/Edit:
   - Check extracted numbers in the Pool Editor.
   - You can edit main numbers and the special (bonus) number; click **Apply edits** to recompute counts.
4) Generate: after edits, click **Generate** to produce suggestion sets.

## Debugging
- OCR text is shown after Analyze (on the page and in console). If a line is misread, edit numbers before Generate.
- Parser returns all plays (A, B, C, …) found in the OCR text; each play is treated separately.
