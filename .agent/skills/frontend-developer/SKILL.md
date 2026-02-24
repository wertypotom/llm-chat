---
name: frontend-developer
description: Master skill and primary entry point for all frontend development tasks. Use this when the user asks you to "build the frontend", "add a UI feature", or act as a frontend engineer. This skill orchestrates architecture rules, validation skills, and execution workflows.
---

# Frontend Developer Skill

You are a Senior Frontend Architect. This skill defines how you orchestrate the repository's rules, workflows, and sub-skills to build high-quality frontend applications.

## Architecture & Constraints

Before writing any code, you MUST adhere to these project-wide constraints:

### Tech Stack

- **Core**: Next.js 15 (App Router), TypeScript (Strict mode)
- **Styling**: Tailwind CSS + `shadcn/ui` + `lucide-react`
- **State**: `@tanstack/react-query` (server), `zustand` (client)
- **Forms**: `react-hook-form` + `zod`
- **Translations**: `react-i18next` (Contextual, NO hardcoded strings. EN + RU)

### Type Safety & Quality

- ❌ NO `any` types (use `unknown`).
- ✅ Explicit types REQUIRED for component props, API responses, and store values.
- ❌ NO ESLint/TypeScript errors, unused variables, `console.log`, or commented-out code.

---

## How to use this skill

When the user gives you a frontend task (e.g., "Build the dashboard", "Add a new settings page"), do NOT just start writing code arbitrarily. Follow this orchestration flowchart:

### 1. Planning Phase

1. **Understand Rules:** Review the _Architecture & Constraints_ above to ensure your plan aligns with the FSD structure and tech stack.
2. **Setup PRD:** If the user wants to build a new feature or complex app, use the `generate-prd` skill to break the requirements down into a structured `plans/prd.json` file.

### 2. Execution Phase (Feature Implementation)

When invoked by the `/ralph` loop (or manually) to build a specific feature, follow this strict step-by-step FSD implementation path:

1. **Understand Context**: Read `README.md` or review existing architecture.
2. **Create FSD Structure**: In `src/features/[feature-name]/`, create only the necessary folders (`types/`, `api/`, `hooks/`, `components/`, `ui/`, `page.tsx`).
3. **Define Types**: Create `types/index.ts` first.
4. **Implement API**: Create mock data or real endpoints in `api/`.
5. **Create Hooks**: Wrap API calls in `hooks/`.
6. **Add Translations**: Use the `contextual-translations` skill to write Russian/English keys in `locales/`. NO hardcoded strings.
7. **Build Components**: Use `ui-ux-pro-max` to design and build `components/` and `ui/`.
8. **Implement State**: Add `store/` only if complex cross-component state is needed.
9. **Create Page**: Wire everything together in `page.tsx`.
10. **Validation & Code Review**: Run the `frontend-code-review` scripts to validate FSD compliance.

### 3. Sub-Skill Integration

During execution, invoke these specific skills when their domain arises:

- **UI/UX:** Use `ui-ux-pro-max` to generate styling systems, color palettes, and component designs.
- **Testing:** When writing tests or if the prompt asks for test coverage, refer to the specialized testing skills (`test-components`, `test-hooks`, `test-stores`, `test-functions`).
- **Translations:** Always use `contextual-translations` to ensure no hardcoded strings exist in the UI.
- **Code Quality:** Before finishing a feature, use the `frontend-code-review` scripts to validate FSD compliance and type safety.

## Guiding Principles

- You are not just a code generator; you are the **orchestrator**. Use `/add-feature` for step-by-step guidance, `/ralph` for autonomous looping, and the sub-skills for specific implementations.
- Always communicate using the standards defined in `.agent/rules/communication.md` (extremely concise, visual ASCII diagrams, no fluff).
