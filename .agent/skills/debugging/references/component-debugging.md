# Component Debugging

Debugging React component issues.

## Common Component Issues

### 1. Component Not Rendering

**Symptoms**: Component doesn't appear on page

**Debug steps**:

```typescript
// DEBUG: Check if component is being called
console.log('MyComponent rendered');

// DEBUG: Check props
console.log('props:', props);

// DEBUG: Check conditional rendering
console.log('should render:', someCondition);
```

**Common causes**:

- Conditional rendering evaluates to false
- Parent component not rendering
- CSS `display: none` hiding it
- Wrong import path
- Missing in page route

**Fix**:

1. Check React DevTools - is component in tree?
2. Check conditional logic
3. Verify parent component renders
4. Check CSS styles

### 2. Props Not Updating

**Symptoms**: Component doesn't react to prop changes

**Debug**:

```typescript
useEffect(() => {
  // DEBUG: TODO: CLEANUP
  console.log('prop changed:', propName);
}, [propName]);
```

**Common causes**:

- Object reference not changing
- Missing dependency in `useEffect`
- Memoization preventing re-render
- Parent not re-rendering

**Fix**:

```typescript
// Bad: Same reference
const data = { value: newValue };
setData(data);

// Good: New reference
setData({ value: newValue });

// Or use functional update
setData((prev) => ({ ...prev, value: newValue }));
```

### 3. State Not Updating

**Symptoms**: `setState` called but UI doesn't update

**Debug**:

```typescript
const [count, setCount] = useState(0);

const handleClick = () => {
  // DEBUG: TODO: CLEANUP
  console.log('before:', count);
  setCount(count + 1);
  console.log('after:', count); // Still old value! (async)
};

// Better debugging
useEffect(() => {
  // DEBUG: TODO: CLEANUP
  console.log('count updated:', count);
}, [count]);
```

**Common causes**:

- Using stale closure
- State batching
- Object mutation instead of new reference
- Missing state setter

**Fix**:

```typescript
// Bad: Stale closure
onClick={() => setCount(count + 1)}

// Good: Functional update
onClick={() => setCount(prev => prev + 1)}
```

### 4. Infinite Re-renders

**Symptoms**: "Too many re-renders" error

**Debug**:

```typescript
// DEBUG: TODO: CLEANUP
console.log('Component rendered');

useEffect(() => {
  // DEBUG: TODO: CLEANUP
  console.log('Effect ran');
}, [dependency]);
```

**Common causes**:

- `setState` in render
- `useEffect` without dependencies
- Object/array in dependency array
- Event handler creating new function

**Fix**:

```typescript
// Bad: Creates new object every render
const config = { value: 1 };
useEffect(() => {
  // Runs every render!
}, [config]);

// Good: Stable reference
const config = useMemo(() => ({ value: 1 }), []);
useEffect(() => {
  // Runs once
}, [config]);

// Or primitive dependency
useEffect(() => {
  const config = { value: 1 };
  // Use config here
}, []); // Stable
```

### 5. Hook Errors

**Symptoms**: "Hooks can only be called inside function components"

**Common causes**:

- Hook called conditionally
- Hook called in loop
- Hook called in regular function
- Multiple React versions

**Debug**:

```bash
# Check for multiple React versions
npm ls react
```

**Fix**:

```typescript
// Bad: Conditional hook
if (condition) {
  useState(0); // Error!
}

// Good: Hook always called
const [value, setValue] = useState(0);
if (condition) {
  // Use value here
}
```

## React DevTools

### Inspect Props/State

1. Open React DevTools
2. Select component
3. View props/state in sidebar
4. Edit values to test

### Component Highlighting

Settings → Highlight updates when components render

### Profiling

1. Start profiling
2. Perform action
3. Stop profiling
4. Analyze flame graph

## Isolation Techniques

### Binary Search

Comment out half of component:

```typescript
const MyComponent = () => {
  // return <div>Part 1</div>;
  return <div>Part 2</div>;
};
```

If bug disappears, it's in Part 1. Otherwise, Part 2.

### Extract to Minimal Example

```typescript
// Isolate problematic component
const MinimalTest = () => {
  const [state, setState] = useState(initialValue);

  // Minimal reproduction
  return <div>{state}</div>;
};
```

### Mock Props

```typescript
// Instead of real props
<MyComponent data={realData} />

// Test with static mock
<MyComponent data={mockData} />
```

If works with mock but not real data, issue is in data shape.

## Common Fixes

### Stale Closure

```typescript
// Problem
const handleClick = () => {
  // Uses old `count` value
  setTimeout(() => {
    setCount(count + 1);
  }, 1000);
};

// Fix 1: Functional update
const handleClick = () => {
  setTimeout(() => {
    setCount((prev) => prev + 1);
  }, 1000);
};

// Fix 2: Ref
const countRef = useRef(count);
countRef.current = count;

const handleClick = () => {
  setTimeout(() => {
    setCount(countRef.current + 1);
  }, 1000);
};
```

### Missing Dependencies

```typescript
// Problem
useEffect(() => {
  fetchData(userId); // userId not in deps
}, []); // Warning!

// Fix
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Object/Array Dependencies

```typescript
// Problem
const config = { url: '/api' };
useEffect(() => {
  fetch(config.url);
}, [config]); // New object every render!

// Fix 1: Primitive dependency
useEffect(() => {
  fetch(config.url);
}, [config.url]);

// Fix 2: Memoize object
const config = useMemo(() => ({ url: '/api' }), []);
useEffect(() => {
  fetch(config.url);
}, [config]);
```

## Regression Tests

After fixing, add test:

```typescript
// If component wasn't rendering
it('renders with correct props', () => {
  render(<MyComponent data={testData} />);
  expect(screen.getByText('Expected')).toBeInTheDocument();
});

// If state wasn't updating
it('updates state on click', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button'));

  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// If infinite re-render
it('does not cause infinite renders', () => {
  const renderSpy = vi.fn();

  const TestComponent = () => {
    renderSpy();
    return <MyComponent />;
  };

  render(<TestComponent />);

  // Should render limited times
  expect(renderSpy).toHaveBeenCalledTimes(1);
});
```

## Cleanup

Before commit:

```bash
# Find debug logs
grep -rn "// DEBUG:" app/ shared/
grep -rn "TODO: CLEANUP" app/ shared/
grep -rn "console.log" app/ shared/ | grep -v "console.error" | grep -v "console.warn"
```

Remove all:

- `// DEBUG:` comments
- `console.log` (keep `console.error`, `console.warn`)
- `TODO: CLEANUP` markers
