---
name: next-best-practices
description: React and Next.js performance optimization patterns from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance. Contains 45 rules across 8 categories, prioritized by impact.
---

# Next.js Best Practices

Performance optimization patterns for React and Next.js from Vercel Engineering.

## When to Use

- ✅ Writing new React components or Next.js pages
- ✅ Implementing data fetching (server or client)
- ✅ Code review for performance
- ✅ Refactoring existing code
- ✅ Optimizing bundle size or load times

## Priority Guide

Focus on **CRITICAL** categories first, then work down:

| Priority     | Category                | Impact  | Reference                                                         |
| ------------ | ----------------------- | ------- | ----------------------------------------------------------------- |
| **CRITICAL** | Eliminating Waterfalls  | Massive | [waterfalls.md](references/waterfalls.md)                         |
| **CRITICAL** | Bundle Size             | Massive | [bundle-optimization.md](references/bundle-optimization.md)       |
| **HIGH**     | Server-Side Performance | High    | [server-performance.md](references/server-performance.md)         |
| MEDIUM-HIGH  | Client Data Fetching    | Medium  | [client-fetching.md](references/client-fetching.md)               |
| MEDIUM       | Re-render Optimization  | Medium  | See `debugging` skill                                             |
| MEDIUM       | Rendering Performance   | Medium  | See `debugging` skill                                             |
| LOW-MEDIUM   | JavaScript Performance  | Low     | [javascript-performance.md](references/javascript-performance.md) |
| LOW          | Advanced Patterns       | Low     | [advanced-patterns.md](references/advanced-patterns.md)           |

## Quick Reference by Category

### 🔴 CRITICAL: Eliminating Waterfalls

**Most impactful performance gains**:

- Use `Promise.all()` for parallel operations
- Defer `await` until actually needed
- Use Suspense boundaries for streaming
- Start promises early in API routes

**See**: [references/waterfalls.md](references/waterfalls.md)

### 🔴 CRITICAL: Bundle Size Optimization

**Reduce JavaScript sent to client**:

- Avoid barrel imports (`@/components/index`)
- Use `next/dynamic` for heavy components
- Defer third-party scripts (analytics, etc.)
- Preload on hover for perceived speed

**See**: [references/bundle-optimization.md](references/bundle-optimization.md)

### 🟠 HIGH: Server-Side Performance

**Optimize server components and API routes**:

- Use `React.cache()` for request deduplication
- Use LRU cache for cross-request caching
- Minimize data passed to client components
- Parallelize data fetching in components

**See**: [references/server-performance.md](references/server-performance.md)

### 🟡 MEDIUM-HIGH: Client Data Fetching

- Use SWR for automatic deduplication
- Deduplicate global event listeners

**See**: [references/client-fetching.md](references/client-fetching.md)

### 🟡 MEDIUM: Re-render & Rendering

**Covered in `debugging` skill**:

- `debugging/references/performance-debugging.md`

### 🟢 LOW-MEDIUM: JavaScript Performance

**Micro-optimizations for hot paths**:

- Use Set/Map for O(1) lookups
- Cache DOM/property access in loops
- Batch DOM operations

**See**: [references/javascript-performance.md](references/javascript-performance.md)

## Integration with Workflows

### During `/add-feature`

After writing components, check:

1. **Bundle size**: Any barrel imports? Heavy components need dynamic import?
2. **Waterfalls**: Any sequential awaits that could be parallel?
3. **Server optimization**: Using React.cache()? Minimizing client data?

### During Code Review

Use `frontend-code-review` skill + check these priorities:

1. CRITICAL → waterfalls, bundle
2. HIGH → server performance
3. Lower priorities if time permits

## How to Read References

Each reference contains:

- Rule explanation
- ❌ Bad example with explanation
- ✅ Good example with explanation
- When to apply

Start with CRITICAL categories, they have the biggest impact.
