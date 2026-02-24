# Integration Tests

Testing API interactions and component-server integration.

## Tools

- **MSW (Mock Service Worker)** - API mocking
- **Vitest** - Test runner
- **React Testing Library** - Component testing with API

## Setup

### Install MSW

```bash
npm install -D msw
npx msw init public/
```

### Create Handler

s

Create `mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET request
  http.get('/api/jobs', () => {
    return HttpResponse.json([
      { id: 1, title: 'Software Engineer' },
      { id: 2, title: 'Product Manager' },
    ]);
  }),

  // POST request
  http.post('/api/jobs', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 3,
      ...body,
      createdAt: new Date().toISOString(),
    });
  }),

  // Error response
  http.get('/api/jobs/:id', ({ params }) => {
    const { id } = params;
    if (id === '999') {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ id, title: 'Job Title' });
  }),
];
```

### Create Server

Create `mocks/server.ts`:

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Test Setup

Create test setup file:

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

## Testing Patterns

### Fetch Data Test

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobList } from './JobList';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('JobList Integration', () => {
  it('fetches and displays jobs', async () => {
    render(<JobList />, { wrapper: createWrapper() });

    // Initial loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
    });
  });
});
```

### Mutation Test

```typescript
it('creates new job', async () => {
  const user = userEvent.setup();
  render(<CreateJobForm />, { wrapper: createWrapper() });

  // Fill form
  await user.type(screen.getByLabelText('Title'), 'New Job');
  await user.type(screen.getByLabelText('Description'), 'Job description');

  // Submit
  await user.click(screen.getByRole('button', { name: 'Create' }));

  // Verify success message
  await waitFor(() => {
    expect(screen.getByText(/job created successfully/i)).toBeInTheDocument();
  });
});
```

### Error Handling Test

```typescript
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

it('handles API errors', async () => {
  // Override handler to return error
  server.use(
    http.get('/api/jobs', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  render(<JobList />, { wrapper: createWrapper() });

  await waitFor(() => {
    expect(screen.getByText(/error loading jobs/i)).toBeInTheDocument();
  });
});

it('handles network errors', async () => {
  server.use(
    http.get('/api/jobs', () => {
      return HttpResponse.error();
    })
  );

  render(<JobList />, { wrapper: createWrapper() });

  await waitFor(() => {
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
it('shows loading spinner', async () => {
  render(<JobList />, { wrapper: createWrapper() });

  // Immediately check for loading state
  expect(screen.getByRole('progressbar')).toBeInTheDocument();

  // Wait for data
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
```

### Testing Pagination

```typescript
it('loads more jobs on pagination', async () => {
  const user = userEvent.setup();

  render(<JobList />, { wrapper: createWrapper() });

  // Wait for initial load
  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  // Click "Load More"
  await user.click(screen.getByRole('button', { name: 'Load More' }));

  // Verify more items loaded
  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(20);
  });
});
```

## Request Verification

### Verify Request Body

```typescript
it('sends correct data to API', async () => {
  let requestBody;

  server.use(
    http.post('/api/jobs', async ({ request }) => {
      requestBody = await request.json();
      return HttpResponse.json({ id: 1, ...requestBody });
    })
  );

  const user = userEvent.setup();
  render(<CreateJobForm />, { wrapper: createWrapper() });

  await user.type(screen.getByLabelText('Title'), 'Test Job');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  await waitFor(() => {
    expect(requestBody).toEqual({
      title: 'Test Job',
      description: expect.any(String),
    });
  });
});
```

### Verify Request Headers

```typescript
server.use(
  http.get('/api/jobs', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json([{ id: 1, title: 'Job' }]);
  })
);
```

## Running Tests

```bash
# Run integration tests
npx vitest --run integration

# Watch mode
npx vitest integration

# With coverage
npx vitest --coverage integration
```

## Best Practices

### Do

- ✅ Mock entire API layer with MSW
- ✅ Test both success and error scenarios
- ✅ Verify loading states
- ✅ Test request payloads
- ✅ Use realistic mock data

### Don't

- ❌ Mock fetch/axios directly
- ❌ Test only happy paths
- ❌ Ignore error handling
- ❌ Use timeouts instead of waitFor
- ❌ Share server state between tests

## Common Patterns

### Authenticated Requests

```typescript
const createAuthWrapper = (token) => {
  const queryClient = new QueryClient();

  return ({ children }) => (
    <AuthContext.Provider value={{ token }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

it('includes auth token', async () => {
  render(<ProtectedComponent />, {
    wrapper: createAuthWrapper('test-token')
  });

  await waitFor(() => {
    expect(screen.getByText('Protected Data')).toBeInTheDocument();
  });
});
```

### Optimistic Updates

```typescript
it('shows optimistic update', async () => {
  const user = userEvent.setup();
  render(<JobList />, { wrapper: createWrapper() });

  // Wait for initial data
  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  // Create new job
  await user.click(screen.getByRole('button', { name: 'Add Job' }));

  // Should immediately show in list (optimistic)
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});
```
