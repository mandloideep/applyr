# Services & React Query Guide

This guide explains how to structure API services, queries, and mutations using React Query.

## Architecture Overview

```
1. API Routes       → Central route constants
2. API Functions    → Fetch/axios calls to backend
3. Query Factories  → Query key + function bundles
4. Hooks            → useQuery/useMutation wrappers
5. Shared Types     → Types from packages/ folder
```

## File Structure

```
src/
├── services/
│   ├── api-routes.ts           # All API route constants
│   ├── api-client.ts           # Axios/fetch client setup
│   ├── posts/
│   │   ├── api.ts              # API functions (fetch calls)
│   │   ├── queries.ts          # Query definitions
│   │   ├── mutations.ts        # Mutation definitions
│   │   └── types.ts            # Service-specific types (if needed)
│   ├── users/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   └── mutations.ts
│   └── auth/
│       ├── api.ts
│       ├── queries.ts
│       └── mutations.ts
packages/
└── shared/
    └── src/
        └── types/
            ├── post.ts         # Shared Post type
            └── user.ts         # Shared User type
```

---

## Step 1: API Routes Constants

Central place for all backend routes. When backend routes change, update here only.

**File: `src/services/api-routes.ts`**

```typescript
/**
 * API Routes Constants
 *
 * All backend API routes are defined here.
 * When backend routes change, update this file only.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const API_ROUTES = {
  // Auth
  auth: {
    login: `${API_BASE}/auth/login`,
    logout: `${API_BASE}/auth/logout`,
    register: `${API_BASE}/auth/register`,
    me: `${API_BASE}/auth/me`,
    refresh: `${API_BASE}/auth/refresh`,
  },

  // Posts
  posts: {
    list: `${API_BASE}/posts`,
    detail: (id: string) => `${API_BASE}/posts/${id}`,
    create: `${API_BASE}/posts`,
    update: (id: string) => `${API_BASE}/posts/${id}`,
    delete: (id: string) => `${API_BASE}/posts/${id}`,
    publish: (id: string) => `${API_BASE}/posts/${id}/publish`,
  },

  // Users
  users: {
    list: `${API_BASE}/users`,
    detail: (id: string) => `${API_BASE}/users/${id}`,
    update: (id: string) => `${API_BASE}/users/${id}`,
  },

  // Applications (example domain)
  applications: {
    list: `${API_BASE}/applications`,
    detail: (id: string) => `${API_BASE}/applications/${id}`,
    create: `${API_BASE}/applications`,
    update: (id: string) => `${API_BASE}/applications/${id}`,
    delete: (id: string) => `${API_BASE}/applications/${id}`,
    updateStatus: (id: string) => `${API_BASE}/applications/${id}/status`,
  },
} as const;
```

---

## Step 2: API Client Setup

Configure fetch/axios with auth headers, error handling, etc.

**File: `src/services/api-client.ts`**

```typescript
import { authClient } from "@/lib/auth-client"; // Better Auth client

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

/**
 * API Client with authentication and error handling
 */
export async function apiClient<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Add query params
  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl += `?${queryString}`;
    }
  }

  // Get auth session for headers
  const session = await authClient.getSession();

  const response = await fetch(finalUrl, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(session?.token && {
        Authorization: `Bearer ${session.token}`,
      }),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }

  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(url: string, params?: RequestOptions["params"]) =>
    apiClient<T>(url, { method: "GET", params }),

  post: <T>(url: string, data?: unknown) =>
    apiClient<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(url: string, data?: unknown) =>
    apiClient<T>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(url: string, data?: unknown) =>
    apiClient<T>(url, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string) => apiClient<T>(url, { method: "DELETE" }),
};
```

---

## Step 3: API Functions

Each service has its own API file with fetch calls.

**File: `src/services/posts/api.ts`**

```typescript
import { api } from "../api-client";
import { API_ROUTES } from "../api-routes";
import type { Post, CreatePostInput, UpdatePostInput } from "@shared/types/post";

/**
 * Posts API Functions
 */
export const postsApi = {
  // Get all posts
  list: async (params?: { page?: number; limit?: number; status?: string }) => {
    return api.get<{ posts: Post[]; total: number }>(API_ROUTES.posts.list, params);
  },

  // Get single post
  detail: async (id: string) => {
    return api.get<Post>(API_ROUTES.posts.detail(id));
  },

  // Create post
  create: async (data: CreatePostInput) => {
    return api.post<Post>(API_ROUTES.posts.create, data);
  },

  // Update post
  update: async (id: string, data: UpdatePostInput) => {
    return api.put<Post>(API_ROUTES.posts.update(id), data);
  },

  // Delete post
  delete: async (id: string) => {
    return api.delete<void>(API_ROUTES.posts.delete(id));
  },

  // Publish post
  publish: async (id: string) => {
    return api.post<Post>(API_ROUTES.posts.publish(id));
  },
};
```

