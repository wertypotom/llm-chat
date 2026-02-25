---
description: Execute a single iteration of the Ralph Wiggum Orchestration
---

# Ralph Wiggum Loop (Single Iteration)

When the user invokes this workflow, execute EXACTLY ONE iteration and stop.

## Prerequisites

1. If `plans/prd.json` missing → ask user to provide it.
2. If `progress.txt` missing → create it empty.
3. Read `.agent/rules/frontend-architecture.md` for FSD guidelines.
4. Check `progress.txt` for `TESTS_ENABLED=true|false`. If not found → ask user **once** and write the result to the first line of `progress.txt` as `TESTS_ENABLED=true` or `TESTS_ENABLED=false`. Never ask again.

## Execution Loop (One Iteration)

Execute these steps **strictly in order**, exactly once:

### 1. Prioritize

Read `plans/prd.json` + `progress.txt`. Pick the highest-priority incomplete feature (your call, not necessarily first in list).

### 2. Plan (MANDATORY — do not skip)

Before writing any code, create a concise implementation plan following `.agent/rules/planning.md`:

- What files will be created/modified
- What the public interface looks like (types, props, API shape)
- How it fits into FSD structure
- List any open questions

Present this plan to the user and wait for approval before proceeding to step 3.

### 3. Implement

Trigger the appropriate domain skill (`frontend-developer` for client code writing, `backend-developer` for backend code writing) to build the feature per the approved plan.

### 4. Test

If `TESTS_ENABLED=true` in `progress.txt`:

- Use the `tdd` skill to write tests for the feature (unit tests for components/hooks/utils).
- Run `npm run test:run` and fix any failures before continuing.

If `TESTS_ENABLED=false` → skip.

### 5. Validate

- Run `npm run lint` → fix errors.
- Run `npm run format` if available.
- Run `npm run typecheck` → fix errors.

### 6. Update PRD

Mark the feature `"passes": true` in `plans/prd.json`.

### 7. Log Progress

Append a concise entry to `progress.txt`.

### 8. Commit

`git add -A && git commit -m "feat: <feature>"`

### 9. Stop

Notify user: what was built, link to key files, prompt to run `/ralph-once` again.

---

If PRD is fully complete → output `<promise>COMPLETE</promise>` and notify user.
