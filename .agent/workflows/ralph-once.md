---
description: Execute a single iteration of the Ralph Wiggum Orchestration
---

# Ralph Wiggum Loop (Single Iteration)

When the user invokes this workflow, you must act as a single-step agent operating on `plans/prd.json` and `progress.txt`. You will execute EXACTLY ONE iteration of the loop and then stop.

## Prerequisites

1. Analyze if `plans/prd.json` exists. If not, ask the user to provide it.
2. Analyze if `progress.txt` exists. If not, create it as an empty file.
3. Review `.agent/rules/frontend-architecture.md` to ensure your implementations map to the project's FSD guidelines.

## Execution Loop Instructions

Execute these steps strictly in order, exactly once:

1. **Prioritize:** Read `plans/prd.json` and `progress.txt`. Find the highest-priority incomplete feature. This should be the one YOU decide has the highest priority - not necessarily the first in the list.
2. **Focus:** Work ONLY on that single feature. Trigger the appropriate domain skill (e.g., `frontend-developer` for UI tasks, `backend-developer` for API tasks) to implement the necessary code following the architecture constraints.
3. **Validate:** Dynamically determine validation commands:
   - Check `package.json` for linting scripts (`lint`, `eslint`). If none exist, install ESLint and add a script. Run the script.
   - Check `package.json` for formatting (`prettier`). If available, run it.
   - Check `package.json` for typechecking (`typecheck`, `tsc --noEmit`). If available, run it. Fix any issues found across all checks.
4. **Testing Check (Interactive):** If this is the first time running the loop, ask the user: "Do you plan to have tests in this application? (y/n)".
   - If yes, use the `testing` skill as part of the iteration to write tests for the feature.
   - If no or for pet projects, skip testing.
5. **Update PRD:** Update `plans/prd.json` to mark the feature as complete.
6. **Log Progress:** Append your progress to `progress.txt`. Use this to leave a note for the next person (or iteration) working in the codebase.
7. **Commit:** Make a git commit for that specific feature.
8. **Stop:** Notify the user that the single iteration is complete, summarize what was built, and prompt them to run `/ralph-once` again if they want to continue.

If the PRD is already fully complete when you start, output `<promise>COMPLETE</promise>` and notify the user.
