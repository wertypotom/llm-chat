---
name: generate-prd
description: Creates or updates the plans/prd.json file with a structured list of features for the Ralph Wiggum loop. Use this skill when the user asks to "create a PRD" or "plan the work" for a new feature.
---

# Generate PRD

This skill generates a `plans/prd.json` file structured specifically for the `/ralph` and `/ralph-once` workflows.

## When to use this skill

- When the user asks to plan a feature
- When preparing for a Ralph Wiggum execution loop
- When the user says "create a PRD" or provides feature requirements

## PRD Schema

The `plans/prd.json` must be an array of objects. Each object represents a single feature/task in the loop.

```json
[
  {
    "category": "functional | styling | bugfix | refactor | infrastructure",
    "description": "Short, clear description of what needs to be built",
    "steps": [
      "Step-by-step technical implementation path",
      "Which files need to be modified",
      "Which tests/verifications to run"
    ],
    "passes": false
  }
]
```

## How to use

1. **Analyze Requirements:** Understand the user's feature request. Break down the overarching feature into small, atomic tasks (1 task = 1 commit).
2. **Format Structure:** Map each task to the schema above. Ensure `passes` is set to `false` for all new tasks.
3. **Verify Location:** The file MUST be saved precisely at `plans/prd.json` (relative to the project root, not inside `.agent/`). If it doesn't exist, create it. If it does exist, append to the JSON array.
4. **Notify User:** Once generated, read the file back to the user or show a summary, and tell them they can now run `/ralph` or `/ralph-once`.

## Example PRD output for "Add AG Grid Contacts Table"

```json
[
  {
    "category": "functional",
    "description": "Install AG Grid dependencies and core CSS",
    "steps": [
      "Run npm install ag-grid-react ag-grid-community",
      "Include AG Grid CSS in index.css or via layout",
      "Verify app still builds successfully"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "Create basic ContactsTable component with mock data",
    "steps": [
      "Create src/features/contacts/components/ContactsTable.tsx",
      "Define basic columnDefs (Contact, Labels, Persona, etc)",
      "Import mock row data",
      "Render AgGridReact with Tailwind classes wrapper"
    ],
    "passes": false
  }
]
```
