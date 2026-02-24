---
description: Execute the Ralph Wiggum Simple Loop Orchestration (Continuous)
---

# Ralph Wiggum Loop (Continuous)

Continuous autonomous loop on `plans/prd.json`. Do not stop until PRD is complete.

## Prerequisites

1. If `plans/prd.json` missing → ask user to provide it.
2. If `progress.txt` missing → create it empty.
3. Read `.agent/rules/frontend-architecture.md` for FSD guidelines.
4. Check `progress.txt` for `TESTS_ENABLED=true|false`. If not found → ask user **once** and write the result to the first line of `progress.txt` as `TESTS_ENABLED=true` or `TESTS_ENABLED=false`. Never ask again between iterations.

## Execution Loop (Repeat Until Complete)

For each iteration, execute these steps **strictly in order**:

### 1. Prioritize

Read `plans/prd.json` + `progress.txt`. Pick the highest-priority incomplete feature (your call, not necessarily first in list).

### 2. Plan (MANDATORY — do not skip)

Before writing any code, output a concise implementation plan following `.agent/rules/planning.md`:

- What files will be created/modified
- What the public interface looks like (types, props, API shape)
- How it fits into FSD structure
- List any open questions

Wait for user approval before proceeding to step 3.

### 3. Implement

Trigger the appropriate domain skill (`frontend-developer` for UI, `backend-developer` for API) to build the feature per the approved plan.

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

### 9. Repeat

Immediately start the next iteration. Only pause if:

- Completely blocked on missing info
- `plans/prd.json` is 100% complete

---

If PRD is fully complete → output `<promise>COMPLETE</promise>` and notify user.
