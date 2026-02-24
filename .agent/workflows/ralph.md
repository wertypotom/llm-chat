---
description: Execute the Ralph Wiggum Simple Loop Orchestration (Continuous)
---

# Ralph Wiggum Loop (Continuous)

When the user invokes this workflow, you must act as a continuous autonomous loop operating on `plans/prd.json` and `progress.txt`.

## Prerequisites

1. Analyze if `plans/prd.json` exists. If not, ask the user to provide it.
2. Analyze if `progress.txt` exists. If not, create it as an empty file.
3. Review `.agent/rules/frontend-architecture.md` to ensure your implementations map to the project's FSD guidelines.

## Execution Loop Instructions

Do not stop until the PRD is complete. For each iteration, execute these steps strictly in order:

1. **Prioritize:** Read `plans/prd.json` and `progress.txt`. Find the highest-priority incomplete feature. This should be the one YOU decide has the highest priority - not necessarily the first in the list.
2. **Focus:** Work ONLY on that single feature. Trigger the appropriate domain skill (e.g., `frontend-developer` for UI tasks, `backend-developer` for API tasks) to implement the necessary code following the architecture constraints.
3. **Validate:** Dynamically determine validation commands:
   - Check `package.json` for linting scripts (`lint`, `eslint`). If none exist, install ESLint and add a script. Run the script.
   - Check `package.json` for formatting (`prettier`). If available, run it.
   - Check `package.json` for typechecking (`typecheck`, `tsc --noEmit`). If available, run it. Fix any issues found across all checks.
4. **Testing Check (Interactive):** If this is the FIRST iteration, ask the user: "Do you plan to have tests in this application? (y/n)".
   - If yes, use the `testing` skill as part of the iteration to write tests for the feature.
   - If no or for pet projects, skip testing for this and all future iterations.
5. **Update PRD:** Update `plans/prd.json` to mark the feature as complete.
6. **Log Progress:** Append your progress to `progress.txt`. Use this to leave a note for the next person (or iteration) working in the codebase.
7. **Commit:** Make a git commit for that specific feature.
8. **Repeat:** Immediately begin the next iteration. Do not ask for user permission unless you are completely blocked or `plans/prd.json` is 100% complete.

If the PRD is fully complete, output `<promise>COMPLETE</promise>` and notify the user.
