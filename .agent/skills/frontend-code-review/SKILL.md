---
name: frontend-code-review
description: Automated frontend code quality validation for Next.js/TypeScript/React projects. Use when validating FSD structure, checking for hardcoded strings, auditing TypeScript types, or running comprehensive pre-commit checks on frontend code.
---

# Frontend Code Review

Automated validation tools for frontend code quality in Next.js projects with Feature-Sliced Design.

## When to Use

Trigger this skill when:

- Running pre-commit checks
- Validating FSD (Feature-Sliced Design) structure
- Checking for untranslated strings
- Auditing TypeScript for `any` usage
- Ensuring code quality before PR

## Quick Start

This skill provides three validation scripts:

```bash
# Check for hardcoded strings
bash .agent/skills/frontend-code-review/scripts/check-translations.sh

# Validate FSD structure
bash .agent/skills/frontend-code-review/scripts/check-fsd-structure.sh

# Audit TypeScript types
bash .agent/skills/frontend-code-review/scripts/audit-types.sh
```

## Validation Checks

### 1. Translation Check

**Purpose**: Find hardcoded English strings that should be translated.

**What it checks**:

- Scans `.tsx` and `.ts` files for hardcoded strings
- Excludes `t('...')` translation calls
- Identifies untranslated user-facing text

**Usage**:

```bash
bash .agent/skills/frontend-code-review/scripts/check-translations.sh
```

**Exit code**:

- `0` - No hardcoded strings found ✅
- `1` - Hardcoded strings detected ❌

### 2. FSD Structure Check

**Purpose**: Validate Feature-Sliced Design folder structure.

**What it checks**:

- Features located in `app/(dashboard)/[feature-name]/`
- Required subdirectories present (types, api, components, hooks, ui, page.tsx)
- Optional directories (store, constants, utils)
- No invalid folders in feature directories

**Usage**:

```bash
bash .agent/skills/frontend-code-review/scripts/check-fsd-structure.sh
```

**Exit code**:

- `0` - Structure valid ✅
- `1` - Structure violations found ❌

### 3. TypeScript Type Audit

**Purpose**: Find `any` type usage and ensure type safety.

**What it checks**:

- Scans `.ts` and `.tsx` files for `any` keyword
- Excludes type-safe patterns (`Array<any>` edge cases allowed)
- Identifies type safety violations

**Usage**:

```bash
bash .agent/skills/frontend-code-review/scripts/audit-types.sh
```

**Exit code**:

- `0` - No `any` types found ✅
- `1` - `any` types detected ❌

## Integration with Workflows

### Pre-Commit Workflow

Use in `/pre-commit` workflow:

```bash
// turbo-all
bash .agent/skills/frontend-code-review/scripts/check-translations.sh
bash .agent/skills/frontend-code-review/scripts/check-fsd-structure.sh
bash .agent/skills/frontend-code-review/scripts/audit-types.sh
```

### Add Feature Workflow

Use in `/add-feature` workflow after implementation:

```bash
# Validate new feature structure
bash .agent/skills/frontend-code-review/scripts/check-fsd-structure.sh

# Ensure translations added
bash .agent/skills/frontend-code-review/scripts/check-translations.sh
```

## Troubleshooting

### False Positives (Translations)

If legitimate code triggers false positives:

1. Use translation function: `t('key')`
2. Move strings to constants: `const ERROR_MSG = 'error'`
3. Update script exclusion patterns

### FSD Structure Violations

Common issues:

- Missing required folders (`types/`, `api/`, `components/`)
- Invalid folder names (not in FSD spec)
- Features not in `app/(dashboard)/`

**Fix**: Restructure to match FSD requirements.

### `any` Type Detection

If `any` is truly necessary (rare):

- Document why in comments
- Consider `unknown` instead
- Use type guards to narrow

## Expected Project Structure

```
app/(dashboard)/
├── feature-one/
│   ├── types/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── ui/
│   ├── store/         # Optional
│   ├── constants/     # Optional
│   ├── utils/         # Optional
│   └── page.tsx
├── feature-two/
│   └── ...
shared/
├── ui/
├── hooks/
└── utils/
```

## Manual Review Checklist

After scripts pass, manually verify:

- [ ] No commented-out code blocks
- [ ] No `console.log` (except errors)
- [ ] No TODO: CLEANUP markers
- [ ] All imports used
- [ ] Props explicitly typed
- [ ] API responses typed
- [ ] Error handling present
