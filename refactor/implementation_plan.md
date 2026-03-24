Implementation plan
Phase 1 — Foundation (1–2 days)
1.1 Break up App.jsx
The current monolith makes every change risky. Extract:

src/hooks/useAuth.js — login, register, logout, token refresh, me state (currently spread across App.jsx)
src/hooks/useSearch.js — run(), data, loading, error, cepik, savedSearchId
src/hooks/useCepik.js — verifyGov(), cepikLoading, cepikErr
src/utils/carParser.js — fetchPage(), parseMd(), buildKvMap(), and all the regex helpers (currently ~400 lines at the top of App.jsx)
src/utils/normalize.js — normalizeDateForCepik(), normalizeVin(), normalizeLicensePlate(), formatFastApiDetail()

Keep App.jsx as pure layout composition — nothing but JSX and hook calls.
1.2 Replace auth modal with a persistent top bar
Currently auth requires: notice header pill → click History tab → modal appears. Instead, add a slim AuthBar component rendered unconditionally above everything:
jsx// src/components/AuthBar.jsx
// When logged out: shows email input + password + login/register buttons inline
// When logged in: shows email, "Historia" link, logout button
// No modal. No tab switch required.
Put history access in the top bar as a link/drawer toggle — not a tab that competes with the main analyze workflow.

Phase 2 — Result view redesign (2–3 days)
2.1 Car hero card
Replace the current 3-column CSS grid (which collapses poorly on mobile) with a card that has a full-width image area at the top and title/price info below. The photo becomes the hero, not a small thumbnail in a column. Add a score badge (green ✓ when verified, amber circle when unverified) as an absolute-positioned pill over the image.
2.2 Tabbed result layout
The current result shows everything simultaneously — specs grid, identity cards, description, gallery, CEPiK panel all stacked. Replace with tabs:

Specyfikacja (default) — the 12-spec grid + verification panel + sticky action bar
Zdjęcia — full-width gallery grid with lightbox
Opis — description text
Sprzedający — seller name, location, license plate

This removes ~300px of vertical scroll from the primary view and lets the verification panel be prominent on the first tab.
2.3 CEPiK badges inline in spec cells
Rather than a separate comparison table that appears after scrolling past everything, show verification results directly in each spec cell. A green ✓ or red ! next to the value gives instant feedback without needing a dedicated section. The full comparison table stays available in a collapsible "Szczegóły weryfikacji" below.

Phase 3 — Verification flow redesign (1–2 days)
3.1 Persistent verification panel on the Specyfikacja tab
Replace the scattered inline-edit pattern (click pencil → edit mode → save/cancel per field) with a single form section that's always visible at the bottom of the Specyfikacja tab. Three fields side by side: plate, VIN, date. Always in "input" state — no toggling. On mobile they stack vertically.
Mark each field with a subtle filled border when it has a value. The "Weryfikuj" button is disabled with a clear reason label ("Uzupełnij VIN →") rather than just being grayed out.
3.2 Step indicator
The three step dots in the verify panel header give visual progress: dot 1 = URL analyzed, dot 2 = plate/date found, dot 3 = VIN entered. This replaces the current FlowChecklist strip which lists 5 abstract steps and doesn't make the missing step obvious.
3.3 Auto-save on analyze
Currently the user must click "Zapisz w historii" as a separate action. Auto-save when analysis completes and the user is logged in — then show "Zapisano automatycznie" in the action bar footer. Manual save becomes a "Zapisz ponownie" option only shown if something changed.

Phase 4 — UX polish (1 day)
4.1 Sticky action bar
The current row of 5 equal-weight action buttons (print, JSON, open listing, save, verify) treats all actions as identical. Restructure as: secondary actions left (open listing, export JSON, print icon), spacer, status label right ("Zapisano automatycznie" or timestamp). Verification lives in the panel above — not in this bar.
4.2 History as a side drawer
Move history from a competing main tab to a slide-in drawer triggered from the auth bar. This preserves the single-task focus of the main view (analyze a listing) while keeping history accessible. The drawer shows the same list with edit/verify/delete actions.
4.3 Loading state
Replace the centered spinner + text with a skeleton UI — the car hero card shape, three spec rows, and the verify panel outline all pulsing. Users mentally "see" the result before it loads, which reduces perceived latency.
4.4 CEPiK result panel
The current result renders a raw comparison table. Replace with a score summary card at the top (e.g. "4 z 6 pól zgodnych"), then a clean list of field rows. Warnings get a red left border accent. OK rows get a subtle green tick. The odometer readings become a small mini-timeline, not a plain list.

Suggested implementation order
Start with 1.1 (the refactor) because every subsequent change is easier once App.jsx is broken up. Then 2.1 + 2.2 together because the car hero and tabs ship as one visual unit. Then 3.1 + 3.2 as the verification form. Then 1.2 (auth bar) since it's self-contained. Then 4.x as polish on top of the working structure.
The CSS in App.jsx (the ~600-line STYLES string) should be moved to proper CSS modules or a styles/ folder during 1.1 — it's the main reason new styles accumulate in unexpected places and specificity fights break things.