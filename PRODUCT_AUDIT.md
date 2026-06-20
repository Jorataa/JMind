# Jorata Product Audit — 2026-06-11

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

# Mobile canvas pass — 2026-06-13

Addressed remaining-weakness #1. Surgical and **mobile-only** — desktop (≥`sm`/`md`) behavior is byte-identical, and React Flow's touch defaults (one-finger pan, pinch-zoom, node drag, `preventScrolling`) were already correct, so the `<ReactFlow>` props were left untouched.

## Shipped
1. **Map switcher on mobile** — `MapSwitcher` was `hidden md:block`, so phones had no canvas-level "where am I / switch map". Now always shown; the 260px popover fits a 375px screen.
2. **Map title deduped** — the Topbar breadcrumb's map-title crumb is now `md:`-only, since the canvas chip carries it on mobile. A phone header reads "Workspace › Mind Maps"; the map name appears once (in the switcher) instead of twice.
3. **Touch rename** — node editing was `onDoubleClick`-only, so a node could not be renamed on a phone. Added an `onTouchEnd` double-tap (≤280ms) on `EditableNode` that opens the editor; single taps still bubble to React Flow for selection. Pure addition — the mouse path is unchanged.
4. **Calmer mobile toolbar** — gap tightened (`gap-2 sm:gap-3`); the two least-used actions (Tidy, Export) hidden below `sm` so the floating toolbar settles into ~2 tidy rows instead of a cluttered grid. Idea / Sticky / Undo / Redo / Fit / Details stay.
5. **Honest empty state** — the keyboard "Quick Start" hint (`2×Click / Tab / S / Enter`) is `sm:`-only; phones get "Tap + Idea to begin · double-tap a node to rename".

Files: `MapSwitcher.tsx`, `Topbar.tsx`, `EditableNode.tsx`, `CanvasToolbar.tsx`, `MindMapCanvas.tsx` (5).

## Verified (cold prod bundle :3100, mobile 375×812)
- `tsc --noEmit` ✓, `eslint src` ✓ (0 problems), `next build` ✓ (9 routes).
- DOM @375px: map switcher visible ("My Mindmap"); Tidy/Export hidden; Idea/Undo/Redo/Fit/Details visible; header text "Workspace Mind Maps" (no duplicate map title); mobile empty-hint present.
- Synthetic double-tap on the root node opened the rename editor (value "Jorata"). Programmatic focus did not apply under synthetic (untrusted) events — **confirm the keyboard pops up on a physical device**; the focus path is identical to the working desktop double-click.
- Screenshot timed out (known harness quirk on this machine), so verification is DOM-based.

## Remaining weaknesses (updated, ordered)
1. **Dashboard mid-state density** — unchanged; now the top open item.
2. **Map deletion is confirm-only** — no undo.
3. **Same-map concurrent edits across tabs** — last-writer-wins within the persist debounce.
4. **Idea-node labels are single-line.**
5. **No tests** — sanitizers, undo history, `validateWorkspace`/migration.
6. **Mobile follow-ups (minor):** connection handles are hover-only (`opacity-0 group-hover`), so edges can't be hand-drawn on touch (tree-building via the toolbar / Tab still works); the touch-rename focus wants a real-device check.

# Dashboard pass — 2026-06-13

Addressed remaining-weakness #2 (mid-state density) and the long-standing strategy violation the PRODUCT_STRATEGY audit flagged: productivity scores, streaks, and "Operating System / Execution" voice on a dashboard that's supposed to be a calm thinking space.

## Shipped
1. **Mid-state density** (commit `80cf73f`, deployed) — when the workspace has content but no tasks/KPIs, the dashboard stretched the Daily Wisdom quote edge-to-edge (954px) and repeated the map preview full-width at the bottom. Wisdom now pairs with the map preview in a 2-col grid (the pattern the fresh state already used); the redundant bottom preview is gone.
2. **Calm voice + never-list removal** — deleted the two never-list features (the `ProductivityScore` ring card and the `{n} day streak` badge in `WeeklyPulse`) and the **whole** "Intelligence Overview" stat grid (its remaining Velocity/Completion were the same scoreboard genre). Voice: "Personal Operating System" → "Thinking space", "Execution Phase" → "Open day", "main objective / Set Objective" → "anchor for today / Set Anchor", the "Active Execution / Primary Loop" header dropped, "Performance Metrics" → "Goals". `productivityScore`/`streak` removed from `useAnalytics`; `ProductivityScore.tsx` deleted.
   Files: `Dashboard.tsx`, `DashboardHeader.tsx`, `WeeklyPulse.tsx`, `use-analytics.ts`, `ProductivityScore.tsx` (deleted).

