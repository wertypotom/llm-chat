---
name: test-stores
description: Guide and patterns for unit testing state stores (Zustand, Redux, Context) using Jest. Use this when writing tests for state management.
---

# Store Testing Guide

Testing isolated state management stores (e.g., Zustand).

## Imports

```typescript
// describe, it, expect, jest, beforeEach are globally available
import { act } from '@testing-library/react'
```

---

## 1. Resetting Store State

When testing global stores, state leaks between tests. Always reset the store before each test.

```typescript
// Assuming a Zustand store exported as `useStore`
import { useStore } from './store'

// Helper to reset Zustand (often needed)
const initialStoreState = useStore.getState()

beforeEach(() => {
  useStore.setState(initialStoreState, true)
})
```

## 2. Direct Store Testing (Without React Components)

Testing the store state directly is often faster than testing through a UI component or custom hook wrapper.

```typescript
describe('useCounterStore', () => {
  it('increments counter', () => {
    // 1. Arrange & Assert Initial State
    expect(useStore.getState().count).toBe(0)

    // 2. Act
    useStore.getState().increment()

    // 3. Assert Resulting State
    expect(useStore.getState().count).toBe(1)
  })

  it('resets counter', () => {
    // Modify initial state
    useStore.setState({ count: 5 })
    expect(useStore.getState().count).toBe(5)

    // Act
    useStore.getState().reset()

    // Assert
    expect(useStore.getState().count).toBe(0)
  })
})
```

## 3. Mocking Store Selectors or Implementations

Sometimes, components tightly couple to global stores. You may need to mock the entire store for component tests.

```typescript
jest.mock('./store', () => ({
  useStore: jest.fn(),
}))

it('mocks store state', () => {
  ;(useStore as jest.Mock).mockReturnValue({
    count: 10,
    increment: jest.fn(),
  })
  // Next, render your component and assert behavior
})
```

## Store Testing Rules

- ✅ **Test state transitions**, not React rendering. Ensure actions correctly mutate or replace the store slice.
- ✅ **Always reset state** between tests (`beforeEach` or `afterEach`) to prevent test pollution.
- ❌ **Don't test framework logic.** Don't test that Zustand updates subscribers; test your specific action logic.
