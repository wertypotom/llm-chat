# Eliminating Waterfalls (CRITICAL)

Sequential async operations are the #1 performance killer. Eliminate waterfalls for massive speed improvements.

## async-parallel: Use Promise.all() for Independent Operations

**Problem**: Sequential awaits create waterfalls

❌ **Bad**:

```typescript
// Takes 600ms (300ms + 300ms)
async function getPageData() {
  const user = await fetchUser(); // 300ms
  const posts = await fetchPosts(); // 300ms (waits for user!)
  return { user, posts };
}
```

✅ **Good**:

```typescript
// Takes 300ms (parallel)
async function getPageData() {
  const [user, posts] = await Promise.all([
    fetchUser(), // 300ms
    fetchPosts(), // 300ms (runs in parallel!)
  ]);
  return { user, posts };
}
```

**When to use**: Whenever operations don't depend on each other.

---

## async-defer-await: Move await Into Branches

**Problem**: Awaiting too early blocks code that doesn't need the result

❌ **Bad**:

```typescript
async function processOrder(userId: string, isPremium: boolean) {
  const user = await fetchUser(userId); // Always waits

  if (isPremium) {
    return processPremiumOrder(user);
  }

  return processStandardOrder(); // Didn't even need user!
}
```

✅ **Good**:

```typescript
async function processOrder(userId: string, isPremium: boolean) {
  if (isPremium) {
    const user = await fetchUser(userId); // Only await when needed
    return processPremiumOrder(user);
  }

  return processStandardOrder(); // No unnecessary wait
}
```

**When to use**: When result is only needed in certain branches.

---

## async-dependencies: Use Promise.allSettled for Partial Dependencies

**Problem**: Some operations depend on previous results, but not all

❌ **Bad**:

```typescript
async function getDashboard() {
  const user = await fetchUser(); // 300ms
  const profile = await fetchProfile(user.id); // 200ms (depends on user)
  const posts = await fetchPosts(); // 300ms (doesn't depend on anything!)
  return { user, profile, posts };
}
// Total: 800ms
```

✅ **Good**:

```typescript
async function getDashboard() {
  const userPromise = fetchUser();
  const postsPromise = fetchPosts(); // Start immediately!

  const user = await userPromise; // 300ms
  const [profile, posts] = await Promise.all([
    fetchProfile(user.id), // 200ms
    postsPromise, // Already running!
  ]);

  return { user, profile, posts };
}
// Total: 500ms (300ms + 200ms, posts finish before profile)
```

**When to use**: Mixed dependencies - start independent work early.

---

## async-api-routes: Start Promises Early, Await Late

**Problem**: API routes that await sequentially

❌ **Bad**:

```typescript
// app/api/dashboard/route.ts
export async function GET() {
  const user = await db.user.findUnique({ where: { id: userId } });
  const stats = await db.stats.aggregate({ where: { userId } });
  const recent = await db.activity.findMany({ where: { userId }, take: 10 });

  return Response.json({ user, stats, recent });
}
// Sequential: ~600ms
```

✅ **Good**:

```typescript
export async function GET() {
  // Start all promises immediately
  const userPromise = db.user.findUnique({ where: { id: userId } });
  const statsPromise = db.stats.aggregate({ where: { userId } });
  const recentPromise = db.activity.findMany({ where: { userId }, take: 10 });

  // Await all at once
  const [user, stats, recent] = await Promise.all([userPromise, statsPromise, recentPromise]);

  return Response.json({ user, stats, recent });
}
// Parallel: ~200ms (time of slowest query)
```

**When to use**: Always in API routes with multiple independent queries.

---

## async-suspense-boundaries: Use Suspense for Streaming

**Problem**: Waiting for entire page to load before showing anything

❌ **Bad**:

```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  const user = await fetchUser(); // 300ms
  const posts = await fetchPosts(); // 2000ms - slow!

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
    </div>
  );
}
// User sees nothing for 2300ms
```

✅ **Good**:

```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <PostList />
      </Suspense>
    </div>
  );
}

// Separate component
async function UserProfile() {
  const user = await fetchUser(); // 300ms
  return <div>{user.name}</div>;
}

async function PostList() {
  const posts = await fetchPosts(); // 2000ms
  return <div>{/* posts */}</div>;
}
// User sees UserProfile after 300ms, PostList after 2000ms (streaming!)
```

**When to use**: Mix of fast and slow data - stream fast content first.

---

## Quick Wins Checklist

Before committing async code:

- [ ] Can any `await` statements run in parallel? → `Promise.all()`
- [ ] Is `await` used in all branches? → Defer to branches where needed
- [ ] Are there dependencies? → Start independent work early
- [ ] API route with multiple queries? → Start all promises first
- [ ] Mix of fast/slow data? → Use Suspense boundaries

## Common Patterns

### Database Queries in Server Components

```typescript
// ❌ Bad: Sequential
const user = await db.user.findUnique({ where: { id } });
const posts = await db.post.findMany({ where: { authorId: user.id } });

// ✅ Good: Parallel where possible
const userPromise = db.user.findUnique({ where: { id } });
const postsPromise = db.post.findMany({ where: { authorId: id } }); // Use id directly

const [user, posts] = await Promise.all([userPromise, postsPromise]);
```

### Combining Server and External APIs

```typescript
// ❌ Bad: Sequential
const dbData = await db.getData();
const apiData = await fetch('https://api.example.com/data').then((r) => r.json());

// ✅ Good: Parallel
const [dbData, apiData] = await Promise.all([
  db.getData(),
  fetch('https://api.example.com/data').then((r) => r.json()),
]);
```

**Impact**: Can reduce load times by 50-80% in typical applications.
