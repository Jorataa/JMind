# Jorata Project Instructions

This file contains team-shared architecture, conventions, and workflows for the Jorata project.

## Project Vision
Jorata is a Personal Operating System for Thinking and Execution.
**Loop:** Think -> Plan -> Execute -> Measure -> Improve.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State/UI:** React 19, React Flow (for Mind Maps)
- **Persistence:** Local Storage (MVP), Prisma/PostgreSQL (Planned)

## Coding Standards
- Use **Functional Components** and React Hooks.
- Keep components small and focused (e.g., `components/dashboard/welcome-card.tsx`).
- Use **TypeScript** strictly.
- Follow the **Research -> Strategy -> Execution** workflow.
- Prioritize simplicity and readability for the founder (who is learning).

## Development Workflow
1. **Research:** Map codebase and validate assumptions.
2. **Strategy:** Formulate and share a grounded plan.
3. **Execution:** Plan -> Act -> Validate.
4. **Validation:** ALWAYS run tests and linting after changes.

## Shared Conventions
- **Naming:** Use kebab-case for filenames, PascalCase for components.
- **Features:** Group logic by feature in `src/features/`.
- **UI:** Maintain a clean, modern, and minimal aesthetic (inspired by Linear/Notion).
