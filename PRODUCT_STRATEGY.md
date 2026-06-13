# JMind — Product Strategy

*The strategic and philosophical compass of the product. Read this before proposing features, changing UX, or introducing new surfaces. Read `PROJECT_CONTEXT.md` for architecture. Read `PRODUCT_AUDIT.md` for what has been built and why.*

*Last updated: 2026-06-13*

---

## What JMind Is

JMind is a calm, private space where your thinking becomes visible — and visible thinking can become action.

You draw a map. You branch it. You name the parts of your life you're trying to hold together. And instead of that map becoming an artifact that rots in a folder, the things on it *do* something: they link to tasks, their completion echoes back, and the loop — thought → action → resolution — closes quietly inside the same tool where the thought began.

No other tool in this space closes that loop without asking for an account, a monthly subscription, a team, or a learning curve measured in weeks.

That is what JMind is. One person, one screen, their whole mind — laid out, connected, and at peace.

---

## What JMind Is Not

JMind is not:
- a project management tool for teams
- a replacement for Notion or Obsidian
- a productivity dashboard that scores your life
- a habit tracker with streaks and XP
- an AI assistant that talks to your notes
- a feature-complete everything-app
- software that needs an internet connection to be useful
- something you "onboard" to

These are not modest disclaimers. They are the product's identity. Every one of them is a direction JMind has consciously refused, and the refusal is the point.

---

## Product Philosophy

**Finish choosing yourself before choosing new features.**

The strongest version of JMind is not a wider one. It is a *clearer* one: a product that knows precisely what it is, expresses it in every pixel and every sentence, and trusts that clarity to find its audience.

Three principles that flow from this:

1. **The canvas is the hero.** Everything else — the dashboard, the KPIs, the reflection card — is a hallway that leads back to the canvas. If a feature does not serve the canvas or the canvas-to-action loop, it earns its place only by being deeply, genuinely useful as a standalone thing.

2. **Calm is the product.** Not calm *design*, not calm *aesthetics* — calm as a functional output. A user opening JMind should exhale slightly. If a new surface makes that harder, it does not belong.

3. **Honest surfaces only.** No number the user didn't earn. No judgment they didn't ask for. No state that implies failure. The product should never tell the user they are behind, insufficient, or losing. It can tell them what is true. It cannot tell them what to feel about it.

---

## The Feeling JMind Should Create

A user who sits down with JMind should feel:

- mentally clearer after than before
- like their thoughts have somewhere to live
- safe to be a work in progress
- not rushed, not scored, not watched
- like the software respects them

A user who shares something from JMind should feel:

- proud of what they made
- understood by the tool that helped them make it

These feelings are the product's north star. When there is doubt about a decision — a feature, a label, a color, a transition — ask: does this protect these feelings or erode them?

---

## Who JMind Is For

The ideal user is someone organizing a life in progress:

- a student holding courses + projects + faith + health together in their head
- a self-taught builder growing a skill while managing the rest of existence
- a creator who thinks visually and is tired of Notion's weight
- someone who has tried multiple productivity systems and worn out on all of them
- a person who keeps a journal, underlines things, and draws diagrams on paper

They value privacy. They think in shapes, not spreadsheets. They are skeptical of software that promises too much. They do not want to be managed; they want to think clearly.

JMind exists for the person who needs to see their own mind before they can act on it.

---

## Who JMind Is Not For

- teams and collaborative work (JMind has no concept of "another person")
- users who need complex workflows (databases, formulas, automations)
- people who are motivated by leaderboards, streaks, and competition
- enterprises looking for auditability and permissions
- anyone who requires a mobile-native experience before trying the desktop web

These are not failures of imagination. Saying "not for" is what makes the "for" feel true.

---

## Emotional Direction

JMind's emotional register is: **a desk lamp in a quiet room.**

Not a stadium screen. Not ambient music. Not a coach. A single source of warm, directed light that makes the work visible and leaves everything else in comfortable shadow.

Translate that to design:

