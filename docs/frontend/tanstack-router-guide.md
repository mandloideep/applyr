# TanStack Router Setup Guide

This guide explains how to set up and use TanStack Router with type-safe navigation and search params.

## Architecture Overview

TanStack Router uses file-based routing with automatic type generation:

```
1. Route Files        → Define routes in src/routes/
2. Auto-Generation    → Plugin generates routeTree.gen.ts
3. Type-Safe Links    → Use generated types for navigation
4. Search Params      → Validate with Zod schemas
```

## File Structure

```
src/
├── routes/
│   ├── __root.tsx           # Root layout (wraps all routes)
│   ├── index.tsx            # / (home page)
│   ├── about.tsx            # /about
│   ├── posts/
│   │   ├── index.tsx        # /posts
│   │   ├── $postId.tsx      # /posts/:postId (dynamic)
│   │   └── new.tsx          # /posts/new
│   └── users.$userId.tsx    # /users/:userId (flat file naming)
├── routeTree.gen.ts         # Auto-generated (DO NOT EDIT)
└── main.tsx                 # Router setup
```

---

## Vite Configuration

The router plugin auto-generates the route tree.

**File: `vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
  ],
});
```

---

## Router Setup

**File: `src/main.tsx`**

```typescript
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'
import './styles.css'

// Create router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render
const rootElement = document.getElementById('app')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}
```

---

## Creating Routes

### Basic Route

**File: `src/routes/about.tsx`**

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About Page</div>
}
```

### Root Layout

**File: `src/routes/__root.tsx`**

```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div>
      <nav>{/* Navigation */}</nav>
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  )
}
```

### Dynamic Route (with params)

**File: `src/routes/posts/$postId.tsx`**

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostPage,
})

function PostPage() {
  const { postId } = Route.useParams()

  return <div>Post ID: {postId}</div>
}
```

---

## Type-Safe Navigation

### Why Avoid Hardcoded Strings

```typescript
// BAD - hardcoded strings break when files move
<Link to="/posts/123">View Post</Link>

// GOOD - type-safe, validated at compile time
<Link to="/posts/$postId" params={{ postId: '123' }}>View Post</Link>
```

With type-safe navigation:

- TypeScript validates route paths exist
- Required params are enforced
- Search params are type-checked
- Refactoring is safer

### Using Link Component

```typescript
import { Link } from '@tanstack/react-router'

function Navigation() {
  return (
    <nav>
      {/* Simple link */}
      <Link to="/">Home</Link>

      {/* With params */}
      <Link to="/posts/$postId" params={{ postId: '123' }}>
        View Post
      </Link>

      {/* With search params */}
      <Link to="/posts" search={{ page: 1, sort: 'date' }}>
        Posts
      </Link>

      {/* With active styling */}
      <Link
        to="/about"
        activeProps={{ className: 'text-blue-500 font-bold' }}
        inactiveProps={{ className: 'text-gray-500' }}
      >
        About
      </Link>
    </nav>
  )
}
```

### Programmatic Navigation

```typescript
import { useNavigate } from '@tanstack/react-router'

function PostActions() {
  const navigate = useNavigate()

  const handleCreate = async () => {
    const newPost = await createPost()

    // Navigate to new post
    navigate({
      to: '/posts/$postId',
      params: { postId: newPost.id },
    })
  }

  const handleSearch = (query: string) => {
    navigate({
      to: '/posts',
      search: { q: query, page: 1 },
    })
  }

  return (
    <button onClick={handleCreate}>Create Post</button>
  )
}
```

---

## Search Params

### Defining Search Params with Zod

**File: `src/routes/posts/index.tsx`**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Define search params schema
const postsSearchSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  sort: z.enum(['date', 'title', 'author']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  q: z.string().optional(),
  status: z.enum(['draft', 'published', 'all']).optional().default('all'),
})

type PostsSearch = z.infer<typeof postsSearchSchema>

export const Route = createFileRoute('/posts/')({
  // Validate and parse search params
  validateSearch: (search): PostsSearch => {
    return postsSearchSchema.parse(search)
  },
  component: PostsPage,
})

function PostsPage() {
  // Access validated search params
  const search = Route.useSearch()

  return (
    <div>
      <p>Page: {search.page}</p>
      <p>Sort: {search.sort}</p>
      <p>Query: {search.q ?? 'none'}</p>
    </div>
  )
}
```

### Using Search Params in Links

```typescript
import { Link } from '@tanstack/react-router'

