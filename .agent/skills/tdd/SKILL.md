---
name: tdd
description: TDD-first with red-green-refactor loop. Use for ALL testing tasks: unit (Jest/RTL), integration (MSW), E2E (Playwright). Use when user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development.
---

# Test-Driven Development

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: exercise real code paths through public APIs. They describe _what_ the system does, not _how_. A good test reads like a spec — "user can send a message" tells you exactly what capability exists and survives any refactor.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or break on refactor when behavior hasn't changed. Warning sign: rename an internal function → tests fail. Those tests test structure, not behavior.

---

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" - treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes - they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical tracer-bullet):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

Writing tests in bulk produces imaginary behavior tests — you end up testing shapes (data structures, function signatures) not user-facing behavior.

---

## TDD Workflow

### 1. Plan

- Confirm which behaviors to test (prioritize critical paths)
- Design the public interface (what callers see, not internals)
- List behaviors as sentences: "user can X", "system does Y when Z"
- Get approval before writing any code

### 2. Tracer Bullet

```
RED:   Write ONE test → fails
GREEN: Minimal code to pass → passes
```

Proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules: one test at a time · only enough code to pass · no speculation.

### 4. Refactor

After all GREEN: extract duplication, deepen modules, apply SOLID. **Never refactor while RED.**

### Per-Cycle Checklist

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```

---

## Test Type Decision Tree

```
What are you testing?
├─ Isolated component/hook/util → Unit Test   (Vitest + RTL)
├─ API interaction / data fetch  → Integration (MSW)
└─ Complete user journey         → E2E         (Playwright)
```

| What to Test                | Type        | Reference                                                 |
| --------------------------- | ----------- | --------------------------------------------------------- |
| Component renders correctly | Unit        | [test-components.md](./references/test-components.md)     |
| Hook returns correct value  | Unit        | [test-hooks.md](./references/test-hooks.md)               |
| Zustand state updates       | Unit        | [test-stores.md](./references/test-stores.md)             |
| Utility parses data         | Unit        | [test-functions.md](./references/test-functions.md)       |
| Component fetches API data  | Integration | [integration-tests.md](./references/integration-tests.md) |
| Form submits to server      | Integration | [integration-tests.md](./references/integration-tests.md) |
| Full user flow              | E2E         | [e2e-tests.md](./references/e2e-tests.md)                 |

---

## Unit Tests (Jest + React Testing Library)

### Setup

```bash
npm install -D jest ts-jest jest-environment-jsdom @types/jest @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**`jest.config.ts`**

```ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/shared/test/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
}

export default config
```

**`src/shared/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

### Run

```bash
npm run test          # watch
npm run test:run      # CI (single run)
```

### Pattern: Component

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'

it('sends message on submit', async () => {
  render(<MyComponent />)
  await userEvent.type(screen.getByRole('textbox'), 'Hello')
  await userEvent.click(screen.getByRole('button', { name: /send/i }))
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

### Pattern: Hook

```ts
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

it('increments count', () => {
  const { result } = renderHook(() => useCounter())
  act(() => result.current.increment())
  expect(result.current.count).toBe(1)
})
```

---

## Integration Tests (MSW)

See: [integration-tests.md](./references/integration-tests.md)

---

## E2E Tests (Playwright)

See: [e2e-tests.md](./references/e2e-tests.md)

---

## File Organization (FSD)

```
src/features/chat/
├── components/
│   ├── ChatInput.tsx
│   └── ChatInput.test.tsx      ← co-locate unit tests
├── hooks/
│   ├── useChat.ts
│   └── useChat.test.ts
└── lib/
    ├── storage.ts
    └── storage.test.ts

tests/e2e/
└── chat.spec.ts
```
