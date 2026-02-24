# Server-Side Performance (HIGH)

Optimize Next.js server components, API routes, and data fetching.

## server-cache-react: Use React.cache() for Request Deduplication

**Problem**: Same data fetched multiple times in single request

❌ **Bad**:

```typescript
// components/UserProfile.tsx
async function UserProfile({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  return <div>{user.name}</div>;
}

// components/UserPosts.tsx
async function UserPosts({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId } }); // Duplicate!
  const posts = await db.post.findMany({ where: { authorId: userId } });
  return <div>{posts.length} posts by {user.name}</div>;
}

// page.tsx
export default function Page() {
  return (
    <>
      <UserProfile userId="123" /> {/* Fetches user */}
      <UserPosts userId="123" />   {/* Fetches user AGAIN! */}
    </>
  );
}
```

**Impact**: 2 database queries for same user

✅ **Good**:

```typescript
import { cache } from 'react';

// lib/queries.ts
export const getUser = cache(async (userId: string) => {
  return db.user.findUnique({ where: { id: userId } });
});

// components/UserProfile.tsx
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId); // Cached!
  return <div>{user.name}</div>;
}

// components/UserPosts.tsx
async function UserPosts({ userId }: { userId: string }) {
  const user = await getUser(userId); // Returns cached result!
  const posts = await db.post.findMany({ where: { authorId: userId } });
  return <div>{posts.length} posts by {user.name}</div>;
}
```

**Impact**: 1 database query (second call hits cache)

**When to use**: Any data fetching function that might be called multiple times per request.

**Note**: Cache is per-request only (clears after request completes).

---

## server-cache-lru: Use LRU Cache for Cross-Request Caching

**Problem**: Expensive computations repeated across requests

❌ **Bad**:

```typescript
// Runs on every request
export async function GET() {
  const stats = await db.complexQuery(); // 500ms query
  const processed = expensiveProcessing(stats); // 200ms computation

  return Response.json(processed);
}
// Total: 700ms per request
```

✅ **Good**:

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 100, // Max items
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function GET() {
  const cached = cache.get('stats');
  if (cached) {
    return Response.json(cached); // ~0ms
  }

  const stats = await db.complexQuery();
  const processed = expensiveProcessing(stats);

  cache.set('stats', processed);
  return Response.json(processed);
}
// First request: 700ms, subsequent: ~0ms for 5 minutes
```

**When to use**:

- Expensive computations
- Slowly-changing data
- Public data (not user-specific)

**When NOT to use**:

- User-specific data (use React.cache instead)
- Frequently changing data
- Large datasets (memory concerns)

---

## server-serialization: Minimize Data Passed to Client

**Problem**: Sending too much data to client components

❌ **Bad**:

```typescript
// app/posts/page.tsx
async function PostListPage() {
  const posts = await db.post.findMany({
    include: {
      author: true,
      comments: { include: { author: true } },
      tags: true,
      revisions: true, // Full edit history!
    },
  });

  // Pass entire objects to client
  return <PostList posts={posts} />;
}

// Client component gets massive payload
'use client';
export function PostList({ posts }) {
  return posts.map(post => <div key={post.id}>{post.title}</div>);
  // Only using title, but received everything!
}
```

**Impact**: Sends 500KB to client, only uses 5KB

✅ **Good**:

```typescript
async function PostListPage() {
  const posts = await db.post.findMany({
    select: {
      id: true,
      title: true,
      createdAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  // Only send what's needed
  return <PostList posts={posts} />;
}

'use client';
export function PostList({ posts }) {
  return posts.map(post => <div key={post.id}>{post.title}</div>);
}
```

**Impact**: Sends 5KB to client

**When to use**: Always select only needed fields for client components.

---

## server-parallel-fetching: Restructure for Parallel Fetches

**Problem**: Sequential data fetching in nested components

❌ **Bad**:

```typescript
// app/dashboard/page.tsx
async function DashboardPage() {
  const user = await getUser();

  return (
    <div>
      <UserHeader user={user} />
      <UserStats userId={user.id} />     {/* Waits for user */}
      <RecentActivity userId={user.id} /> {/* Waits for UserStats! */}
    </div>
  );
}

async function UserStats({ userId }) {
  const stats = await getStats(userId); // Sequential!
  return <div>{stats.count}</div>;
}

async function RecentActivity({ userId }) {
  const activity = await getActivity(userId); // Sequential!
  return <div>...</div>;
}
```

**Impact**: 3 sequential fetches (300ms each = 900ms total)

✅ **Good Option 1: Fetch in Parallel at Top**:

```typescript
async function DashboardPage() {
  const [user, stats, activity] = await Promise.all([
    getUser(),
    getStats(userId),
    getActivity(userId),
  ]);

  return (
    <div>
      <UserHeader user={user} />
      <UserStats stats={stats} />     {/* No fetch, just render */}
      <RecentActivity activity={activity} /> {/* No fetch, just render */}
    </div>
  );
}
```

**Impact**: 300ms (parallel)

✅ **Good Option 2: Use Suspense**:

```typescript
async function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <UserHeader />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <UserStats />     {/* Fetches in parallel */}
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <RecentActivity /> {/* Fetches in parallel */}
      </Suspense>
    </div>
  );
}
```

**Impact**: All fetch in parallel, stream results

---

## server-after-nonblocking: Use after() for Non-Blocking Operations

**Problem**: Logging/analytics blocks response

❌ **Bad**:

```typescript
export async function POST(request: Request) {
  const data = await request.json();
  const result = await processPayment(data);

  // Blocking operations
  await logToAnalytics(result); // 100ms
  await sendConfirmationEmail(result); // 200ms
  await updateMetrics(result); // 150ms

  return Response.json(result);
}
// User waits 450ms for logging to complete!
```

✅ **Good** (Next.js 15+):

```typescript
import { after } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  const result = await processPayment(data);

  // Non-blocking - runs after response sent
  after(async () => {
    await logToAnalytics(result);
    await sendConfirmationEmail(result);
    await updateMetrics(result);
  });

  return Response.json(result);
  // Response sent immediately, logging happens in background
}
```

**Impact**: User gets response 450ms faster

**When to use**:

- Analytics logging
- Email sending
- Metrics updates
- Cache warming
- Any operation that doesn't affect response

---

## Quick Wins Checklist

Before committing server code:

- [ ] Multiple components fetch same data? → Use `React.cache()`
- [ ] Expensive computation? → Use LRU cache
- [ ] Passing data to client component? → Select only needed fields
- [ ] Sequential fetches in nested components? → Parallelize or Suspense
- [ ] Logging/analytics in API route? → Use `after()`

## React.cache() vs LRU Cache

| Use Case                                             | Solution             |
| ---------------------------------------------------- | -------------------- |
| Same data, multiple components, **same request**     | `React.cache()`      |
| Expensive data, **across requests**, slowly changing | LRU cache            |
| User-specific data                                   | `React.cache()` only |
| Public data (same for all users)                     | LRU cache            |

## Common Patterns

### Caching Database Queries

```typescript
// lib/queries.ts
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});

export const getPosts = cache(async (authorId: string) => {
  return db.post.findMany({ where: { authorId } });
});
```

### API Route with Parallel Queries

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // Start all queries
  const [user, posts, comments] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.post.findMany({ where: { authorId: userId } }),
    db.comment.findMany({ where: { authorId: userId } }),
  ]);

  return Response.json({ user, posts, comments });
}
```

**Impact**: Can reduce server response times by 60-80%