## Verified (cold prod bundle :3100, 1280px)
- `tsc` / `eslint` / `next build` green.
- Mid + full state checked via DOM: every never-list/off-voice string (`productivity`, `streak`, `operating system`, `execution`, `intelligence overview`, `primary loop`) is absent; calm replacements ("Thinking space", "Open day", "Goals", the Wisdom+preview pairing) render; WeeklyPulse keeps its weekly chart without the streak badge.

## Remaining weaknesses (updated, ordered)
1. **Map deletion is confirm-only** — no undo.
2. **Same-map concurrent edits across tabs** — last-writer-wins within the persist debounce.
3. **Idea-node labels are single-line.**
4. **No tests** — sanitizers, undo history, `validateWorkspace`/migration.
5. **Voice / dead-code follow-ups (minor):** the dynamic hero insight still says "clear *objectives*" (`lib/dashboard-insights.ts`); the `/tasks` header still reads "Active Execution" (`TaskHeader.tsx`); `calculateProductivityScore` / `calculateStreak` are now dead exports in `analytics-engine.ts`.
6. **Mobile follow-ups (minor):** touch-rename focus wants a real-device check; connection handles are hover-only.

# Trust & empty-state pass — 2026-06-14

A polish brief ("refine into something intentional, trustworthy, emotionally polished") prompted a 10-point audit. This session shipped the two lowest-risk, highest-trust tiers: the date/timezone correctness fix (the literal #1 ask) and the honest empty/loading-state pass. The broader subjective passes (cohesion sweep, mobile deep-dive, interaction polish, dashboard restructure) were deliberately *not* done blind — they're laid out as a prioritized roadmap for the founder to steer (see below). **All changes verified on the cold prod bundle :3100; UNCOMMITTED at session end** (same posture as the 2026-06-13 mobile pass — pending a "commit/deploy" from the founder).

## Shipped

1. **The date trust bug (root cause + fix).** `Topbar.tsx` rendered `new Intl.DateTimeFormat(...).format(new Date())` **unconditionally during SSR**. Every route is statically prerendered (`○ Static`), so the date was frozen to the *build machine's* clock — and on a live server (UTC) vs the user's local zone (Indonesia UTC+7/8) it also produced a **React hydration mismatch** every local morning before ~8am, briefly showing the wrong day. Fix: gate the date on `useHydrated()` (already imported), compute it client-only, reserve `min-w-[150px]` so the fade-in causes no layout shift. **Verified:** the prerendered HTML now contains *no* weekday string; the client renders the correct local date after a clean reload with a console free of hydration warnings.
2. **Daily-wisdom UTC day-boundary bug.** `useDailyWisdom` keyed reflections off `toISOString().split("T")[0]` (always UTC), so "today" rolled over at UTC midnight (7–8am local), misfiling reflections by a day. Fixed with a local-day key.
3. **Centralized date helpers** in `lib/format-date.ts`: `formatFullDate()` (the "Monday, June 8" form, DRY across Topbar + wisdom) and `getLocalDateKey()` (local `YYYY-MM-DD`, never UTC). Both carry comments explaining the SSR/timezone hazard so the trap isn't reintroduced.
4. **Honest empty states (objective #2).** The **Tasks** empty state was a single bare line; it's now a calm, teaching `EmptyState` ("Your list is clear" + how it works), borderless so it reads as the card body — and the honest "no tasks" vs "no filter match" split is preserved. The **KPI** empty state (objective #9, "what do I measure here?") gained warmer voice ("Measure what matters" + a plain-language definition) and four concrete example chips (Runs this week · Hours studied · Pages written · Daily reading) via a new optional `footer` slot on the shared `EmptyState`.
5. **Loading cohesion (objective #3).** KPI's one-off `"Loading indicators..."` text → the same `animate-pulse` skeleton (shaped like the real grid) that the dashboard and task panel already use. No module shows ambiguous loader text anymore.
6. **Calm voice (objectives #4/#5).** `TaskHeader` "Active Execution" → "Your actions" (+ "… done" not "… Completed"); KPI "Your Performance Indicators" → "What you're tracking"; the dashboard hero insight lost its "objectives / Great progress / Keep the deep work going" performance framing. The sidebar tagline — the most-seen expression of the philosophy — completed the **Think · Plan · Execute · Measure** loop (it had dropped "Measure"), rendered as a deliberate two-line pairing (thinking half / doing half) so it reads intentional, not wrapped.

Files: `lib/format-date.ts`, `components/layout/Topbar.tsx`, `features/wisdom/hooks/useDailyWisdom.ts`, `lib/dashboard-insights.ts`, `components/ui/EmptyState.tsx`, `features/kpi/components/{KPIList,EmptyKPIState}.tsx`, `features/tasks/components/{TaskList,TaskHeader}.tsx`, `components/layout/Sidebar.tsx` (10).

## Verified (cold prod bundle :3100)
- `tsc --noEmit` ✓, `eslint` ✓, `next build` ✓ (9 routes).
- Prerendered `dashboard.html`: zero weekday strings (SSR no longer emits a date); date placeholder span present.
- Runtime DOM: Topbar "Sunday, June 14" at opacity 1 after a hard reload, console clean on the fresh hydration cycle; `/tasks` "Your actions" + "0 / 0 done" + "Your list is clear"; `/kpi` "Measurement" / "What you're tracking" / "Measure what matters" + all 4 example chips, no stale loader text; sidebar tagline two clean lines, no overflow.
- Screenshot skipped (reliably times out on this machine — known harness quirk); verification is DOM-based.

## Prioritized roadmap for the rest of the brief (not yet done — needs founder steer)
- **#8 Dashboard "command center" feel** — the mid/full dashboard is still ~8 modules; consider a calmer adaptive density (the highest-impact remaining UX item).
- **#5 Cohesion sweep** — codify spacing/radius/shadow/typography tokens (a `THEME`-backed pass) so cards/buttons/sections are provably one system; mostly consistent today but not enforced.
- **#4 Philosophy, deeper** — quiet pillar eyebrows per module page (Mind Maps→Think, Tasks→Execute, KPI→Measure) would tie modules to the loop more than the tagline alone.
- **#6 Mobile deep-dive** — real-device check of touch-rename focus + canvas hand-drawn edges (handles are hover-only).
- **#7 Interaction polish** — focus-visible audit, hover/active consistency, motion review.
- **Dead code:** `calculateProductivityScore` / `calculateStreak` in `analytics-engine.ts` are now unused — safe to delete.

## Remaining weaknesses (updated, ordered)
1. **Dashboard mid/full-state density (#8)** — now the top open UX item.
2. **Map deletion is confirm-only** — no undo.
3. **Idea-node labels are single-line.**
4. **No tests** — sanitizers, undo history, `validateWorkspace`/migration, and now the new date helpers (`getLocalDateKey` is a clean, pure first target).
5. **Dead exports:** `calculateProductivityScore` / `calculateStreak` (`analytics-engine.ts`).
6. **Mobile follow-ups (minor):** touch-rename focus wants a real-device check; connection handles are hover-only.

# Founder UX-eval response — 2026-06-14

The founder pasted a 15-item prioritized evaluation of the LIVE app (P1 bugs, P2 UX, P3 features, plus polish). **Headline finding, verified against the code: roughly half the items already existed and the real problem was discoverability, not absence.** Every item was triaged against the source before any change — the discipline that kept this from being a pile of redundant rebuilds. All work below shipped to production in verified increments; **prod is LIVE on `da0ac61`**.

## Already implemented (perceived broken/missing — discoverability gap)
- **#1 double-click rename** — handler present + `zoomOnDoubleClick={false}`; hardened anyway (below).
- **#5 Enter rename**, **#8 category tooltips** (`title` attrs on swatches), **#10 reflection→activity** (`saveReflection` logs `mindset_reflection`, RecentActivity renders it).
- **#11 multi-map sidebar** — full list/create/rename/delete manager already in `Sidebar.tsx`.
- **#12 manual edge-drawing** — hover handles + `onConnect` already work on desktop; were hover-hidden.
- **#15 global search** — `use-global-search.ts` already full-text searches nodes (all maps) + tasks + KPIs; the Ctrl+K palette *is* the search.
- **#9 "Tidy does nothing"** — `calculateTreeLayout` works; it only arranges edge-connected nodes, so the dead feeling was the orphan nodes from #3 (now fixed). No code change.

## Shipped fixes (commits)
1. **P1 canvas (`96dac39`)** — double-click rename hardened with React Flow's native `onNodeDoubleClick → beginEditing` + `nodeDragThreshold` 1→4 (a wobble no longer eats the dblclick); **F2** rename alias; toolbar **"+ Idea"** now parents to selection-or-root like `Tab` (was orphaning nodes when nothing was selected — this was also why Tidy looked dead); one-time quiet **sticky hint** (founder chose "keep free-floating + hint" for #2).
2. **P2 dashboard (`bfe38b5`)** — **#6** map preview is now one large clickable link, framed with `fitView` for legibility, calmer "Open Mind Map" copy; **#8** node category name shown in the details header.
3. **Discoverability + #14 (`41ed1e4`)** — connection **handles now show on the selected node** (found via a normal click, not just hover); header search reads **"Search ideas, tasks, KPIs…"**; **#14** tasks created from a node store `sourceNodeId`/`sourceMapId` (through the sanitizer) and show a mind-map icon that jumps back to the origin node across maps.
4. **#7 + name (`da0ac61`)** — **Recent Activity entries are clickable** (node→canvas centered on the node across maps via new `mapId` in activity metadata; task→/tasks; KPI→/kpi; reflections stay non-clickable); **configurable name** in Settings › Profile (persisted in `jmind:ui`, defaults to "Jovan") replaces the hardcoded greeting/sidebar name; F2 documented in the shortcut reference.

## Verified
- `tsc` / `eslint` / `next build` green on every increment; each pushed commit reached Vercel READY.
- Configurable name round-trip DOM-verified on cold prod :3100 (Settings "Jovan"→"Sam" → persisted → dashboard "Good morning, Sam." + sidebar). Empty/date/preview changes verified earlier.
- **Canvas interactions are code-verified only** — this machine's headless preview reports `innerWidth: 0`, so React Flow renders no nodes there. Double-click, F2, "+ Idea" connect, handle visibility, and activity→node jumps need a **real-device smoke test** on jorata.vercel.app.

## Then shipped too (the founder said "continue development")
5. **#13 collapse/expand branches (`ac7d5ac`)** — parent nodes get a collapse toggle; collapsing hides all descendant nodes + edges, the folded node shows a persistent **+N** badge (N hidden) so the branch stays findable, and the toggle reveals on hover when expanded. Hidden state is derived at render by a **pure, cycle-safe `getHiddenNodeIds(nodes, edges)`** (`lib/collapse.ts`) — **unit-verified** against tree / nested / mid-branch / multi-collapse / root / cycle cases (7/7) since the harness can't render the canvas; only a per-node `collapsed` flag is persisted (through the sanitizer); toggling is undoable. The *visual* toggle still wants a real-device check.
6. **Per-map export (`de6c38f`)** — Settings exports the open map as a Markdown outline or raw JSON structure (wires up the previously-dead `exportToMarkdown`/`downloadMarkdown`); slugified filenames; verified on cold prod :3100 (`# Jorata` / valid `{app,type,title,exportedAt,nodes,edges}`).

## Genuinely not done (decision / out of scope)
- **React Flow attribution** — **cannot be removed without a React Flow Pro/commercial license** (`proOptions.hideAttribution` is gated by their terms). Left in place on purpose; a licensing call for the founder, not a code task.
- **Dead code** `calculateProductivityScore` / `calculateStreak` still unused in `analytics-engine.ts` — safe to delete anytime.
- **Real-device smoke test** of the canvas changes (double-click/F2 rename, "+ Idea" connect, selected-node handles, activity→node jumps, collapse/expand) — the only verification this machine's headless preview (`innerWidth: 0`) couldn't do.
