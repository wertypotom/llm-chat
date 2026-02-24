# Performance Debugging

Finding and fixing performance issues.

## Common Performance Issues

### 1. Slow Rendering

**Symptoms**: UI feels sluggish, delayed updates

**Debug**:

```typescript
// Time component render
const start = performance.now();

return (
  <div>
    {/* component */}
    {console.log(`Render time: ${performance.now() - start}ms`)}
  </div>
);

// Count renders
const renderCount = useRef(0);
renderCount.current++;
console.log('Render count:', renderCount.current);
```

**Use React DevTools Profiler**:

1. Start profiling
2. Perform slow action
3. Stop profiling
4. Check flame graph for slow components

**Common causes**:

- Unnecessary re-renders
- Large lists without virtualization
- Heavy computations in render
- Missing memoization

**Fixes**:

```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize components
const MemoizedChild = React.memo(ChildComponent);

// Virtualize long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{items[index]}</div>
  )}
</FixedSizeList>
```

### 2. Unnecessary Re-renders

**Symptoms**: Component renders more than needed

**Debug**:

```typescript
// Log why component re-rendered
useEffect(() => {
  console.log('Component re-rendered');
  console.log('Props:', props);
  console.log('State:', state);
});

// Use why-did-you-render plugin
import whyDidYouRender from '@welldone-software/why-did-you-render';

whyDidYouRender(React, {
  trackAllPureComponents: true,
});
```

**Common causes**:

- Parent re-renders causing child re-renders
- New object/array props every render
- Inline functions as props
- Context value changing

**Fixes**:

```typescript
// Memo child components
const Child = React.memo(({ data }) => {
  return <div>{data.name}</div>;
});

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Stable props
const config = useMemo(() => ({ theme: 'dark' }), []);

// Split context
// Bad: Entire state in one context
<AppContext.Provider value={{ user, theme, setTheme }}>

// Good: Separate contexts
<UserContext.Provider value={user}>
  <ThemeContext.Provider value={{ theme, setTheme }}>
```

### 3. Memory Leaks

**Symptoms**: Memory usage grows over time, tab crashes

**Debug**:

**Chrome DevTools → Memory**:

1. Take heap snapshot
2. Perform actions
3. Take another snapshot
4. Compare snapshots

**Common causes**:

- Event listeners not cleaned up
- Timers not cleared
- Subscriptions not unsubscribed
- Large objects held in closure

**Fixes**:

```typescript
// Clean up event listeners
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize); // Cleanup
  };
}, []);

// Clean up timers
useEffect(() => {
  const timer = setInterval(() => {
    updateTime();
  }, 1000);

  return () => clearInterval(timer); // Cleanup
}, []);

// Clean up subscriptions
useEffect(() => {
  const subscription = observable.subscribe(handleData);

  return () => subscription.unsubscribe(); // Cleanup
}, []);

// Abort fetch requests
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal }).then(setData);

  return () => controller.abort(); // Cleanup
}, [url]);
```

### 4. Bundle Size

**Symptoms**: Slow initial load

**Debug**:

```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

**Common causes**:

- Large dependencies
- Importing entire libraries
- Not code splitting
- Duplicate dependencies

**Fixes**:

```typescript
// Tree-shakeable imports
// Bad
import _ from 'lodash';
// Good
import debounce from 'lodash/debounce';

// Dynamic imports
// Bad
import HeavyComponent from './HeavyComponent';
// Good
const HeavyComponent = dynamic(() => import('./HeavyComponent'));

// Lazy load routes
const AdminPage = lazy(() => import('./AdminPage'));

// Remove unused dependencies
npm uninstall unused-package
```

### 5. Infinite Loops

**Symptoms**: Browser hangs, "Maximum update depth exceeded"

**Debug**:

```typescript
// Add counter to detect loops
let loopCount = 0;
useEffect(() => {
  loopCount++;
  console.log('Effect run:', loopCount);

  if (loopCount > 10) {
    console.error('Infinite loop detected!');
    debugger; // Pause execution
  }

  // Your effect code
}, [dependency]);
```

**Common causes**:

- `useEffect` that updates its own dependency
- State update in render
- Circular dependencies

**Fixes**:

```typescript
// Bad: Updates its own dependency
useEffect(() => {
  setData(data + 1); // Infinite loop!
}, [data]);

// Good: Use callback or remove dependency
useEffect(() => {
  setData(prev => prev + 1);
}, []); // Runs once

// Bad: setState in render
const Component = () => {
  setState(value); // Infinite loop!
  return ...;
};

// Good: setState in event handler or effect
const Component = () => {
  useEffect(() => {
    setState(value);
  }, []);
  return ...;
};
```

## Performance Best Practices

### 1. Memoization

```typescript
// useMemo for expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);

// useCallback for stable function references
const handleClick = useCallback((id: number) => {
  deleteItem(id);
}, []);

// React.memo for pure components
const ListItem = React.memo(({ item }) => {
  return <div>{item.name}</div>;
});
```

### 2. Virtualization

For long lists (>100 items):

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  )}
</FixedSizeList>
```

### 3. Code Splitting

```typescript
// Route-level splitting
const Dashboard = lazy(() => import('./Dashboard'));

// Component-level splitting
const Modal = lazy(() => import('./Modal'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### 4. Image Optimization

```typescript
// Use Next.js Image
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

## Profiling Tools

### React DevTools Profiler

- Flame graph - Component hierarchy with render times
- Ranked - Components sorted by render time
- Interactions

### Chrome Performance Tab

1. Start recording
2. Perform action
3. Stop recording
4. Analyze:
   - Long tasks (>50ms)
   - Layout thrashing
   - JavaScript execution time

### Lighthouse

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --view
```

Check:

- Performance score
- First Contentful Paint
- Time to Interactive
- Cumulative Layout Shift

## Regression Tests

After performance fix:

```typescript
// Performance test
it('renders large list efficiently', () => {
  const start = performance.now();

  render(<LargeList items={Array(1000).fill({...})} />);

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100); // Max 100ms
});

// Re-render test
it('does not re-render unnecessarily', () => {
  const renderSpy = vi.fn();

  const TestComponent = () => {
    renderSpy();
    return <MemoizedComponent />;
  };

  const { rerender } = render(<TestComponent />);

  expect(renderSpy).toHaveBeenCalledTimes(1);

  // Re-render parent
  rerender(<TestComponent />);

  // Child should not re-render if memoized
  expect(renderSpy).toHaveBeenCalledTimes(1);
});
```

## Cleanup

Remove performance debugging code:

```bash
grep -rn "performance.now()" app/ shared/
grep -rn "console.log.*Render" app/ shared/
grep -rn "debugger" app/ shared/
```