- Typography is calm and readable — never decorative, never urgent
- Motion is causal, not performative — things move because *you* moved them
- Color is restrained — one gentle accent, not a rainbow of status indicators
- Empty states are spacious, not anxious — "add something when you're ready," not "get started!"
- Confirmations are quiet — "Saved." Not "Great job! Your map is safe!"
- Errors are honest — "That didn't work." Not technically alarming, not dismissive

The verbal voice is that of a calm friend, present tense. If the sentence sounds like it belongs in a performance review, replace it.

Words and phrases that do not belong in JMind:
- Mission, Protocol, Intelligence, Velocity, Objectives, Warrior, Execution Engine, Primary Loop, Daily Mission Log
- Score, Streak, XP, Achievement, Level, Rank
- "You should", "Don't forget", "Stay on track", "Keep going"
- Any copy that implies the user is behind

---

## UX Principles

**1. One decision at a time.**
Capture asks for words, not categories. Categories can come later, optionally. Every moment of friction between a thought and its capture is a thought lost.

**2. The canvas is always one shortcut away.**
Navigation should never require more than one keystroke to reach the canvas from anywhere in the app. The canvas is home.

**3. No dead ends.**
Every empty state is an invitation. Every error has a way forward. No screen should make the user feel stuck or lost.

**4. Interactions should feel earned, not instructed.**
Good UX in JMind is not about guiding users through flows. It is about the satisfaction of discovering that a shortcut works, that undo covers you, that the thing you just drew can be turned into a task with one keystroke. Discovery, not tutorial.

**5. What you see is what is true.**
No metrics that cannot be explained in plain language. No graphs that imply a trend that doesn't exist. No UI chrome that is decorative rather than functional.

---

## Design Principles

**Space is content.**
Breathing room between elements is not wasted screen real estate. It is the design equivalent of calm.

**One typeface, two registers.**
UI (labels, buttons, metadata): regular weight, small, zinc-toned. Meaning (map titles, daily anchor, wisdom quote, empty-state headings): a humanist voice — slightly larger, a touch warmer — that marks the moments that matter. Do not use a third register.

**Restraint with color.**
One accent color per theme. It signals selection, connection, and completion — nothing else. Color does not communicate priority; hierarchy and weight do.

**Motion serves understanding.**
An element moves because the user caused it to move, or because a state genuinely changed. Ambient animation, loading spinners on instant operations, and celebratory bursts on routine actions do not exist here. The one exception: the moment a linked task completes and the canvas node quietly settles — that single beat of visual closure is worth designing carefully, because it is the product's thesis in 800 milliseconds.

**Every surface must earn its density.**
A card with ten data points is not more useful than a card with three. Default to showing less; let the user reach for more.

---

## Interaction Philosophy

**The keyboard is the fastest path to thinking.** Shortcuts are not power-user features — they are the product's primary interaction mode. The mouse and touch are secondary. This does not mean the product is inaccessible; it means keyboard-first is the design assumption, and touch and mouse are designed to feel equally natural.

**Undo is a right, not a feature.** Every destructive action should be reversible. Where it cannot be (deleting a map, clearing all data), the user sees two confirmations and a suggestion to export first.

**The product does not interrupt.** No toast appears unless something unusual happened. No modal appears unprompted. No notification arrives ever. The user controls when they receive information.

**State is remembered without being asked.** Sidebar collapsed, panel open, which map was active, where the viewport was — all of this is restored silently. JMind knows where you were because it kept watching, quietly, without announcing it.

---

## Product Boundaries

These are the edges of JMind. Features that require crossing these edges do not belong in this product, regardless of how useful they might be in isolation.

| Boundary | What it protects |
|---|---|
| Single-player only | Simplicity, privacy, and the identity of "a space for your mind" — not "a space for your team" |
| Local-first always | User trust; data export is always free; no server dependency for core function |
| No engagement mechanics | No streaks, no scores, no daily goal nags — the product rewards reflection, not addiction |
| No required accounts | The product starts working the moment you open it; an account should be an upgrade, never a gate |
| No notifications | Attention is the product, not a resource to be reclaimed from the app |
| No infinite feed | Every surface has edges; you reach the end; the end is not an anxiety |

