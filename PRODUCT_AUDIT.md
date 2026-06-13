# JMind Product Audit — 2026-06-11

Deep audit + improvement pass performed in "founding engineer mode". This file records what was found, what was changed and why, and what should happen next. Read alongside `PROJECT_CONTEXT.md` and `PRODUCT_STRATEGY.md` (the strategic compass — read that first for *why* decisions were made).

> **Update (MVP readiness push, same day):** the top three "remaining weaknesses" below have shipped — see [MVP readiness push](#mvp-readiness-push--2026-06-11) at the end of this file for what changed and the new backlog.

## TL;DR

The architecture was healthy (feature folders, persisted stores, sanitization, service layer) but the app was **broken at runtime** by a zustand v5 selector bug, rendered in **Arial** because no font was ever loaded, and the canvas — the heart of the product — was letterboxed, cluttered, and re-rendered every node on every drag frame. All of that is fixed. The product now has one coherent interaction story on the canvas: double-click to create, Tab to branch, Enter to rename, Delete to remove, F to fit, I for details.

## Critical defects found (all fixed)

1. **Infinite render loop, app unusable** — `useFocus` in `src/stores/use-focus-store.ts` returned a fresh object literal from its selector. zustand v5 uses the selector result as React's `getSnapshot`, so every render produced a "new" snapshot → `Maximum update depth exceeded`, hung renderer. Used by `LayoutShell`, so every page died. *Fix: `useShallow`.*
2. **Typography never loaded** — `--font-sans` referenced Inter/Geist but neither was imported; the whole app fell back to Arial. *Fix: `next/font/google` Inter wired through the Tailwind theme.*
3. **Canvas O(all-nodes) per drag frame** — `onNodesChange` ran `sanitizeNodes`/`sanitizeEdges` on every change, recreating every node's `data` object and defeating React Flow's memoization. *Fix: change handlers are now pure `applyNodeChanges`/`applyEdgeChanges`; sanitization runs only at the persistence boundary (`partialize`/`merge`), which is where untrusted data actually enters.*
4. **Latent build break** — the mindmap store's interface declared `toggleFocus`/`focusedNodeId` that were never implemented. *Fix: removed.*

## UX changes and reasoning

- **Canvas is now a full-bleed workspace** (`/mindmap`): fills everything under the topbar, no page scroll, no card frame. The canvas is the product; it gets the room.
- **Keyboard story that actually works**, handled at the flow wrapper against the selected node (not dependent on DOM focus quirks): `Tab` child node (or branch from root), `Enter` rename, `Delete`/`Backspace` remove (root protected), `F` fit view, `Shift+T` tidy + fit, `I` details panel, `Esc` deselect. Double-click on empty canvas creates a node at the cursor. Every creation path drops straight into typing mode.
- **Details panel opens on demand** (toolbar toggle, `I`, or context menu), overlays only the canvas edge, and follows selection while open. Previously every click — including drag-starts — slid a 384px panel over the canvas, and `onNodesChange` re-forced it open.
- **Deterministic child placement** — children fan out alternating above/below the parent instead of random ±50px offsets that overlapped siblings.
- **Edges are visible and calm** — one CSS source of truth via React Flow's `--xy-*` theme variables (zinc 50% @ 2px, emerald when selected); per-edge inline styles and `animated: true` marching ants removed, old persisted edges normalized on load. Handles hidden until hover/selection.
- **Overlay declutter** — brand chip, always-on legend card and always-on shortcut card removed; legend + shortcuts merged into one `?` popover; minimap only appears past 4 nodes; first-run viewport fits the map instead of pinning the root to the corner.
- **Honest UI** — removed: fake `+12%` trends on dashboard stats, dead notification bell with fake unread dot, dead avatar, dead profile kebab, footer brand banner. The FAB no longer pretends to create things ("New Task" → navigation); it is now a single Quick Capture button (same as `Ctrl+J`), hidden on the canvas.
- **Navigation feels faster** — route transitions are enter-only (~180ms); the old `AnimatePresence mode="wait"` doubled perceived latency and remounted the page tree (including on deep-work toggle, which was keyed into the route transition).
- **Deep Work is a real focus screen** — solid backdrop, calm copy, palette/capture still reachable above it. Previously the HUD floated text over still-visible page content with a dead "exit" block and 1s transitions.
- **Command palette keyboard nav is real** — ↑/↓/Enter operate on exactly the rendered list (the footer previously advertised navigation that didn't exist; Enter mid-search silently created a task).

## Architecture notes

- Activity logging moved out of `set()` reducers (tasks, mindmap) — side effects no longer run inside state transitions.
- Edge creation centralized in `MindMapService` (`createEdge`, `connect`), styling owned by `globals.css`.
- `react-hooks/set-state-in-effect` violations resolved with derived state / guarded render adjustments rather than disables.
- `lint`, `tsc --noEmit`, and `next build` all pass clean as of this audit.

## Known remaining weaknesses (deliberate, ordered)

1. **No undo on the canvas** — Delete is guarded only by selection; an undo stack (even 10 steps) is the highest-value canvas addition left.
2. **Multi-tab clobbering** — zustand-persist is last-writer-wins across tabs; two open tabs can overwrite each other's mind map. Fine for MVP, worth a `storage` event listener later.
3. **Dashboard density** — still 10+ modules; recommend a future pass that collapses Wisdom/Pulse/Stats into a single adaptive strip and lets Today's Focus lead.
4. **Node text editing is single-line** — fine for idea labels; descriptions live in the details panel.
5. **Tidy layout is simple** — straight tree layout; fine until maps get cross-links.
6. **Touch** — canvas is touchpad-friendly but pinch/touch interactions on mobile are untested.

## Dev environment gotchas (Windows / Next 16 / Turbopack)

- **Never run `next build` while the dev server is running** — they share `.next` and the dev session corrupts (unrecoverable-error reloads, dead event handlers).
- Turbopack's persistent cache can serve stale CSS/JS after rapid edits; fix is stop server → delete `.next` → restart.

---

# MVP readiness push — 2026-06-11

Second pass the same day, focused on "good enough to hand to a real person". Verified live end-to-end (fresh workspace → first task → populated dashboard), plus `eslint` / `tsc` / `next build` all clean.

## Shipped

1. **Undo/redo on the canvas** — Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, plus toolbar buttons with disabled states. History entries are cheap reference snapshots of `{nodes, edges}`; drags record exactly one step per gesture (`onNodeDragStart`), per-keystroke edits from the details panel coalesce into one step per second of typing, capped at 50 steps, per-tab only (not persisted). Known limit: undoing "Convert to Task" restores the node's state but doesn't delete the created task.
2. **Cross-tab sync** — `storage`-event listener rehydrates whichever store another tab wrote (`src/lib/cross-tab-sync.ts`). The mindmap `merge` now preserves the local tab's selection, panel and viewport during remote rehydrates, so syncs never yank the UI. Known limit: "Clear all data" only resets other tabs after their next reload.
3. **First-run dashboard** — a fresh workspace gets a calm Getting Started hero (canvas / first task / capture) instead of three zero-metric surfaces; analytics sections (weekly pulse, score ring, stat grid) only render once tasks or KPIs exist. The dashboard graduates automatically as data appears.
4. **Honest empty states** — Today's Focus distinguishes "nothing planned yet" from "all objectives met"; the task list distinguishes "no actions yet" from "no actions match your filters".
5. **Real Settings page** — replaced the "coming soon" placeholder with: keyboard shortcut reference, JSON export/import of the whole workspace (import reloads so every store revalidates through its sanitizers), and a two-step-confirm Clear All Data. No unfinished surfaces remain in the nav.
6. **A11y baseline** — consistent `:focus-visible` ring on buttons/links/selects; undo/redo added to the canvas help popover.

## Remaining weaknesses (new ordering)

1. **Mobile canvas ergonomics** — desktop/touchpad is solid; pinch-zoom and touch-drag on phones are functional via React Flow defaults but untuned, and the keyboard-first flow has no touch equivalent (no long-press menu).
2. **Dashboard mid-state density** — first-run and data-rich states are now good; a workspace with lots of data still shows ~9 modules. Next pass: make sections collapsible or user-configurable.
3. **Node text is single-line** — fine for labels; multi-line would help verbose thinkers. Descriptions live in the details panel.
4. **Tidy layout is a simple tree** — ignores cross-links; fine until maps get dense.
5. **No tests** — sanitizers and the undo history are now the highest-value unit-test targets.

## Tester-readiness checklist (state at end of session)

- [x] No dead buttons, placeholders, or fake data anywhere in the nav
- [x] First-time user gets guidance on the dashboard and hints on the canvas
- [x] Destructive actions are undoable (canvas) or double-confirmed (clear data)
- [x] Multi-tab use converges instead of silently diverging
- [x] Backup/restore exists (Settings → Export/Import)
- [x] eslint / tsc / production build clean; console clean on all pages

---

# Multi-map & sticky completion pass — 2026-06-12

Between the MVP push above and this session, an interim (undocumented) pass introduced **multiple mind maps** (workspace record in the store with legacy migration, sidebar map manager with inline rename + two-click delete, palette actions) and **sticky notes** (S key, four paper colors, context-menu/panel color pickers). The foundations were solid; this session audited them, then shipped the connective tissue that makes them feel like one product instead of bolted-on features. Everything below is live-verified on a cold production bundle.

## Shipped

1. **Cross-map search** — global search previously read only the active map's nodes, so "where did I put that idea?" silently failed across maps (the core multi-map problem). The search hook now spans every map (live nodes for the active map, stored snapshots for the rest), active-map hits rank first, and palette results are labeled `Idea · Map title`. Selecting a cross-map hit switches maps, selects the node, and animates it to center. Mechanism: a transient `pendingFocusNodeId` store request consumed by the canvas (cleared on switch/delete so it can never fire in the wrong map; cleared *after* the center animation starts so the effect's cleanup can't cancel its own timer). Root nodes share the id `root` across maps, so palette item keys are namespaced by map.
2. **Canvas map switcher** — the read-only map-title chip is now a real switcher (`MapSwitcher.tsx`): popover with every map + live idea counts + active check, "New mind map" at the bottom, Escape/click-away dismissal, autosave "Saved" pulse retained. The multi-map workflow no longer depends on the nav sidebar being expanded. New maps get distinguishable default names ("Mind Map 2", "Mind Map 3" — collision-checked) instead of identical "New Mindmap"s.
3. **Pane context menu** — right-click on empty canvas: *New idea here / Sticky note here / Fit view*, created exactly at the cursor. This is the discoverable twin of the invisible affordances (double-click, S). The node context menu gained the same click-away dismissal (it used to dangle when clicking another node or toolbar).
4. **Sticky physicality** —
   - Center-dropped stickies **cascade** like dealt cards (24px steps) instead of stacking into what reads as a single note.
   - The edit textarea **auto-grows** with content (was: fixed box that shrank and scrolled on long notes).
   - **Multi-line display bug fixed**: Shift+Enter line breaks were collapsing to one line (`whitespace-pre-wrap` was missing).
   - The details panel has a **sticky mode**: header "Sticky Note" with the paper-color dot, color picker, description and Linked Execution kept; Priority/Status and Linked Metrics hidden (they render nowhere on a sticky's face — offering them was dishonest UI).
   - Activity log says "Added sticky note", not "Added mind map node".
5. **Identity details** — breadcrumb is now `Workspace › Mind Maps › {active map}` on the canvas (map title takes the emphasized leaf position) and page labels are honest ("KPIs", not "Kpi"); the dashboard mind-map preview chip names the map it's showing instead of "Snapshot"; Settings + canvas help list the S and right-click affordances.

## Verified (cold production bundle, fresh workspace)

- Switcher: open → rows with idea counts → create map → breadcrumb/chip/sidebar all update; smart numbering works.
- Cross-map jump: seed "Quantum Garden" in map 2 → switch to map 1 → Ctrl+K "Quantum" → hit labeled `· Mind Map 2` → select → map switched, node selected, centered within 5px of canvas center.
- Stickies: S ×2 cascade (no stacking); right-click → "Sticky note here" lands centered on the click point; autogrow 30→171px while typing; 3-line note renders pre-wrapped after commit; details panel sticky-mode assertions all pass; Blue paper applies.
- Undo: sticky creation round-trips (5→6→5 nodes).
- Cross-tab `StorageEvent` rehydrate: stable map + node count, console clean.
- Gates: `tsc --noEmit` ✓, `eslint src` ✓ (0 problems), `next build` ✓ (9 routes), zero console warnings/errors during the whole E2E.

## Remaining weaknesses (updated, ordered)

1. **Mobile canvas ergonomics** — unchanged from the MVP push; the map switcher is also hidden below `md` (the sidebar drawer is the mobile path).
2. **Dashboard mid-state density** — unchanged.
3. **Map deletion is confirm-only** — two-click confirm in the sidebar, but no undo (cross-map undo is out of scope, same as task-conversion undo).
4. **Same-map concurrent edits across tabs** are last-writer-wins within the 500ms persist debounce (pre-existing, now spans maps).
5. **Idea-node labels are single-line** — verbose thoughts belong on stickies now, which softens this; still worth multi-line eventually.
6. **No tests** — sanitizers, undo history, and now `validateWorkspace`/migration are the highest-value unit-test targets.