---

## Step 4: Query Definitions

Use query factory pattern for organized, reusable queries.

**File: `src/services/posts/queries.ts`**

```typescript
import { queryOptions } from "@tanstack/react-query";
import { postsApi } from "./api";

/**
 * Posts Query Factory
 *
 * Usage:
 *   useQuery(postsQueries.list())
 *   useQuery(postsQueries.detail(postId))
 */
export const postsQueries = {
  // Base key for all post queries
  all: () => ["posts"] as const,

  // List queries
  lists: () => [...postsQueries.all(), "list"] as const,

  list: (params?: { page?: number; limit?: number; status?: string }) =>
    queryOptions({
      queryKey: [...postsQueries.lists(), params] as const,
      queryFn: () => postsApi.list(params),
    }),

  // Detail queries
  details: () => [...postsQueries.all(), "detail"] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...postsQueries.details(), id] as const,
      queryFn: () => postsApi.detail(id),
      enabled: !!id,
    }),
};
```

### Using Queries in Components

```typescript
import { useQuery } from '@tanstack/react-query'
import { postsQueries } from '@/services/posts/queries'

function PostsList() {
  const { data, isLoading, error } = useQuery(postsQueries.list({ page: 1 }))

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

function PostDetail({ postId }: { postId: string }) {
  const { data: post } = useQuery(postsQueries.detail(postId))

  return <article>{post?.title}</article>
}
```

---

## Step 5: Mutation Definitions

**File: `src/services/posts/mutations.ts`**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "./api";
import { postsQueries } from "./queries";
import type { CreatePostInput, UpdatePostInput } from "@shared/types/post";

/**
 * Create Post Mutation
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostInput) => postsApi.create(data),
    onSuccess: () => {
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: postsQueries.lists() });
    },
  });
}

/**
 * Update Post Mutation
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostInput }) => postsApi.update(id, data),
    onSuccess: (updatedPost, { id }) => {
      // Update cache directly
      queryClient.setQueryData(postsQueries.detail(id).queryKey, updatedPost);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: postsQueries.lists() });
    },
  });
}

/**
 * Delete Post Mutation
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: postsQueries.detail(id).queryKey });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: postsQueries.lists() });
    },
  });
}

/**
 * Publish Post Mutation
 */
export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postsApi.publish(id),
    onSuccess: (updatedPost, id) => {
      queryClient.setQueryData(postsQueries.detail(id).queryKey, updatedPost);
      queryClient.invalidateQueries({ queryKey: postsQueries.lists() });
    },
  });
}
```

### Using Mutations in Components

```typescript
import { useCreatePost, useDeletePost } from '@/services/posts/mutations'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