---

## Anti-Feature-Creep Rules

Before any new feature is proposed or built, it must pass all four filters:

1. **The calm filter:** Does this increase noise more than clarity? If yes, it does not belong.
2. **The loop filter:** Does this serve the canvas-to-action loop, or does it live entirely outside it? If entirely outside, what exactly justifies it?
3. **The voice filter:** Can every label, button, and empty state in this feature be written in calm, human language without reaching for urgency or performance framing?
4. **The trust filter:** Does this feature require the user to give JMind something — data, permission, attention — that they haven't explicitly offered? If yes, is that tradeoff clearly in their favor?

Features that fail these filters are not bad ideas. They are ideas for a different product.

---

## Strategic Filters for Future Features

Use these when deciding what to build next:

**Build it if:**
- it makes the canvas more powerful or more legible
- it makes the capture-to-action loop faster or more satisfying
- it makes the product feel more like a mirror of the user's mind
- it makes the product feel safer or more private
- it is invisible when not needed and obvious when it is

**Delay it if:**
- it requires a backend before the local version is proven
- it requires the user to learn a new mental model
- it would be impressive in a demo but ignored in daily use
- it makes the codebase significantly harder to reason about

**Reject it if:**
- it monetizes attention instead of utility
- it adds a metric that can be gamed or that implies failure
- it breaks the single-player identity
- it requires a notification to be useful

---

## Things That Must Never Happen to JMind

These are not preferences. They are lines.

- A score on the user's productivity or life quality
- A streak that resets with a rest day
- Confetti, fireworks, or celebratory animations on routine task completion
- An unread count badge anywhere in the interface
- A modal or push notification the user did not explicitly trigger
- Paywalled data export — your data is always yours
- A required account before the app functions
- A "you're behind" state, a deadline warning on personal goals, or any copy that implies the user has failed
- A dark pattern: free trial countdown, loss-framing, engineered anxiety
- Collaboration features that blur the single-player identity before single-player is excellent

---

## Long-Term Identity

JMind's long-term identity is **the calm thinking space** — a category it can credibly own because no serious competitor occupies it.

The competitors are noisier (Notion, ClickUp), more complex (Obsidian, Heptabase), more specialized (XMind), or more opinionated about productivity as performance (every tool with a habit tracker). JMind's position is not technical differentiation; it is *emotional* differentiation: the only tool in the category that explicitly refuses to judge you.

That refusal is a philosophy and a promise. It is also, stated plainly, a marketing position: **calm software in a noisy category.**

The long-term moat is data gravity — maps that have been tended for months become mirrors, and you do not abandon a mirror. Reflections compound the same way. The product grows more personal over time without growing more complicated. That is the right kind of retention.

Monetization, when it arrives, should respect this identity completely: sync across devices as a paid tier, free local-forever as the foundation, data export free always. No feature-locked paywalls. No plans. No seats.

---

## Positioning Statement

> JMind is a calm, private thinking space where your ideas live on a canvas and quietly become action. No accounts, no feeds, no scores — just you, thinking clearly.

**Tagline:** *A quiet place to think.*

---

## Docs-as-Memory Integration

This document is part of JMind's intentional project memory. The three documents that together form the complete project context are:

| Document | Purpose |
|---|---|
| `PRODUCT_STRATEGY.md` ← *this file* | Strategic compass: philosophy, identity, product decisions |
| `PROJECT_CONTEXT.md` | Technical reality: architecture, stack, code snapshot, known debt |
| `PRODUCT_AUDIT.md` | Historical record: what was built, why, what was verified, what's next |

**For future AI sessions:** read `PRODUCT_STRATEGY.md` first for *what kind of product this is*; read `PRODUCT_AUDIT.md` for *what has been built and what the agreed backlog is*; read `PROJECT_CONTEXT.md` for *how the code is structured*. These three documents together replace hours of discovery. Keep them current.

**For the founder:** when a new session starts with an unfamiliar engineer or model, point them to this file first. The backlog in `PRODUCT_AUDIT.md` is tactical; the strategy here is structural. Tactics change — this holds.
