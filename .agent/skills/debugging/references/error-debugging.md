# Error Debugging

Understanding and fixing error messages.

## TypeScript Errors

### Common Errors

**1. Type 'X' is not assignable to type 'Y'**

```typescript
// Error
const num: number = '123'; // Type 'string' is not assignable to type 'number'

// Fix
const num: number = 123;
// Or
const num: number = Number('123');
```

**2. Property 'X' does not exist on type 'Y'**

```typescript
// Error
interface User {
  name: string;
}
const user: User = { name: 'John' };
console.log(user.age); // Property 'age' does not exist

// Fix: Add property to interface
interface User {
  name: string;
  age?: number; // Optional
}

// Or type assertion if you know it exists
console.log((user as any).age); // Not recommended
```

**3. Object is possibly 'undefined'**

```typescript
// Error
const user: User | undefined = getUser();
console.log(user.name); // Object is possibly 'undefined'

// Fix 1: Optional chaining
console.log(user?.name);

// Fix 2: Non-null assertion (only if you're sure)
console.log(user!.name);

// Fix 3: Guard
if (user) {
  console.log(user.name);
}
```

**4. Cannot find module**

```typescript
// Error
import { Component } from './Component'; // Cannot find module

// Fix: Check file exists and path is correct
// - Correct: './Component' if file is Component.tsx
// - Check capitalization
// - Check file extension
```

## Runtime Errors

### 1. TypeError

**Symptoms**: "Cannot read property 'X' of undefined/null"

```typescript
// Error
const user = null;
console.log(user.name); // Cannot read property 'name' of null

// Debug
console.log('user:', user); // Check what user is

// Fix
if (user) {
  console.log(user.name);
}
// Or
console.log(user?.name);
```

### 2. ReferenceError

**Symptoms**: "X is not defined"

```typescript
// Error
console.log(notDefined); // ReferenceError: notDefined is not defined

// Fix: Declare variable
const notDefined = 'value';
console.log(notDefined);
```

### 3. SyntaxError

**Symptoms**: Unexpected token, missing closing bracket

```typescript
// Error
const obj = { // Unexpected end of input
  name: "John"
// Missing closing brace

// Fix: Add closing brace
const obj = {
  name: "John"
};
```

## React Errors

### 1. "Too many re-renders"

**Cause**: Setting state in render

```typescript
// Error
const Component = () => {
  setState(value); // Called every render!
  return <div />;
};

// Fix
const Component = () => {
  useEffect(() => {
    setState(value);
  }, []);
  return <div />;
};
```

### 2. "Rendered fewer hooks than expected"

**Cause**: Conditional hooks

```typescript
// Error
const Component = () => {
  if (condition) {
    useState(0); // Conditional hook!
  }
  return <div />;
};

// Fix
const Component = () => {
  const [state, setState] = useState(0); // Always call
  if (condition) {
    // Use state here
  }
  return <div />;
};
```

### 3. Hydration mismatch

**Symptoms**: "Text content does not match server-rendered HTML"

**Cause**: Server renders different HTML than client

```typescript
// Error: Date changes between server and client
const Component = () => {
  return <div>{new Date().toString()}</div>;
};

// Fix 1: Client-only rendering
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;

return <div>{new Date().toString()}</div>;

// Fix 2: Suppress hydration warning (use sparingly)
<div suppressHydrationWarning>
  {new Date().toString()}
</div>
```

### 4. "Cannot update a component while rendering a different component"

**Cause**: Setting state in render

```typescript
// Error
const Parent = () => {
  return <Child onRender={() => setParentState()} />;
};

const Child = ({ onRender }) => {
  onRender(); // Called during render!
  return <div />;
};

// Fix: Use useEffect
const Child = ({ onRender }) => {
  useEffect(() => {
    onRender();
  }, [onRender]);
  return <div />;
};
```

## Next.js Errors

### 1. "Module not found" in production

**Cause**: Case-sensitive imports

```typescript
// Error (works locally, fails in production)
import Component from './Component'; // File is component.tsx

// Fix: Match case exactly
import Component from './component';
```

### 2. "window is not defined"

**Cause**: Using browser API in SSR

```typescript
// Error
const width = window.innerWidth; // ReferenceError in SSR

// Fix: Check if window exists
const width = typeof window !== 'undefined' ? window.innerWidth : 0;

// Or use useEffect
const [width, setWidth] = useState(0);

useEffect(() => {
  setWidth(window.innerWidth);
}, []);
```

### 3. "Unhandled Runtime Error"

**Add error boundary**:

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  console.error(error);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Build Errors

### 1. "Failed to compile"

Check error message carefully:

- Syntax errors (missing bracket, etc.)
- Type errors
- Import errors
- Missing dependencies

```bash
# Clear cache and retry
rm -rf .next
npm run dev
```

### 2. "Module parse failed"

**Cause**: Importing wrong file type

```typescript
// Error
import data from './file.csv'; // Can't import CSV

// Fix: Use proper loader or read as text
import data from './file.json'; // JSON works
```

### 3. "Out of memory"

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Debugging Steps

1. **Read error message carefully** - Often tells you exactly what's wrong
2. **Check line number** - Go to exact line in error
3. **Check recent changes** - What did you change recently?
4. **Google error message** - Likely someone had same issue
5. **Check TypeScript** - `npm run check-types`
6. **Check linting** - `npm run lint`
7. **Clear cache** - `rm -rf .next && npm run dev`
8. **Restart dev server** - Stop and start again

## Prevention

After fixing error:

```typescript
// Add type safety
interface Props {
  user: User | null; // Explicit null handling
  data?: string; // Optional prop
}

// Add validation
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

const validated = schema.parse(data); // Throws if invalid

// Add error boundary
<ErrorBoundary>
  <Component />
</ErrorBoundary>

// Add regression test
it('handles null user', () => {
  render(<Component user={null} />);
  expect(screen.getByText('No user')).toBeInTheDocument();
});
```

## Cleanup

Remove error debugging code:

```bash
grep -rn "console.error" app/ shared/ | grep "DEBUG"
grep -rn "debugger" app/ shared/
grep -rn "// Error:" app/ shared/
```

Keep legitimate `console.error` for production error logging.
