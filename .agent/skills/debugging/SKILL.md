---
name: debugging
description: Systematic debugging workflow for Next.js/React applications. Use when investigating bugs, troubleshooting issues, or diagnosing unexpected behavior. Covers isolation techniques, debugging tools, and regression prevention with tests.
---

# Debugging

Systematic approach to debugging frontend issues in Next.js/React applications.

## Debugging Workflow

```
1. Reproduce → 2. Isolate → 3. Debug → 4. Fix → 5. Test → 6. Clean up
```

### 1. Reproduce the Issue

- [ ] Can you consistently reproduce it?
- [ ] What are the exact steps?
- [ ] Does it happen in dev and production?
- [ ] Is it browser-specific?

### 2. Isolate the Problem

**Decision tree**:

```
What's failing?
├─ Not rendering → Component issue (see Component Debugging)
├─ Wrong data → API/State issue (see API Debugging)
├─ Slow performance → Performance issue (see Performance)
├─ Error thrown → Error handling (see Error Messages)
└─ Wrong behavior → Logic issue (see Logic Debugging)
```

### 3. Debug

Use appropriate debugging technique (see references below).

**Debugging logs**:

```typescript
// DEBUG: [Description of what you're checking]
console.log('variable:', variable);
```

**Mark for cleanup**:

```typescript
// DEBUG: TODO: CLEANUP
console.log('debug info');
```

### 4. Fix the Issue

Apply the fix.

### 5. Write Regression Test

**REQUIRED**: Add test to prevent issue from recurring.

Use **`testing` skill** to write appropriate test:

- Component bug → Unit test
- API bug → Integration test
- User flow bug → E2E test

### 6. Clean Up

**REQUIRED before commit**:

```bash
# Find and remove debug logs
grep -r "// DEBUG:" --include="*.ts" --include="*.tsx" .
grep -r "TODO: CLEANUP" --include="*.ts" --include="*.tsx" .
```

Remove all debug `console.log` statements (keep `console.error`, `console.warn`).

---

## When Issue is Server-Side

**If you determine the issue is in the backend/API**:

1. ✅ Document findings (what endpoint, what error)
2. ✅ Create ticket/issue for backend team
3. ❌ **STOP frontend debugging** - don't waste time
4. ✅ Add temporary error handling on frontend if needed
5. ✅ Move to next task

---

## Debugging References

Choose based on issue type:

### Component Issues

**See**: [references/component-debugging.md](references/component-debugging.md)

- Not rendering
- Incorrect props
- State not updating
- Hooks issues

### API/Data Issues

**See**: [references/api-debugging.md](references/api-debugging.md)

- Failed requests
- Wrong data
- Cache problems
- React Query issues

### Performance Issues

**See**: [references/performance-debugging.md](references/performance-debugging.md)

- Slow rendering
- Memory leaks
- Infinite loops
- Re-render optimization

### Error Messages

**See**: [references/error-debugging.md](references/error-debugging.md)

- TypeScript errors
- Runtime errors
- Build errors
- Hydration errors

---

## Quick Debugging Checklist

Before deep debugging:

- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Check React DevTools for props/state
- [ ] Check TypeScript errors (`npm run check-types`)
- [ ] Check linting errors (`npm run lint`)
- [ ] Try in incognito (rule out extensions)
- [ ] Try different browser (rule out browser-specific)
- [ ] Read error message carefully (often tells you exactly what's wrong)

---

## Common Gotchas

1. **Stale closure** - Hook dependencies missing
2. **Race condition** - Async operations completing out of order
3. **Cached data** - React Query cache or browser cache
4. **Missing error boundary** - Errors not caught
5. **Type mismatch** - API returns different shape
6. **Environment variables** - Missing or wrong `NEXT_PUBLIC_*`
7. **Hydration mismatch** - Server/client render different

---

## Best Practices

### Do

- ✅ Reproduce consistently before fixing
- ✅ Use systematic isolation
- ✅ Check docs/error messages first
- ✅ Add regression tests
- ✅ Remove debug logs before commit
- ✅ Document server-side issues

### Don't

- ❌ Make random changes hoping it fixes
- ❌ Debug without reproducing first
- ❌ Leave `console.log` in production
- ❌ Fix without understanding root cause
- ❌ Skip regression tests
- ❌ Continue if issue is server-side