function PostFilters() {
  return (
    <div>
      {/* Set specific search params */}
      <Link to="/posts" search={{ sort: 'date', order: 'desc' }}>
        Latest
      </Link>

      <Link to="/posts" search={{ sort: 'title', order: 'asc' }}>
        A-Z
      </Link>

      {/* Preserve existing + add new */}
      <Link
        to="/posts"
        search={(prev) => ({ ...prev, page: prev.page + 1 })}
      >
        Next Page
      </Link>
    </div>
  )
}
```

### Updating Search Params Programmatically

```typescript
import { useNavigate } from '@tanstack/react-router'
import { Route } from './posts'

function SearchBar() {
  const navigate = useNavigate()
  const search = Route.useSearch()

  const handleSearch = (query: string) => {
    navigate({
      to: '/posts',
      search: {
        ...search,      // Preserve existing params
        q: query,       // Update query
        page: 1,        // Reset to first page
      },
    })
  }

  return (
    <input
      type="text"
      defaultValue={search.q}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search posts..."
    />
  )
}
```

---

## Route Loaders

Load data before rendering:

**File: `src/routes/posts/$postId.tsx`**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { getPost } from '@/services/posts/api'

export const Route = createFileRoute('/posts/$postId')({
  // Load data before component renders
  loader: async ({ params }) => {
    const post = await getPost(params.postId)
    return { post }
  },
  component: PostPage,
})

function PostPage() {
  // Access loaded data (already available, no loading state needed)
  const { post } = Route.useLoaderData()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### With React Query Integration

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { postsQueries } from '@/services/posts/queries'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, context }) => {
    // Use query client from router context
    await context.queryClient.ensureQueryData(
      postsQueries.detail(params.postId)
    )
  },
  component: PostPage,
})

function PostPage() {
  const { postId } = Route.useParams()

  // Data is already in cache from loader
  const { data: post } = useQuery(postsQueries.detail(postId))

  return <article>{/* ... */}</article>
}
```

---

## Route Context

Pass data down to all routes:

**File: `src/main.tsx`**

```typescript
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});
```

**File: `src/routes/__root.tsx`**

```typescript
import { createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
```

---

## File Naming Conventions

| File Name                | Route Path            | Notes                      |
| ------------------------ | --------------------- | -------------------------- |
| `index.tsx`              | `/` (or parent path)  | Index route                |
| `about.tsx`              | `/about`              | Static route               |
| `posts/index.tsx`        | `/posts`              | Nested index               |
| `posts/$postId.tsx`      | `/posts/:postId`      | Dynamic param              |
| `posts/$postId.edit.tsx` | `/posts/:postId/edit` | Nested under dynamic       |
| `users.$userId.tsx`      | `/users/:userId`      | Flat file naming (dot = /) |
| `__root.tsx`             | N/A                   | Root layout                |
| `_layout.tsx`            | N/A                   | Pathless layout group      |

---

## Hooks Reference

| Hook                    | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `Route.useParams()`     | Get route params (`$postId` -> `{ postId: string }`) |
| `Route.useSearch()`     | Get validated search params                          |
| `Route.useLoaderData()` | Get data from route loader                           |
| `useNavigate()`         | Programmatic navigation                              |
| `useRouter()`           | Access router instance                               |
| `useMatch()`            | Check if route matches                               |

---

## Best Practices

### 1. Always Use Type-Safe Routes

```typescript
// Type-safe - errors if route doesn't exist
<Link to="/posts/$postId" params={{ postId }}>View</Link>

// NOT recommended - no type checking
<Link to={`/posts/${postId}`}>View</Link>
```

### 2. Define Search Params with Zod

```typescript
// Validated, with defaults, type-safe
const searchSchema = z.object({
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/posts/")({
  validateSearch: searchSchema.parse,
});
```

### 3. Use Loaders for Data Fetching

```typescript
// Data ready when component renders
export const Route = createFileRoute("/posts/$postId")({
  loader: ({ params }) => fetchPost(params.postId),
  component: PostPage,
});
```

### 4. Organize Related Routes in Folders

```
src/routes/
├── posts/
│   ├── index.tsx      # /posts (list)
│   ├── $postId.tsx    # /posts/:id (detail)
│   ├── new.tsx        # /posts/new (create)
│   └── $postId.edit.tsx # /posts/:id/edit
```

### 5. Use Route Context for Shared Dependencies

```typescript
// main.tsx - provide context
const router = createRouter({
  routeTree,
  context: { queryClient, auth },
});

// Any route - access context
loader: ({ context }) => {
  if (!context.auth.isAuthenticated) {
    throw redirect({ to: "/login" });
  }
};
```

---