function CreatePostForm() {
  const navigate = useNavigate()
  const createPost = useCreatePost()

  const handleSubmit = (data: CreatePostInput) => {
    createPost.mutate(data, {
      onSuccess: (newPost) => {
        toast.success('Post created!')
        navigate({ to: '/posts/$postId', params: { postId: newPost.id } })
      },
      onError: (error) => {
        toast.error(`Failed: ${error.message}`)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}

function DeleteButton({ postId }: { postId: string }) {
  const deletePost = useDeletePost()

  return (
    <button
      onClick={() => deletePost.mutate(postId)}
      disabled={deletePost.isPending}
    >
      Delete
    </button>
  )
}
```

---

## Step 6: Shared Types (from packages/)

Types shared between frontend and backend.

**File: `packages/shared/src/types/post.ts`**

```typescript
export type Post = {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePostInput = {
  title: string;
  content: string;
};

export type UpdatePostInput = Partial<CreatePostInput> & {
  status?: "draft" | "published";
};
```

Import in frontend:

```typescript
import type { Post, CreatePostInput } from "@shared/types/post";
```

---

## Better Auth Integration

**File: `src/lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

export const { useSession, signIn, signOut, signUp } = authClient;
```

**File: `src/services/auth/queries.ts`**

```typescript
import { queryOptions } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const authQueries = {
  session: () =>
    queryOptions({
      queryKey: ["auth", "session"] as const,
      queryFn: () => authClient.getSession(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
};
```

**File: `src/services/auth/mutations.ts`**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { authQueries } from "./queries";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authClient.signIn.email(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueries.session().queryKey });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: () => {
      queryClient.clear(); // Clear all cached data on logout
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) =>
      authClient.signUp.email(data),
  });
}
```

---

## Query Key Structure

Consistent query key patterns for easy invalidation:

```typescript
// All posts queries
["posts"][
  // All list queries
  ("posts", "list")
][
  // Specific list with params
  ("posts", "list", { page: 1, status: "published" })
][
  // All detail queries
  ("posts", "detail")
][
  // Specific post
  ("posts", "detail", "abc123")
];
```

### Invalidation Examples

```typescript
const queryClient = useQueryClient();

// Invalidate all post queries
queryClient.invalidateQueries({ queryKey: ["posts"] });

// Invalidate only list queries
queryClient.invalidateQueries({ queryKey: postsQueries.lists() });

// Invalidate specific post
queryClient.invalidateQueries({ queryKey: postsQueries.detail("abc123").queryKey });
```

---

## Complete Service Example

**File: `src/services/applications/api.ts`**

```typescript
import { api } from "../api-client";
import { API_ROUTES } from "../api-routes";
import type { Application, CreateApplicationInput } from "@shared/types/application";

export const applicationsApi = {
  list: (params?: { status?: string; page?: number }) =>
    api.get<{ applications: Application[]; total: number }>(API_ROUTES.applications.list, params),

  detail: (id: string) => api.get<Application>(API_ROUTES.applications.detail(id)),

  create: (data: CreateApplicationInput) =>
    api.post<Application>(API_ROUTES.applications.create, data),

  update: (id: string, data: Partial<CreateApplicationInput>) =>
    api.put<Application>(API_ROUTES.applications.update(id), data),

  delete: (id: string) => api.delete<void>(API_ROUTES.applications.delete(id)),

  updateStatus: (id: string, status: string) =>
    api.patch<Application>(API_ROUTES.applications.updateStatus(id), { status }),
};
```

**File: `src/services/applications/queries.ts`**

```typescript
import { queryOptions } from "@tanstack/react-query";
import { applicationsApi } from "./api";

export const applicationsQueries = {
  all: () => ["applications"] as const,
  lists: () => [...applicationsQueries.all(), "list"] as const,
  list: (params?: { status?: string; page?: number }) =>
    queryOptions({
      queryKey: [...applicationsQueries.lists(), params] as const,
      queryFn: () => applicationsApi.list(params),
    }),
  details: () => [...applicationsQueries.all(), "detail"] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...applicationsQueries.details(), id] as const,
      queryFn: () => applicationsApi.detail(id),
      enabled: !!id,
    }),
};
```

**File: `src/services/applications/mutations.ts`**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "./api";
import { applicationsQueries } from "./queries";

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsQueries.lists() });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      applicationsApi.updateStatus(id, status),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(applicationsQueries.detail(id).queryKey, updated);
      queryClient.invalidateQueries({ queryKey: applicationsQueries.lists() });
    },
  });
}
```

---

## Summary

| File                     | Purpose                                        |
| ------------------------ | ---------------------------------------------- |
| `api-routes.ts`          | Central route constants (easy backend updates) |
| `api-client.ts`          | Fetch wrapper with auth, error handling        |
| `{service}/api.ts`       | Raw API calls                                  |
| `{service}/queries.ts`   | Query factories with `queryOptions()`          |
| `{service}/mutations.ts` | Mutation hooks with cache updates              |
| `packages/shared/types/` | Shared types between frontend/backend          |

---

## Optimistic Updates

Update the UI immediately before the server responds, then rollback on error.

### Basic Optimistic Update

```typescript
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostInput }) => postsApi.update(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: postsQueries.detail(id).queryKey });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData(postsQueries.detail(id).queryKey);

      // Optimistically update cache
      queryClient.setQueryData(postsQueries.detail(id).queryKey, (old: Post) => ({
        ...old,
        ...data,
      }));

      // Return context for rollback
      return { previousPost };
    },

    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(postsQueries.detail(id).queryKey, context.previousPost);
      }
    },

    onSettled: (_, __, { id }) => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: postsQueries.detail(id).queryKey });
    },
  });
}
```

### Optimistic Update for List

```typescript
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postsApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: postsQueries.lists() });

      // Snapshot all list queries
      const previousLists = queryClient.getQueriesData({ queryKey: postsQueries.lists() });

      // Optimistically remove from all lists
      queryClient.setQueriesData(
        { queryKey: postsQueries.lists() },
        (old: { posts: Post[]; total: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            posts: old.posts.filter((post) => post.id !== id),
            total: old.total - 1,
          };
        }
      );

      return { previousLists };
    },

    onError: (err, id, context) => {
      // Restore all list queries
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postsQueries.lists() });
    },
  });
}
```

---

## Infinite Queries

Load data in pages with "load more" or infinite scroll.

### Define Infinite Query

```typescript
import { infiniteQueryOptions } from "@tanstack/react-query";

