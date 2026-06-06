# JMind Project Context

Saved from `C:\Users\jovan\Downloads\JMind Project Context.pdf` and current workspace inspection on 2026-05-30.

This document is the practical project memory for future coding agents working on JMind. Keep it beginner-friendly, current-stage focused, and useful for deciding what to build next.

## Product Vision

JMind is a Personal Operating System for Thinking and Execution.

The product goal is not to create another simple todo app. JMind should become a centralized personal productivity platform where users can think, plan, execute, track progress, and grow.

Long-term product loop:

```text
Think -> Plan -> Execute -> Measure -> Improve
```

JMind should eventually combine:

- Mind Mapping
- Task Management
- KPI Tracking
- Daily Reflection
- Knowledge Management
- Personal Growth Tracking
- AI Assistance

Product inspiration:

- Notion
- Obsidian
- ClickUp
- Mind mapping software

The focus is personal productivity and execution.

## Founder Context

The founder is an Indonesian student learning software development while building this project.

Current learning areas:

- Next.js
- TypeScript
- Tailwind CSS
- Git
- VS Code
- Terminal
- Software architecture

Working style:

- Explain why a change is useful.
- Explain what will happen after the change.
- Explain risks when they matter.
- Then implement.
- Avoid overwhelming the founder with enterprise-level complexity.
- Help the founder understand architecture, not just receive generated code.

## Current Stack

Current:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Flow

Planned:

- Prisma
- PostgreSQL

Future:

- AI integration
- Authentication
- PDF export
- Cloud storage

## Current Project Stage

The project is in the foundation phase.

Already done:

- Next.js project initialized
- Local development environment exists
- Basic dashboard prototype started
- GitHub repository was mentioned in the project context, although this local folder currently has no `.git` directory

Current focus:

- Build clean architecture and folder structure before adding many features.
- Keep complexity low while the product direction becomes clearer.

## Current Priorities (Highest → Lowest)

1. Dashboard Refinement
2. Tasks Module
3. Mind Map Persistence
4. Mind Map Improvements
5. KPI Module
6. PDF Export
7. Authentication
8. AI Features

Practical guidance:

- Focus first on making the dashboard and core workflows usable.
- Add persistence before making mind maps more advanced.
- Treat authentication and AI as later-stage features, not MVP work.

## Current Code Snapshot

Root app:

- `src/app/page.tsx` composes `Sidebar`, `Topbar`, and `Dashboard`.
- `src/app/layout.tsx` sets metadata and Geist fonts.
- `src/app/globals.css` imports Tailwind and defines simple theme variables.

Components:

- `src/components/sidebar.tsx` contains navigation for Dashboard, Mind Maps, Tasks, and KPI.
- `src/components/topbar.tsx` contains page title, date label, search input, notification button, and profile badge.
- `src/components/dashboard.tsx` contains welcome text, stat cards, and the embedded mind map section.

Features:

- `src/features/mindmap/MindMapCanvas.tsx` is a client component using React Flow.
- The current mind map starts with a root `JMind` node.
- Users can add idea nodes around the root.
- Nodes can be dragged and connected.
- State is currently in React component state only; there is no persistence yet.

Observed folders:

- `src/features/kpi` exists but has no implemented feature yet.
- `src/features/tasks` exists but has no implemented feature yet.
- `backup-before-claude` contains earlier copies and should be treated as backup material, not active app code.

## Current Technical Debt

Known issues:

- Some components are larger than ideal and may need future decomposition.
- Folder structure is partially modular but not finalized.
- No persistence layer yet.
- No database integration.
- No testing setup.
- No error handling strategy yet.

How to handle this:

- Fix technical debt only when it supports the current feature work.
- Avoid large refactors unless the founder confirms the direction first.
- Prefer small, understandable improvements over broad rewrites.

## MVP Roadmap

Version 0.1 goal: usable productivity dashboard.

Dashboard:

- Sidebar
- Navbar
- Welcome card or welcome section
- Quick stats
- Daily wisdom

Tasks:

- Add task
- View task
- Complete task

Do not include yet:

- Authentication
- Database
- AI
- Team collaboration

Version 0.2: Mind Maps.

- Create nodes
- Create connections
- Drag nodes
- Save map

Version 0.3: KPI Tracking.

- Create KPI
- Set targets
- Track progress
- View simple charts

Version 0.4: PDF Export.

- Export tasks
- Export KPI reports
- Export mind maps

Version 0.5: Authentication.

- Possible stack: Clerk or NextAuth
- Not decided yet

Version 1.0: Personal Operating System.

- Dashboard
- Tasks
- Mind Maps
- KPI Tracking
- Daily Wisdom
- Reporting

## Definition Of Success For v0.1

A user can:

- Open the dashboard
- Create tasks
- Complete tasks
- Create a simple mind map
- Save and load mind maps

without needing an account.

This means v0.1 should feel useful locally before adding authentication, AI, or complex backend architecture.

## Out Of Scope For MVP

The following are intentionally postponed:

- AI Assistant
- Multi-user collaboration
- Real-time synchronization
- Mobile applications
- Complex analytics
- Advanced permissions

## Feature Visions

Dashboard should eventually include:

- Welcome section with greeting, current date, and motivational quote
- Quick stats such as tasks completed, tasks pending, weekly progress, and KPI status
- Today's tasks
- KPI snapshot
- Daily wisdom, such as a Bible verse or inspirational quote

Mind Maps should eventually support:

- Create nodes
- Create links
- Color categories
- Save maps
- Export maps
- Convert nodes into tasks

Tasks should eventually support:

- Create
- Edit
- Delete
- Complete
- Priorities
- Categories
- Due dates
- Recurring tasks

KPIs are personal performance indicators.

Examples:

- Health: running distance
- Study: hours studied
- Business: revenue
- Faith: daily reading

KPI capabilities:

- Set targets
- Track progress
- Visualize progress

AI assistant is future scope, not MVP priority.

Potential AI capabilities:

- Summarize mind maps
- Generate task plans
- Weekly reviews
- Goal analysis

## Coding Standards

- Use TypeScript.
- Use functional React components.
- Keep components small.
- Prefer reusable UI components when useful.
- Keep files readable.
- Avoid giant files.

Good direction:

```text
components/dashboard/welcome-card.tsx
```

Avoid:

```text
components/dashboard-everything.tsx
```

## UI Philosophy

Design goals:

- Clean
- Modern
- Minimal
- Focused

Visual inspiration:

- Linear
- Notion
- Vercel Dashboard
- Arc Browser aesthetics

Avoid:

- Excessive gradients
- Excessive animations
- Cluttered layouts

## Working Rules For Future Changes

- Preserve simplicity unless there is a clear reason to add structure.
- Keep the founder in the learning loop.
- Before large refactors, explain the plan and ask for confirmation.
- Do not silently restructure large parts of the project.
- Prioritize MVP dashboard, tasks, and basic mind map functionality before AI or backend complexity.
- Preserve the product vision, roadmap, and current code snapshot when updating this document.
- Optimize this document for future AI agents joining the project.
