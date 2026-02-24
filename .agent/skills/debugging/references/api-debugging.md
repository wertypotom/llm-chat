# API Debugging

Debugging API and data fetching issues.

## Common API Issues

### 1. Failed Requests

**Symptoms**: Network error, 404, 500, CORS error

**Debug**:

1. Open Browser DevTools → Network tab
2. Find failed request
3. Check:
   - Request URL (correct endpoint?)
   - Request method (GET/POST/etc)
   - Request headers (auth token?)
   - Request body (correct format?)
   - Response status code
   - Response body (error message?)

```typescript
// DEBUG: Log request details
console.log('Fetching:', url, { method, headers, body });

// DEBUG: Log response
fetch(url)
  .then((res) => {
    console.log('Response status:', res.status);
    return res.json();
  })
  .then((data) => {
    console.log('Response data:', data);
  });
```

**Common causes**:

- Wrong API endpoint
- Missing authentication
- CORS not configured
- Server down/error
- Wrong request method
- Invalid request body

**Fixes**:

```typescript
// Missing auth token
const headers = {
  Authorization: `Bearer ${token}`, // Add this
  'Content-Type': 'application/json',
};

// Wrong content type
await fetch(url, {
  headers: { 'Content-Type': 'application/json' }, // Not form-data
  body: JSON.stringify(data), // Stringify JSON
});

// CORS (backend fix, not frontend)
// Add to backend:
// res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
```

### 2. Wrong Data Returned

**Symptoms**: Data exists but wrong shape/values

**Debug**:

```typescript
// DEBUG: Log full response
const { data } = await api.getJobs();
console.log('API response:', JSON.stringify(data, null, 2));

// DEBUG: Check data shape
console.log('Is array:', Array.isArray(data));
console.log('Keys:', Object.keys(data));
console.log('First item:', data[0]);
```

**Common causes**:

- API changed response format
- Wrong API version
- Missing data transformation
- Type mismatch

**Fixes**:

```typescript
// Add data transformation
const transformJob = (raw: any) => ({
  id: raw.jobId, // Map to different key
  title: raw.jobTitle,
  salary: Number(raw.salary), // Convert type
});

const jobs = rawData.map(transformJob);

// Validate response shape
import { z } from 'zod';

const JobSchema = z.object({
  id: z.number(),
  title: z.string(),
  salary: z.number(),
});

const job = JobSchema.parse(data); // Throws if invalid
```

### 3. React Query Issues

**Symptoms**: Stale data, not refetching, cache problems

**Debug**:

```typescript
const { data, isLoading, error, isFetching } = useQuery({
  queryKey: ['jobs'],
  queryFn: fetchJobs,
});

// DEBUG: Log query state
useEffect(() => {
  console.log('Query state:', {
    data,
    isLoading,
    isFetching,
    error,
  });
}, [data, isLoading, isFetching, error]);
```

**Use React Query DevTools**:

```typescript
// _app.tsx or layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Common issues**:

```typescript
// Stale data - force refetch
queryClient.invalidateQueries({ queryKey: ['jobs'] });

// Cache too aggressive
const { data } = useQuery({
  queryKey: ['jobs'],
  queryFn: fetchJobs,
  staleTime: 0, // Always refetch
  cacheTime: 0, // Don't cache
});

// Not refetching on mount
const { data } = useQuery({
  queryKey: ['jobs'],
  queryFn: fetchJobs,
  refetchOnMount: true, // Add this
});
```

### 4. Race Conditions

**Symptoms**: Wrong data shown, old request overwriting new

**Debug**:

```typescript
let requestId = 0;

const fetchData = async (query: string) => {
  const currentRequestId = ++requestId;

  // DEBUG: Log request
  console.log(`Request ${currentRequestId} started for:`, query);

  const data = await api.search(query);

  // DEBUG: Check if stale
  if (currentRequestId !== requestId) {
    console.log(`Request ${currentRequestId} stale, ignoring`);
    return;
  }

  console.log(`Request ${currentRequestId} using data`);
  setData(data);
};
```

**Fix with AbortController**:

```typescript
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then((res) => res.json())
    .then(setData)
    .catch((err) => {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error(err);
    });

  return () => controller.abort(); // Cleanup
}, [url]);
```

**Fix with React Query**:

```typescript
// React Query handles this automatically
const { data } = useQuery({
  queryKey: ['search', query],
  queryFn: () => api.search(query),
});
// Old requests automatically ignored
```

### 5. Mutation Failures

**Symptoms**: POST/PUT/DELETE doesn't work

**Debug**:

```typescript
const mutation = useMutation({
  mutationFn: createJob,
  onSuccess: (data) => {
    // DEBUG: TODO: CLEANUP
    console.log('Mutation success:', data);
  },
  onError: (error) => {
    // DEBUG: TODO: CLEANUP
    console.error('Mutation error:', error);
  },
});

// Check mutation state
console.log('Mutation state:', {
  isPending: mutation.isPending,
  isError: mutation.isError,
  error: mutation.error,
});
```

**Common causes**:

- Server validation error
- Missing CSRF token
- Wrong content-type
- Missing required fields

**Fixes**:

```typescript
// Add error handling
const mutation = useMutation({
  mutationFn: createJob,
  onError: (error: any) => {
    if (error.response?.status === 400) {
      // Validation error
      setErrors(error.response.data.errors);
    } else if (error.response?.status === 401) {
      // Auth error
      redirect('/login');
    } else {
      // Generic error
      toast.error('Failed to create job');
    }
  },
});
```

## Checking If Issue is Server-Side

**Indicators issue is backend**:

- ✅ All requests to endpoint fail
- ✅ Works in Postman but not app → check request headers
- ✅ Server returns 500 error → backend bug
- ✅ Server returns wrong data → backend bug
- ✅ CORS error → backend configuration
- ✅ Timeout → slow backend query

**If server-side**:

1. Document findings
2. Create backend ticket
3. **STOP frontend debugging**
4. Add error handling if needed:

```typescript
// Temporary error handling
const { data, error } = useQuery({
  queryKey: ['jobs'],
  queryFn: fetchJobs,
  retry: 3,
  retryDelay: 1000,
});

if (error) {
  return <ErrorBoundary
    message="Backend issue tracked in ticket #123"
  />;
}
```

## Network Inspector

**Chrome DevTools → Network**:

1. **Clear** - Clear requests
2. **Preserve log** - Keep across page navigation
3. **Disable cache** - Always fetch fresh
4. **Throttling** - Test slow network

**Inspect request**:

- Headers tab - Request/response headers
- Payload tab - Request body
- Preview tab - Formatted response
- Response tab - Raw response
- Timing tab - Performance

## Regression Tests

After fixing API issue:

```typescript
// Use MSW to test
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

it('handles API error', async () => {
  server.use(
    http.get('/api/jobs', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  render(<JobList />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});

it('fetches jobs successfully', async () => {
  render(<JobList />);

  await waitFor(() => {
    expect(screen.getByText('Engineer')).toBeInTheDocument();
  });
});
```

## Cleanup

Remove debug logs:

```bash
grep -rn "console.log.*API" app/ shared/
grep -rn "console.log.*fetch" app/ shared/
grep -rn "console.log.*Response" app/ shared/
```

Keep `console.error` for actual error logging.
