---
name: test-hooks
description: Guide and patterns for unit testing custom React hooks using @testing-library/react with either Vitest or Jest. Use this when writing tests for hooks.
---

# Hook Testing Guide

Testing isolated custom React hooks using `@testing-library/react`'s `renderHook`.

## Universal Imports (Jest vs Vitest)

**For Vitest:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
```

**For Jest:**

```typescript
// describe, it, expect, jest are globally available
import { renderHook, act, waitFor } from '@testing-library/react';
```

---

## 1. Basic Hook Testing (State & Callbacks)

Use `act()` whenever your test code directly calls a hook function that causes a state update.

```typescript
describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter(0));

    // Initial state
    expect(result.current.count).toBe(0);

    // Update state wrapped in act()
    act(() => {
      result.current.increment();
    });

    // Verify new state
    expect(result.current.count).toBe(1);
  });
});
```

## 2. Hooks that depend on Context (Wrappers)

When testing hooks like `useTheme`, `react-router` hooks, or `react-query`, you must provide the necessary context via the `wrapper` option.

```typescript
import { ThemeProvider } from './ThemeProvider';

it('returns dark theme', () => {
  const wrapper = ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>;

  const { result } = renderHook(() => useTheme(), { wrapper });

  expect(result.current.theme).toBe('dark');
});
```

## 3. Async Hooks (e.g., React Query or Fetching Hooks)

When a hook performs asynchronous operations, use `waitFor`.

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

it('fetches data successfully', async () => {
  const { result } = renderHook(() => useUserData('123'), {
    wrapper: createQueryWrapper(),
  });

  // Verify initial loading state
  expect(result.current.isLoading).toBe(true);

  // Wait for the async operation to complete
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  // Verify final data
  expect(result.current.data).toEqual({ id: '123', name: 'John' });
});
```

## Hook Testing Rules

- ✅ **Test hooks in isolation** if they contain complex logic that shouldn't be tested purely through component Integration tests.
- ✅ **Always wrap state updates in `act()`** when manually invoking hook update functions.
- ❌ **Don't test simple hooks.** If a hook just wraps a single `useState`, test it through the component that uses it instead.
