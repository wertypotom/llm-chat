---
name: readme-update
description: Intelligently update README.md when architectural changes occur. Use when adding new features, changing directory structure, updating dependencies, or modifying setup instructions. Maintains README quality and accuracy.
---

# README Update

Intelligent README.md maintenance workflow for architectural and feature changes.

## When to Update README

Update README.md when:

- ✅ Adding new features or user flows
- ✅ Changing directory structure or architecture
- ✅ Adding/removing major dependencies
- ✅ Modifying setup instructions
- ✅ Updating environment variables
- ✅ Changing deployment process
- ✅ Adding new npm scripts

Don't update for:

- ❌ Minor bug fixes
- ❌ Code refactoring (same functionality)
- ❌ Internal implementation details
- ❌ Dependency version bumps

## README Structure

Maintain these sections:

### 1. Project Overview

```markdown
# Project Name

Brief description (1-2 sentences).

## Features

- Feature 1
- Feature 2
```

**Update when**: Adding/removing major features.

### 2. Tech Stack

```markdown
## Tech Stack

- Next.js 15 (App Router)
- TypeScript (Strict)
- Tailwind CSS
- React Query
- Zustand
```

**Update when**: Adding/removing core technologies.

### 3. Architecture

```markdown
## Architecture

This project follows Feature-Sliced Design (FSD).

\`\`\`
app/(dashboard)/
├── feature-one/
│ ├── types/
│ ├── api/
│ └── ...
shared/
├── ui/
└── hooks/
\`\`\`
```

**Update when**: Changing folder structure or adding new architectural patterns.

### 4. Setup Instructions

```markdown
## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

### Environment Variables

\`\`\`
NEXT_PUBLIC_API_URL=...
DATABASE_URL=...
\`\`\`
```

**Update when**: Changing setup steps, adding env vars, modifying dependencies.

### 5. Development Workflow

```markdown
## Development

\`\`\`bash
npm run lint # Lint code
npm run check-types # Type check
npm run build # Build production
\`\`\`
```

**Update when**: Adding new npm scripts or changing workflows.

### 6. Testing

```markdown
## Testing

\`\`\`bash
npm run test # Unit tests
npm run test:e2e # E2E tests
\`\`\`
```

**Update when**: Adding testing infrastructure.

## Update Workflow

### 1. Read Current README

```bash
cat README.md
```

Understand existing structure before modifying.

### 2. Identify Changes

Compare:

- Old architecture vs new architecture
- Old setup vs new setup
- Old features vs new features

### 3. Update Relevant Sections

Only update sections that changed. Don't rewrite entire README.

### 4. Maintain Consistency

- Use same formatting (headers, code blocks, lists)
- Keep tone consistent
- Update table of contents if present

### 5. Verify Accuracy

- Test setup instructions
- Verify npm scripts work
- Check env var names
- Validate code examples

## Common Update Scenarios

### Added New Feature

Update:

- Features list
- Architecture diagram (if affected)
- Setup (if new dependencies)

### Changed Directory Structure

Update:

- Architecture section
- File structure diagram
- Import examples (if shown)

### Added Environment Variable

Update:

- Environment Variables section
- `.env.example` file
- Setup instructions

### Added npm Script

Update:

- Development Workflow section
- Add description and usage

### Changed Deployment

Update:

- Deployment section
- Build commands
- Platform-specific instructions

## Example Updates

### Feature Addition

**Before**:

```markdown
## Features

- User authentication
- Job listings
```

**After**:

```markdown
## Features

- User authentication
- Job listings
- **Resume builder** (NEW)
```

### Architecture Change

**Before**:

```markdown
\`\`\`
app/
├── jobs/
└── users/
\`\`\`
```

**After**:

```markdown
## Architecture

This project follows **Feature-Sliced Design (FSD)**.

\`\`\`
app/(dashboard)/
├── jobs/
│ ├── types/
│ ├── api/
│ ├── components/
│ └── page.tsx
└── users/
└── ...
\`\`\`
```

## Best Practices

- ✅ Keep updates minimal and focused
- ✅ Test all code examples before adding
- ✅ Use relative paths for file references
- ✅ Add links to relevant documentation
- ✅ Keep language clear and concise
- ❌ Don't add implementation details
- ❌ Don't duplicate information
- ❌ Don't use outdated screenshots

## Validation

After updating:

- [ ] All npm scripts mentioned exist in package.json
- [ ] All env vars mentioned exist in .env.example
- [ ] Setup instructions tested on fresh clone
- [ ] Code examples are valid
- [ ] Links work
- [ ] Markdown renders correctly
