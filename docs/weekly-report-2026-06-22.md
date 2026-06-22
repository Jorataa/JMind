# Jorata (JMind) — Weekly Growth Report

**Week of June 16–22, 2026** · Prepared 2026-06-22

---

## Executive summary

This was the week Jorata went from a feature-rich prototype to a **stabilized, named, and strategically-positioned product**. The first half of the week (owner-led) added the headline capabilities — AI mind-map generation, a Gemini chat assistant, themes, and the cinematic wisdom card — and culminated in the **rebrand from "JMind" to "Jorata."** The second half (this session) focused on **stability, polish, plain-English UX, and product strategy**: crash fixes, a persona-based usability review with fixes shipped, a cleaner mind-map export, and two major strategy artifacts — a competitive pricing analysis and a decision on the cloud-sync / shared-workspaces roadmap.

**By the numbers (last 7 days):** 14 commits · 78 files touched · **+3,138 / −489 lines**.

---

## 1. What shipped — new capabilities

Feature work delivered this week (owner-led, June 16–20):

- **AI Mind Map Generator + "Expand with AI"** — build an entire map from a one-line topic, and grow any node with AI-suggested children. Powered by Google Gemini, server-side.
- **Gemini AI chat assistant** — a side-panel chat with security hardening, plus "Update with Latest Info" that feeds current node titles to the model.
- **"Daily Sanctuary" wisdom card** — a cinematic daily card with customizable nature backgrounds (mountain/ocean/forest/etc.), favorites, and a date-keyed reflection journal.
- **Accent themes** — Ocean / Violet / Rose / Amber.
- **Rename maps from the canvas** (MapSwitcher) — multi-map workflow polish.
- **Visitor name-gate** — the no-password, name-only onboarding that defines the product's low-friction feel.
- **Rebrand: JMind → Jorata** — the product's new identity across the app.

---

## 2. Stability & reliability (this session)

The app had several first-load crashes that would hit brand-new users hardest. All resolved:

- **Dashboard crash from malformed activity timestamps** — hardened date parsing so a bad value degrades gracefully instead of white-screening.
- **"is not a function" crash** — stores were persisting their *action functions* to localStorage; on rehydration these came back as plain data and broke. Actions are now excluded from persistence.
- **Route-level ErrorBoundary** — a render error in one area now degrades gracefully instead of taking down the page.

Net effect: the dangerous first-run crashes are gone, which matters most given the no-signup, instant-use model.

---

## 3. UX & clarity (this session)

- **Plain-English copy pass** — replaced jargon across the app with wording real users understand.
- **"KPI" → "Goals"** — the feature was internally inconsistent (dashboard said "Goals," the page said "metric," the form said "performance indicator"); now unified on **Goals** everywhere in the UI.
- **Calm onboarding** — a clearer, more reassuring first impression for new users.
- **Persona-based usability review** — walked the app as a first-time *student* and *business owner*. Fixes shipped:
  - Tasks page wording aligned with the nav ("Execution/Action" → "Tasks").
  - Search box no longer ambushes new users on an empty task list.
  - Goals can now be created with a **starting value** (not just a 0 baseline).
  - Inbox count pluralization; command-palette & quick-capture marked up as dialogs for screen readers.
- **Mind-map PNG export fixed** — exports were capturing the whole on-screen canvas (blurred toolbar/minimap chrome, off-center framing). Now it captures only the node layer and auto-frames every node at 2× resolution — clean, sharp, properly composed.

---

## 4. Strategy & research (this session)

Two decision-grade artifacts were produced:

- **Competitive & pricing analysis** — Jorata benchmarked against MindMeister, XMind, Whimsical, Miro, Coggle, Ayoa, SimpleMind, Mindomo, GitMind, Taskade, Milanote, and Notion/Obsidian (live June 2026 pricing). Findings: Jorata's edge is **all-in-one breadth (mindmap + tasks + goals + focus + reflection) + local-first privacy + built-in AI**; its gaps are **collaboration, cloud sync, and mobile apps.** Recommended tiering: a generous **Free (local)** tier, a **$1.99 Student** tier, **$6/mo Pro**, **$15/seat Business**, and a **$79 lifetime "bring-your-own-AI-key"** option for subscription-averse privacy buyers.
- **Cloud-sync / shared-workspaces direction** — settled the architecture debate. Model agreed: **local-first stays the default** (name only, data on-device), and **cloud sync is opt-in via email** for users who want their data across devices. Async sharing with other people comes later, built on the same foundation. Identified the key build sequence: AI metering / BYO-key → cloud sync → share links → PWA/import → real-time collaboration.

---

## 5. Honest flags / risks

- **Privacy-pitch caveat:** the app currently sends a new user's name + IP/geo to a Google Sheet on first run (`api/visitor`), and AI calls send selected text to Google. If "private by default" becomes an official promise, this route should be removed or clearly disclosed.
- **Unbounded AI cost:** AI is funded by a single shared Gemini key with no per-user metering — a cost liability as usage grows, and the #1 thing to gate before monetizing.
- **No cross-device today:** data lives in one browser; switching devices loses continuity. This is the most-requested table-stakes gap and the core driver for the cloud-sync milestone.

---

## 6. Next week — recommended focus

1. **AI metering + "bring your own key"** — converts the uncapped cost into the core paid lever; small change to the existing `/api/ai/*` routes.
2. **Cloud sync (Milestone 1)** — opt-in, email-based, local-first preserved. Prototype buildable in a session; needs a Supabase project + env vars to go live.
3. **Resolve the visitor-log privacy contradiction** before any "private by default" marketing.
4. **Share / publish read-only links** — cheap, sellable, and a viral growth loop.

---

*Source: git history June 16–22, 2026; feature claims verified against `/home/user/JMind/src`. No production user-growth metrics are available (the app is local-first with no analytics backend), so "growth" here means product & strategic progress.*
