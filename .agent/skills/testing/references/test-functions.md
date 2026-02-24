---
name: test-functions
description: Guide and patterns for unit testing pure JavaScript/TypeScript functions, utilities, and API calls using either Vitest or Jest. Use this when writing tests for independent business logic.
---

# Function Testing Guide

Testing isolated javascript/typescript functions, utilities, math routines, and pure data transformers.

## Universal Imports (Jest vs Vitest)

**For Vitest:**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

**For Jest:**

```typescript
// describe, it, expect, jest, beforeEach, afterEach are globally available
```

---

## 1. Basic Pure Function Testing

Pure functions are the easiest to test. Provide inputs and assert exact outputs.

```typescript
import { calculateTotal } from './mathUtils';

describe('calculateTotal', () => {
  it('sums an array of numbers', () => {
    expect(calculateTotal([10, 20, 30])).toBe(60);
  });

  it('returns 0 for an empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('handles negative numbers', () => {
    expect(calculateTotal([-10, 10])).toBe(0);
  });
});
```

## 2. Testing Thrown Errors

Use `.toThrow` wrapped in a callback function.

```typescript
import { parseJsonString } from './jsonUtils';

it('throws an error on invalid json structure', () => {
  expect(() => parseJsonString('{ invalid json ')).toThrow(
    'Invalid JSON format',
  );
  // Alternatively, just verify it throws any error:
  expect(() => parseJsonString('')).toThrow();
});
```

## 3. Mocking Dependencies (e.g., API Calls, Dates)

When utility functions make network requests or rely on the current time, mock the dependencies.

### Mocking APIs

**For Vitest:**

```typescript
import { fetchUserData } from './api';

// 1. Mock the native fetch API
global.fetch = vi.fn();

describe('fetchUserData', () => {
  it('parses valid user responses', async () => {
    // 2. Setup resolution value
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', name: 'John' }),
    } as Response);

    // 3. Act & Assert
    const data = await fetchUserData('123');
    expect(data.name).toBe('John');
    expect(fetch).toHaveBeenCalledWith('/api/users/123');
  });
});
```

**For Jest:**

```typescript
import { fetchUserData } from './api';

global.fetch = jest.fn();

describe('fetchUserData', () => {
  it('parses valid user responses', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', name: 'John' }),
    });

    const data = await fetchUserData('123');
    expect(data.name).toBe('John');
    expect(fetch).toHaveBeenCalledWith('/api/users/123');
  });
});
```

### Mocking Dates/Time

**For Vitest:**

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

it('returns relative "today" timestamp', () => {
  expect(getRelativeTime(new Date('2024-01-01T10:00:00Z'))).toBe('2 hours ago');
});
```

**For Jest:**

```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

it('returns relative "today" timestamp', () => {
  expect(getRelativeTime(new Date('2024-01-01T10:00:00Z'))).toBe('2 hours ago');
});
```

## Function Testing Rules

- ✅ **Test boundaries and edge cases.** (Empty arrays, nulls, undefined, string boundaries).
- ✅ **Keep assertions tight.** Prefer `.toBe` (reference equality check) and `.toStrictEqual` or `.toEqual` for object parsing.
- ❌ **Don't test framework built-ins.** (E.g., don't test `JSON.parse` itself).