export const postsQueries = {
  // ... other queries

  infinite: (params?: { status?: string }) =>
    infiniteQueryOptions({
      queryKey: [...postsQueries.lists(), "infinite", params] as const,
      queryFn: ({ pageParam }) => postsApi.list({ ...params, page: pageParam, limit: 10 }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        const totalLoaded = allPages.reduce((sum, page) => sum + page.posts.length, 0);
        return totalLoaded < lastPage.total ? allPages.length + 1 : undefined;
      },
      getPreviousPageParam: (firstPage, allPages) => {
        return allPages.length > 1 ? allPages.length - 1 : undefined;
      },
    }),
};
```

### Use Infinite Query

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

function InfinitePostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery(postsQueries.infinite({ status: 'published' }))

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {/* Flatten pages into single list */}
      {data?.pages.flatMap((page) =>
        page.posts.map((post) => (
          <article key={post.id}>{post.title}</article>
        ))
      )}

      {/* Load more button */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

### Infinite Scroll with Intersection Observer

```typescript
import { useInView } from 'react-intersection-observer'

function InfiniteScrollList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(postsQueries.infinite())

  const { ref, inView } = useInView()

  // Auto-fetch when sentinel is visible
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div>
      {data?.pages.flatMap((page) =>
        page.posts.map((post) => <PostCard key={post.id} post={post} />)
      )}

      {/* Sentinel element */}
      <div ref={ref}>
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  )
}
```

---

## Suspense Queries

Use React Suspense for loading states with guaranteed data.

### useSuspenseQuery

```typescript
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Component - data is guaranteed to be defined
function PostDetail({ postId }: { postId: string }) {
  const { data: post } = useSuspenseQuery(postsQueries.detail(postId))

  // No need to check for undefined - data is guaranteed
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}

// Parent component with Suspense boundary
function PostPage({ postId }: { postId: string }) {
  return (
    <ErrorBoundary fallback={<div>Error loading post</div>}>
      <Suspense fallback={<PostSkeleton />}>
        <PostDetail postId={postId} />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### useSuspenseInfiniteQuery

```typescript
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

function PostsList() {
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery(
    postsQueries.infinite()
  )

  // data.pages is guaranteed to exist
  return (
    <div>
      {data.pages.flatMap((page) =>
        page.posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  )
}
```

### Parallel Suspense Queries

```typescript
import { useSuspenseQueries } from '@tanstack/react-query'

function Dashboard() {
  const [postsQuery, usersQuery, statsQuery] = useSuspenseQueries({
    queries: [
      postsQueries.list({ limit: 5 }),
      usersQueries.list({ limit: 5 }),
      statsQueries.dashboard(),
    ],
  })

  // All data is guaranteed to be defined
  return (
    <div>
      <RecentPosts posts={postsQuery.data.posts} />
      <RecentUsers users={usersQuery.data.users} />
      <Stats data={statsQuery.data} />
    </div>
  )
}
```

---

## Query Configuration Options

### staleTime vs gcTime

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache kept for 30 minutes (was cacheTime in v4)
    },
  },
});
```

| Option                 | Default | Description                         |
| ---------------------- | ------- | ----------------------------------- |
| `staleTime`            | 0       | Time until data is considered stale |
| `gcTime`               | 5 min   | Time unused cache is kept in memory |
| `refetchOnWindowFocus` | true    | Refetch when window regains focus   |
| `refetchOnReconnect`   | true    | Refetch when network reconnects     |
| `refetchOnMount`       | true    | Refetch when component mounts       |
| `retry`                | 3       | Number of retry attempts on failure |

### Per-Query Configuration

```typescript
export const postsQueries = {
  detail: (id: string) =>
    queryOptions({
      queryKey: [...postsQueries.details(), id] as const,
      queryFn: () => postsApi.detail(id),
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }),
};
```

### Placeholder Data

Show placeholder while loading (different from initialData).

```typescript
const { data } = useQuery({
  ...postsQueries.detail(postId),
  placeholderData: {
    id: postId,
    title: "Loading...",
    content: "",
    status: "draft",
  },
});
```

### Keep Previous Data

Keep showing old data while fetching new data (useful for pagination).

```typescript
const { data, isPlaceholderData } = useQuery({
  ...postsQueries.list({ page }),
  placeholderData: (previousData) => previousData, // Keep previous data
});