## Authenticated Routes & Protected Routes

### Using `beforeLoad` for Auth Checks

The `beforeLoad` function runs before a route loads - perfect for auth checks.

**File: `src/routes/dashboard.tsx`**

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href, // Return here after login
        },
      });
    }
  },
  component: DashboardPage,
});
```

### Protecting Multiple Routes with Pathless Layouts

Instead of repeating auth logic, use a pathless layout route to protect all child routes.

**File Structure:**

```
src/routes/
├── __root.tsx
├── index.tsx                    # / (public)
├── login.tsx                    # /login (public)
├── _authenticated.tsx           # Auth guard (pathless layout)
├── _authenticated/
│   ├── dashboard.tsx            # /dashboard (protected)
│   ├── settings.tsx             # /settings (protected)
│   └── profile.tsx              # /profile (protected)
```

**File: `src/routes/_authenticated.tsx`**

```typescript
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: () => <Outlet />, // Render child routes
})
```

### Login Route with Redirect

**File: `src/routes/login.tsx`**

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

const loginSearchSchema = z.object({
  redirect: z.string().optional().default('/'),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema.parse,
  beforeLoad: ({ context, search }) => {
    // Already logged in? Redirect to intended destination
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const handleLogin = async () => {
    await login()
    navigate({ to: search.redirect })
  }

  return <LoginForm onSubmit={handleLogin} />
}
```

---

## Error & Loading States

### Error Component

Handle errors during route loading or rendering.

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    if (!post) throw new Error('Post not found')
    return { post }
  },
  component: PostPage,
  errorComponent: PostError,
})

function PostError({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-100 text-red-700 rounded">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
    </div>
  )
}
```

### Pending Component (Loading State)

Show loading UI while data is being fetched.

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => fetchPost(params.postId),
  pendingComponent: PostLoading,
  pendingMs: 1000,      // Show pending after 1s (default)
  pendingMinMs: 500,    // Show for at least 500ms to avoid flash
  component: PostPage,
})

function PostLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  )
}
```

### Not Found Component

Handle 404 errors at route level.

```typescript
import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    if (!post) throw notFound()
    return { post }
  },
  component: PostPage,
  notFoundComponent: () => (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold">Post Not Found</h2>
      <p className="text-gray-500">The post you're looking for doesn't exist.</p>
    </div>
  ),
})
```

### Global Defaults

Set default components at the router level.

```typescript
const router = createRouter({
  routeTree,
  defaultErrorComponent: GlobalError,
  defaultPendingComponent: GlobalLoading,
  defaultNotFoundComponent: Global404,
  notFoundMode: "fuzzy", // 'fuzzy' (default) or 'root'
});
```

---

## Navigation Blocking

Prevent users from leaving a page with unsaved changes.

### Basic Usage with `useBlocker`

```typescript
import { useBlocker } from '@tanstack/react-router'

function EditPostForm() {
  const [formIsDirty, setFormIsDirty] = useState(false)

  useBlocker({
    shouldBlockFn: () => {
      if (!formIsDirty) return false
      return !window.confirm('You have unsaved changes. Leave anyway?')
    },
  })

  return (
    <form onChange={() => setFormIsDirty(true)}>
      {/* form fields */}
    </form>
  )
}
```

### Custom Confirmation UI with `withResolver`

```typescript
import { useBlocker } from '@tanstack/react-router'

function EditPostForm() {
  const [formIsDirty, setFormIsDirty] = useState(false)

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => formIsDirty,
    withResolver: true,
  })

  return (
    <>
      <form onChange={() => setFormIsDirty(true)}>
        {/* form fields */}
      </form>

      {/* Custom confirmation dialog */}
      {status === 'blocked' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="font-bold mb-4">Unsaved Changes</h3>
            <p className="mb-4">You have unsaved changes. Are you sure you want to leave?</p>
            <div className="flex gap-2">
              <button onClick={proceed} className="bg-red-500 text-white px-4 py-2 rounded">
                Leave
              </button>
              <button onClick={reset} className="bg-gray-200 px-4 py-2 rounded">
                Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

### Block Browser Close/Refresh

```typescript
useBlocker({
  shouldBlockFn: () => formIsDirty,
  enableBeforeUnload: true, // Also block browser close/refresh
});
```

---

## Pathless Layout Routes

Group routes under shared layouts without affecting the URL path.

### File Naming Convention

Prefix with `_` to create a pathless layout:

```
src/routes/
├── _marketing.tsx              # Pathless layout
├── _marketing/
│   ├── about.tsx               # /about (not /_marketing/about)
│   ├── pricing.tsx             # /pricing
│   └── contact.tsx             # /contact
├── _dashboard.tsx              # Another pathless layout
├── _dashboard/
│   ├── overview.tsx            # /overview
│   └── analytics.tsx           # /analytics
```

**File: `src/routes/_marketing.tsx`**

```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_marketing')({
  component: MarketingLayout,
})

