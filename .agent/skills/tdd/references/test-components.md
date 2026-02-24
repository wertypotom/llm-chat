---
name: test-components
description: Guide and patterns for unit testing React components using React Testing Library with either Vitest or Jest. Use this when writing tests for UI components.
---

# Component Testing Guide

Testing isolated React components using React Testing Library.

## Universal Imports (Jest vs Vitest)

Depending on the project's test runner, your imports will differ slightly:

**For Vitest:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

**For Jest:**

```typescript
// describe, it, expect, jest are globally available
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

---

## 1. Basic Rendering & Queries

```typescript
describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Hello" />);
    // Prefer getByRole and getByText for accessibility-first testing
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
  });
});
```

## 2. User Interaction

Always use `@testing-library/user-event` over `fireEvent` as it simulates real browser behavior.

```typescript
it('handles user clicks', async () => {
  const user = userEvent.setup(); // Setup before render
  const onClickMock = typeof vi !== 'undefined' ? vi.fn() : jest.fn();

  render(<Button onClick={onClickMock}>Submit</Button>);

  await user.click(screen.getByRole('button', { name: /submit/i }));
  expect(onClickMock).toHaveBeenCalledTimes(1);
});
```

## 3. Form Input Validation

```typescript
it('validates form input', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  const emailInput = screen.getByLabelText(/email/i);
  await user.type(emailInput, 'invalid-email');
  await user.click(screen.getByRole('button', { name: /log in/i }));

  expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
});
```

## 4. Testing Props Updates (rerender)

```typescript
it('updates when props change', () => {
  const { rerender } = render(<Counter count={0} />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  rerender(<Counter count={5} />);
  expect(screen.getByText('Count: 5')).toBeInTheDocument();
});
```

## 5. Conditional Rendering & Async loading

```typescript
it('shows loading state then data', async () => {
  render(<UserProfile id="123" />);

  // Synchronous check for initial state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Async check for resolved state
  const userName = await screen.findByRole('heading', { name: /john doe/i });
  expect(userName).toBeInTheDocument();

  // Verify loading is gone
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

## Best Practices

- ✅ **Test behavior, not implementation.** Don't test state directly, test what the user sees.
- ✅ **Use semantic queries** (`getByRole`, `getByLabelText`, `getByText`) instead of `getByTestId` wherever possible.
- ✅ **Setup userEvent outside of render** (`const user = userEvent.setup()`).
- ❌ **Don't wrap everything in act().** RTL handles act() automatically for fired events and queries.