// isPlaceholderData is true while fetching with previous data shown
```

---

## Prefetching

Load data before it's needed.

### Prefetch on Hover

```typescript
function PostLink({ postId }: { postId: string }) {
  const queryClient = useQueryClient()

  const prefetch = () => {
    queryClient.prefetchQuery(postsQueries.detail(postId))
  }

  return (
    <Link
      to="/posts/$postId"
      params={{ postId }}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      View Post
    </Link>
  )
}
```

### Prefetch in Route Loader

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params, context }) => {
    // Prefetch data before route renders
    await context.queryClient.ensureQueryData(postsQueries.detail(params.postId));
  },
  component: PostPage,
});
```

### Prefetch Infinite Query

```typescript
queryClient.prefetchInfiniteQuery({
  ...postsQueries.infinite(),
  pages: 1, // Only prefetch first page
});
```

---

## Dependent Queries

Queries that depend on other data.

### Using `enabled` Option

```typescript
function UserPosts({ userId }: { userId: string }) {
  // First query
  const { data: user } = useQuery(usersQueries.detail(userId))

  // Dependent query - only runs when user data is available
  const { data: posts } = useQuery({
    ...postsQueries.list({ authorId: user?.id }),
    enabled: !!user?.id, // Only run when user.id exists
  })

  return (
    <div>
      <h2>{user?.name}'s Posts</h2>
      {posts?.posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  )
}
```

### Chained Queries

```typescript
function PostWithComments({ postId }: { postId: string }) {
  const postQuery = useQuery(postsQueries.detail(postId))

  const commentsQuery = useQuery({
    ...commentsQueries.list({ postId }),
    enabled: postQuery.isSuccess, // Wait for post to load
  })

  if (postQuery.isLoading) return <PostSkeleton />
  if (postQuery.isError) return <Error error={postQuery.error} />

  return (
    <article>
      <h1>{postQuery.data.title}</h1>
      {commentsQuery.isLoading ? (
        <CommentsSkeleton />
      ) : (
        <Comments comments={commentsQuery.data?.comments ?? []} />
      )}
    </article>
  )
}
```

---

## Error Handling

### Global Error Handler

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 404 or 401
        if (error instanceof ApiError) {
          if (error.status === 404 || error.status === 401) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        // Global error toast
        if (error instanceof ApiError) {
          toast.error(error.data?.message ?? error.statusText);
        } else {
          toast.error("An unexpected error occurred");
        }
      },
    },
  },
});
```

### Query-Level Error Handling

```typescript
const { data, error, isError } = useQuery({
  ...postsQueries.detail(postId),
  throwOnError: false, // Handle error in component (default)
})

if (isError) {
  if (error instanceof ApiError && error.status === 404) {
    return <NotFound />
  }
  return <ErrorMessage error={error} />
}
```

### Mutation Error Handling

```typescript
const mutation = useMutation({
  mutationFn: postsApi.create,
  onError: (error) => {
    if (error instanceof ApiError) {
      if (error.status === 422) {
        // Validation errors
        const validationErrors = error.data as Record<string, string>;
        Object.entries(validationErrors).forEach(([field, message]) => {
          form.setFieldError(field, message);
        });
      } else {
        toast.error(error.statusText);
      }
    }
  },
});
```

---

## Query Client Methods Reference

| Method                                  | Description                       |
| --------------------------------------- | --------------------------------- |
| `getQueryData(key)`                     | Get cached data for a query       |
| `setQueryData(key, data)`               | Update cached data                |
| `invalidateQueries({ queryKey })`       | Mark queries as stale and refetch |
| `refetchQueries({ queryKey })`          | Force refetch queries             |
| `cancelQueries({ queryKey })`           | Cancel in-flight queries          |
| `removeQueries({ queryKey })`           | Remove queries from cache         |
| `prefetchQuery(options)`                | Prefetch a query                  |
| `ensureQueryData(options)`              | Get data from cache or fetch      |
| `getQueriesData({ queryKey })`          | Get data for multiple queries     |
| `setQueriesData({ queryKey }, updater)` | Update multiple queries           |
| `clear()`                               | Clear entire cache                |
