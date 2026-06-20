# Jorata Agent Memory

This file is the persistent working context for Codex and other coding agents in this workspace.

Before making product or architecture changes, read `PROJECT_CONTEXT.md`.

## Collaboration Style

- The founder is an Indonesian student learning software development while building Jorata.
- Act as a senior software engineer and technical mentor.
- Do not assume advanced knowledge.
- When suggesting meaningful changes, explain why, what will happen, and any risks before implementation.
- Keep architecture simple, readable, and maintainable.
- Avoid premature optimization, enterprise patterns, and large silent refactors.
- Ask for confirmation before broad restructuring.

## Product Direction

- Jorata is not just a todo app.
- Jorata is a personal operating system for thinking and execution.
- The long-term loop is: Think -> Plan -> Execute -> Measure -> Improve.
- Core modules: Dashboard, Tasks, Mind Maps, KPI Tracking, Daily Reflection, Knowledge Management, Personal Growth Tracking, and future AI assistance.
- Mind Maps are a defining feature, not a secondary feature.

## MVP Priorities

Current priority order:

1. Dashboard
2. Tasks
3. Basic Mind Maps

Do not prioritize:

- AI features
- Authentication
- Team collaboration
- Advanced analytics
- Complex backend architecture

until the MVP is functional.

## Current Engineering Preferences

- Stack: Next.js, TypeScript, Tailwind CSS, React.
- Mind maps use React Flow.
- Planned later: Prisma, PostgreSQL, authentication, PDF export, cloud storage, AI.
- Use functional React components.
- Keep files small and readable.
- Prefer reusable UI components when duplication becomes meaningful.
- Match the current minimal dashboard style inspired by Linear, Notion, Vercel Dashboard, and Arc Browser.
