---
name: testing
description: Comprehensive testing guide for Next.js/React applications. Use when writing tests for components, hooks, API integration, or user journeys. Covers unit tests (Vitest/RTL), integration tests (MSW), and E2E tests (Playwright).
---

# Testing

Comprehensive testing workflow for Next.js projects. Choose test type based on what you're testing.

## Workflow Decision Tree

```
What are you testing?
├─ Individual component/hook → Unit Tests
├─ API data fetching/mutations → Integration Tests
└─ Complete user journey → E2E Tests
```

## Testing Types

### Unit Tests

**When**: Testing isolated components, hooks, utilities, or stores  
**Tools**: Vitest/Jest + React Testing Library  
**See**:

- Components: [references/test-components.md](references/test-components.md)
- Hooks: [references/test-hooks.md](references/test-hooks.md)
- Stores: [references/test-stores.md](references/test-stores.md)
- Functions/Utils: [references/test-functions.md](references/test-functions.md)

### Integration Tests

**When**: Testing API interactions, component-server integration  
**Tools**: MSW (Mock Service Worker)  
**See**: [references/integration-tests.md](references/integration-tests.md)

### E2E Tests

**When**: Testing complete user flows, authentication, navigation  
**Tools**: Playwright  
**See**: [references/e2e-tests.md](references/e2e-tests.md)

## Quick Decision Guide

| What to Test               | Type        | Reference                                               |
| -------------------------- | ----------- | ------------------------------------------------------- |
| Button renders correctly   | Unit        | [test-components.md](references/test-components.md)     |
| Hook returns correct value | Unit        | [test-hooks.md](references/test-hooks.md)               |
| Zustand state updates      | Unit        | [test-stores.md](references/test-stores.md)             |
| Utility parses data        | Unit        | [test-functions.md](references/test-functions.md)       |
| Component fetches API data | Integration | [integration-tests.md](references/integration-tests.md) |
| Form submits to server     | Integration | [integration-tests.md](references/integration-tests.md) |
| User login flow            | E2E         | [e2e-tests.md](references/e2e-tests.md)                 |
| Navigation between pages   | E2E         | [e2e-tests.md](references/e2e-tests.md)                 |

## File Organization

```
feature/
├── components/
│   ├── MyComponent.tsx
│   └── MyComponent.test.tsx        # Unit test
├── hooks/
│   ├── useMyHook.ts
│   └── useMyHook.test.ts           # Unit test
└── integration.test.ts             # Integration test

tests/
└── e2e/
    ├── auth.spec.ts                # E2E test
    └── dashboard.spec.ts
```

## Getting Started

1. **Identify what you're testing** using decision tree above
2. **Read the appropriate reference**:
   - Component Unit Tests → [references/test-components.md](references/test-components.md)
   - Hook Unit Tests → [references/test-hooks.md](references/test-hooks.md)
   - Store Unit Tests → [references/test-stores.md](references/test-stores.md)
   - Function Unit Tests → [references/test-functions.md](references/test-functions.md)
   - Integration → [references/integration-tests.md](references/integration-tests.md)
   - E2E → [references/e2e-tests.md](references/e2e-tests.md)
3. **Follow the setup and patterns** in that reference
4. **Run tests** using commands documented in reference