function MarketingLayout() {
  return (
    <div>
      <header className="bg-blue-500 text-white p-4">
        Marketing Header
      </header>
      <Outlet />
      <footer>Marketing Footer</footer>
    </div>
  )
}
```

---

## Catch-All / Splat Routes

Match any path segment with `$` suffix.

**File: `src/routes/files/$.tsx`**

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/files/$')({
  component: FilesPage,
})

function FilesPage() {
  const { _splat } = Route.useParams()

  // /files/documents/reports/2024 -> _splat = "documents/reports/2024"
  return <div>Path: {_splat}</div>
}
```

---

## Preloading Strategies

Control when route data is prefetched.

### Preload Strategies

| Strategy   | Description                           |
| ---------- | ------------------------------------- |
| `intent`   | Preload on hover/touch (default)      |
| `viewport` | Preload when Link enters viewport     |
| `render`   | Preload immediately when Link renders |

```typescript
// Router-level default
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000, // 30 seconds (default)
})

// Per-link override
<Link to="/posts" preload="viewport">
  Posts
</Link>

// Disable preloading
<Link to="/posts" preload={false}>
  Posts
</Link>
```

### Preload Stale Time

Control how long preloaded data is considered fresh:

```typescript
// Router-level
const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 0, // Always refetch (good for React Query integration)
});

// Route-level
export const Route = createFileRoute("/posts/")({
  preloadStaleTime: 60_000, // 1 minute for this route
  loader: fetchPosts,
});
```

---

## Deferred Data Loading

Stream non-critical data progressively.

### Using `defer` and `Await`

```typescript
import { createFileRoute, defer, Await } from '@tanstack/react-router'
import { Suspense } from 'react'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    // Critical data - await immediately
    const post = await fetchPost(params.postId)

    // Non-critical data - defer for streaming
    const commentsPromise = fetchComments(params.postId)
    const relatedPromise = fetchRelatedPosts(params.postId)

    return {
      post,
      comments: defer(commentsPromise),
      related: defer(relatedPromise),
    }
  },
  component: PostPage,
})

function PostPage() {
  const { post, comments, related } = Route.useLoaderData()

  return (
    <article>
      {/* Critical content renders immediately */}
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      {/* Deferred content streams in */}
      <Suspense fallback={<div>Loading comments...</div>}>
        <Await promise={comments}>
          {(resolvedComments) => (
            <CommentsList comments={resolvedComments} />
          )}
        </Await>
      </Suspense>

      <Suspense fallback={<div>Loading related...</div>}>
        <Await promise={related}>
          {(resolvedRelated) => (
            <RelatedPosts posts={resolvedRelated} />
          )}
        </Await>
      </Suspense>
    </article>
  )
}
```

---

## Code Splitting

Split route code into separate chunks for faster initial load.

### Automatic Code Splitting

With `autoCodeSplitting: true` in Vite config, routes are automatically split.

### Manual Code Splitting with `.lazy.tsx`

Split the component into a separate file:

**File: `src/routes/posts/$postId.tsx`** (critical route config)

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => fetchPost(params.postId),
  // component is in the .lazy file
});
```

**File: `src/routes/posts/$postId.lazy.tsx`** (lazy-loaded component)

```typescript
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts/$postId')({
  component: PostPage,
})

function PostPage() {
  const { post } = Route.useLoaderData()
  return <article>{post.title}</article>
}
```

### What to Split

| Keep in main file                  | Put in `.lazy.tsx`  |
| ---------------------------------- | ------------------- |
| `loader` (critical for preloading) | `component`         |
| `beforeLoad`                       | `pendingComponent`  |
| `validateSearch`                   | `errorComponent`    |
|                                    | `notFoundComponent` |

---

## Additional Hooks Reference

| Hook                 | Description                                  |
| -------------------- | -------------------------------------------- |
| `useBlocker()`       | Block navigation with unsaved changes        |
| `useRouterState()`   | Access router state (location, status, etc.) |
| `useMatches()`       | Get all matched routes                       |
| `useParentMatches()` | Get parent route matches                     |
| `useChildMatches()`  | Get child route matches                      |
| `useLocation()`      | Current location object                      |
| `useLinkProps()`     | Get props for custom link components         |
