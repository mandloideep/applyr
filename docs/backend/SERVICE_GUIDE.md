# Service Layer Guide

This document provides guidelines for creating and maintaining services in the Applyr backend. Services contain business logic and database operations, acting as the layer between controllers and models.

---

## 1. Overview

### Purpose of Services

Services are responsible for:

- Executing business logic and rules
- Performing database operations via Mongoose models
- Validating data for internal calls
- Throwing appropriate errors when operations fail
- Coordinating multi-step operations (with or without transactions)

Services are NOT responsible for:

- Handling HTTP requests/responses (controller's job)
- Parsing request bodies or query params (middleware's job)
- Authentication checks (middleware's job)
- Sending HTTP status codes (controller's job)

### Relationship Between Layers

```
Request → Middleware (auth, validation) → Controller → Service → Model → Database
                                              ↓
Response ← Controller ← Service (returns data or throws error)
```

- **Controller**: Receives HTTP request, calls service, sends HTTP response
- **Service**: Contains business logic, calls model, returns data or throws errors
- **Model**: Defines schema, interacts with MongoDB

### When to Use Services vs Direct Model Access

Always use services. Even for simple CRUD operations, routing through services:

- Keeps controllers thin and focused on HTTP concerns
- Makes business logic reusable across different controllers or internal calls
- Provides a single place to add validation, logging, or hooks later
- Makes testing easier by isolating business logic

---

## 2. Folder Structure

The API uses a layered architecture with clear separation between routes, controllers, services, and models.

### Standard Structure

```
apps/api/src/
├── routes/                          # Route definitions (HTTP layer)
│   ├── {feature}.routes.ts          # Route definitions for a feature
│   └── v1.ts                        # Mounts all feature routes
├── features/
│   └── {feature}/
│       ├── {feature}.controller.ts  # Request handlers
│       ├── {feature}.model.ts       # Mongoose schema & model
│       ├── services/
│       │   ├── index.ts             # Re-exports all services
│       │   ├── queries.ts           # Read operations
│       │   ├── mutations.ts         # Write operations
│       │   └── utils.ts             # Feature-specific helpers
│       └── index.ts                 # Feature exports
└── shared/
    └── utils/
        └── asyncHandler.ts          # Controller error wrapper
```

### Layer Separation

**Routes** (`routes/{feature}.routes.ts`)

- Define HTTP method + path
- Apply middleware (auth, validation)
- Map to controller handlers
- No business logic

**Controllers** (`features/{feature}/{feature}.controller.ts`)

- Extract data from request (params, body, user)
- Call service functions
- Send HTTP response
- Wrapped with asyncHandler (no try/catch needed)

**Services** (`features/{feature}/services/`)

- Pure business logic
- Receive typed data, return typed results
- No awareness of req/res
- Throw custom errors (NotFoundError, etc.)

### File Responsibilities

**`{feature}.queries.ts`** - Read Operations

- All functions that fetch data without modifying it
- Examples: findById, list, search, count, check existence
- Always use `.lean()` for performance

**`{feature}.mutations.ts`** - Write Operations

- All functions that create, update, or delete data
- Examples: create, update, softDelete, restore, archive
- Return plain objects after write operations

**`{feature}.utils.ts`** - Shared Helpers

- Helper functions used by both queries and mutations
- Examples: building query filters, formatting data, ownership checks
- Keep these pure functions when possible

**`index.ts`** - Barrel Export

- Re-exports all functions from queries, mutations, and utils
- Provides clean import paths for consumers

### When to Add More Files

**`{feature}.transactions.ts`** - Complex Multi-Document Operations

- Add this file when you have operations that require database transactions
- Examples: applying to a job (creates application + updates job + adds timeline)

**`{feature}.validators.ts`** - Service-Level Validation

- Add this file when you have complex validation logic beyond Zod schemas
- Examples: checking business rules that require database lookups

### Route File Example

```typescript
// routes/profile.routes.ts
import { Router, type Router as RouterType } from "express";
import { requireAuth } from "@/features/auth/index.js";
import { validate } from "@/shared/middlewares/index.js";
import { updateProfileSchema } from "@applyr/shared";
import * as profileController from "@/features/profile/profile.controller.js";

const router: RouterType = Router();

router.use(requireAuth);

router.get("/", profileController.getProfile);
router.patch("/", validate(updateProfileSchema), profileController.updateProfile);

export const profileRouter: RouterType = router;
```

### Controller File Example

```typescript
// features/profile/profile.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "@/shared/utils/index.js";
import * as profileService from "./services/index.js";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.findOrCreateProfile(req.user!.id);
  res.json({ success: true, data: profile });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.updateProfile(req.user!.id, req.body);
  res.json({ success: true, data: profile });
});
```

### asyncHandler Utility

The `asyncHandler` wrapper eliminates try/catch boilerplate in controllers. It catches any errors thrown by the async handler and passes them to Express error middleware.

```typescript
// shared/utils/asyncHandler.ts
import type { Request, Response, NextFunction } from "express";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

---

## 3. Naming Conventions

### Folder and File Naming

| Type            | Convention                  | Example                |
| --------------- | --------------------------- | ---------------------- |
| Feature folder  | lowercase, plural           | `features/jobs/`       |
| Services folder | lowercase                   | `services/`            |
| Query file      | `{feature}.queries.ts`      | `jobs.queries.ts`      |
| Mutation file   | `{feature}.mutations.ts`    | `jobs.mutations.ts`    |
| Utils file      | `{feature}.utils.ts`        | `jobs.utils.ts`        |
| Schema file     | `{feature}.schemas.ts`      | `jobs.schemas.ts`      |
| Test file       | `{feature}.queries.test.ts` | `jobs.queries.test.ts` |

### Function Naming

Use a mixed approach combining CRUD terminology with domain-specific language.

**Query Functions (reads)**
| Pattern | Usage | Examples |
|---------|-------|----------|
| `find{Entity}ById` | Get single record by ID | `findJobById`, `findUserById` |
| `find{Entity}By{Field}` | Get single record by specific field | `findUserByEmail` |
| `list{Entities}` | Get paginated list | `listJobs`, `listApplications` |
| `search{Entities}` | Get filtered/searched list | `searchJobs` |
| `get{Entities}By{Criteria}` | Get list by specific criteria | `getJobsByStatus`, `getApplicationsByUser` |
| `count{Entities}` | Count records | `countJobs`, `countPendingApplications` |
| `check{Entity}Exists` | Boolean existence check | `checkJobExists`, `checkEmailTaken` |

**Mutation Functions (writes)**
| Pattern | Usage | Examples |
|---------|-------|----------|
| `create{Entity}` | Create new record | `createJob`, `createApplication` |
| `update{Entity}` | Update existing record | `updateJob`, `updateProfile` |
| `softDelete{Entity}` | Mark as deleted | `softDeleteJob` |
| `hardDelete{Entity}` | Permanently remove | `hardDeleteJob` |
| `restore{Entity}` | Undo soft delete | `restoreJob` |
| `archive{Entity}` | Move to archived state | `archiveJob` |
| `{action}{Entity}` | Domain-specific action | `applyToJob`, `withdrawApplication` |

### Type Naming

| Type         | Convention                     | Example                            |
| ------------ | ------------------------------ | ---------------------------------- |
| Input types  | `{Action}{Entity}Input`        | `CreateJobInput`, `UpdateJobInput` |
| Output types | `{Entity}Result` or `{Entity}` | `JobResult`, `Job`                 |
| List output  | `{Entity}ListResult`           | `JobListResult`                    |
| Filter types | `{Entity}Filters`              | `JobFilters`                       |

### Constants Naming

| Type           | Convention              | Example                                       |
| -------------- | ----------------------- | --------------------------------------------- |
| Error messages | `{ENTITY}_{ERROR_TYPE}` | `JOB_NOT_FOUND`, `APPLICATION_ALREADY_EXISTS` |
| Defaults       | `DEFAULT_{NAME}`        | `DEFAULT_PAGE_SIZE`, `DEFAULT_SORT_ORDER`     |

---

## 4. Service Structure

### Function Signature Pattern

Every service function should follow this pattern:

```
functionName(dependencies, input) → Promise<output>
```

**Dependencies** come first and include:

- Database models needed for the operation
- Other services this function calls
- The userId for ownership/authorization context

**Input** contains the data needed for the operation:

- IDs to look up
- Data to create or update
- Filters and pagination options

**Output** is always a Promise that:

- Resolves with the result data (plain object)
- Rejects by throwing an AppError

### Dependency Injection Pattern

Pass dependencies as the first parameter object. This makes functions testable by allowing mock injection.

Dependencies typically include:

- `models`: Object containing Mongoose models needed
- `services`: Object containing other service functions needed
- `userId`: The authenticated user's ID (passed from controller)

### Export Pattern

Use named exports in individual files, then re-export through index.ts.

Each query/mutation file exports individual functions. The index.ts file imports and re-exports everything, allowing consumers to import from a single location.

---

## 5. Error Handling

### Throwing Errors

Services communicate failures by throwing errors. Never return error objects or null to indicate failure.

Use the AppError factory functions from shared utils:

- `notFound(message)` - Resource doesn't exist (404)
- `badRequest(message)` - Invalid input or business rule violation (400)
- `unauthorized(message)` - Authentication required (401)
- `forbidden(message)` - User lacks permission (403)
- `conflict(message)` - Resource conflict like duplicates (409)

### Common Error Scenarios

**Resource Not Found**
When a lookup by ID returns null, throw a notFound error with a user-friendly message. Include the resource type but not the ID in user-facing messages.

**Validation Failed**
When business rules are violated (beyond Zod schema validation), throw a badRequest error explaining what rule was violated.

**Ownership Violation**
When a user tries to access a resource they don't own, throw a forbidden error. Use a generic message to avoid leaking information about resource existence.

**Duplicate/Conflict**
When creating a resource that already exists or violates uniqueness, throw a conflict error explaining what already exists.

### Error Message Guidelines

User-facing messages should be:

- Clear and actionable
- Free of technical details (no stack traces, collection names, field names)
- Consistent in tone and format

Internal logging should include:

- Technical details
- IDs and field names
- Stack traces for unexpected errors

---

## 6. Validation

### Validation Layers

**Layer 1: Middleware (Primary)**

- Zod schemas validate request body, query params, and route params
- Happens before controller is called
- Returns 400 with validation errors if fails

**Layer 2: Service (Secondary)**

- Validate for internal calls that skip middleware
- Validate business rules that require database lookups
- Use Zod's `.parse()` or `.safeParse()` for schema validation

### Reusing Schemas from Shared Package

The `@applyr/shared` package contains Zod schemas for common operations. Import and use these in middleware. Extend or compose them for feature-specific needs.

### Service-Specific Schemas

Create `{feature}.schemas.ts` for schemas that are:

- Only used by this feature
- Internal to the service (not exposed via API)
- Extensions of shared schemas with additional fields

### When Services Should Validate

Services should validate when:

- Called internally by other services (no middleware validation)
- Business rules depend on database state (checking uniqueness, relationships)
- Input transformations create new data that needs validation

Services should NOT re-validate when:

- The controller already validated via middleware
- The data comes from a trusted internal source

---

## 7. Authorization & Ownership

### Auth Flow

1. Better Auth middleware runs first, validates session
2. Auth middleware attaches user to request
3. Controller extracts userId from request
4. Controller passes userId to service as dependency
5. Service uses userId for ownership checks and audit trails

### Ownership Check Patterns

**Check in Service Utils**
Create a utility function that verifies ownership and throws if violated. Call this at the start of mutations that modify user-owned resources.

The utility should:

- Accept the resource and userId
- Compare resource.userId (or equivalent) with provided userId
- Throw forbidden error if mismatch
- Return void if ownership confirmed

**When to Check Ownership**

Always check for:

- Update operations
- Delete operations
- Any operation that modifies user data

Usually skip for:

- Create operations (user is automatically the owner)
- Read operations on own resources (unless sensitive)
- Admin operations (different auth pattern)

### Trust Boundaries

Controllers trust that:

- Middleware has validated the session
- UserId from session is authentic

Services trust that:

- Controller has provided a valid userId
- Request has passed authentication

Services verify:

- User owns the specific resource being accessed
- Business rules are satisfied

---

## 8. Database Operations

### Using Mongoose Models

Models are passed as dependencies to service functions. This allows for easy mocking in tests and makes dependencies explicit.

### Read Operations with `.lean()`

For all read operations (queries), use `.lean()` to return plain JavaScript objects instead of Mongoose documents. This provides better performance and the result is JSON-serializable without conversion.

### Write Operations

For create operations, convert the Mongoose document to a plain object before returning. Use `.toObject()` on the saved document.

For update operations, use `findByIdAndUpdate` or similar with the `new: true` option to get the updated document. Then convert to plain object.

For all write operations, ensure the returned object does not contain Mongoose internals.

### Query Building Patterns

For complex queries with optional filters, build the query object dynamically. Only add conditions for filters that are provided (not undefined).

Create reusable query builders in utils for common filter patterns that are used across multiple functions.

---

## 9. Transactions

### When to Use Transactions

Use transactions when:

- Multiple documents must be updated atomically
- Failure in one operation should roll back previous operations
- Data consistency across collections is critical

Examples requiring transactions:

- Creating an application (application + job status + timeline event)
- Transferring ownership of resources
- Bulk operations that must all succeed or all fail

### When NOT to Use Transactions

Skip transactions when:

- Only one document is being modified
- Operations are independent and partial success is acceptable
- Performance is critical and eventual consistency is acceptable

Examples not requiring transactions:

- Simple CRUD on a single document
- Creating a standalone resource
- Read operations

### Transaction Pattern

Transactions require a Mongoose session. The pattern is:

1. Start a session with `mongoose.startSession()`
2. Start a transaction with `session.startTransaction()`
3. Pass the session option to all database operations
4. Commit with `session.commitTransaction()` on success
5. Abort with `session.abortTransaction()` on failure
6. End session with `session.endSession()` in finally block

Use try/catch/finally to ensure proper cleanup regardless of outcome.

### Organizing Transaction Code

For complex transactions, create a separate `{feature}.transactions.ts` file. Name functions descriptively based on the workflow they perform (e.g., `processJobApplication` rather than `createApplicationTransaction`).

---

## 10. Pagination

### Standard Pagination Parameters

All list operations should accept these pagination options:

- `page`: Current page number, starting from 1 (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Field to sort by (default varies by entity)
- `order`: Sort direction, 'asc' or 'desc' (default: 'desc')

### Pagination Helper

Use the shared pagination helper from db utilities. The helper should:

- Calculate skip value from page and limit
- Execute count query and find query
- Return items array plus pagination metadata

### Response Shape

Paginated responses should include:

- `items`: Array of results
- `pagination`: Object containing:
  - `page`: Current page number
  - `limit`: Items per page
  - `total`: Total count of all matching records
  - `pages`: Total number of pages

### Default Values and Limits

Define constants for pagination defaults:

- Default page: 1
- Default limit: 20
- Maximum limit: 100 (prevent abuse)
- Default sort field: typically 'createdAt'
- Default order: 'desc' (newest first)

Enforce maximum limit even if client requests more. Clamp the value rather than throwing an error.

---

## 11. Soft Delete

### Soft Delete Fields

Every model that supports soft delete should include:

- `isDeleted`: Boolean flag, defaults to false
- `deletedAt`: Date timestamp, defaults to null

These fields are added via the shared model utilities.

### Filtering Deleted Records

By default, all queries should exclude soft-deleted records. Add `isDeleted: false` to query conditions automatically.

Create a utility function or query plugin that adds this filter. For queries that need to include deleted records, explicitly override the filter.

### Soft Delete Operation

The softDelete function should:

- Find the document by ID
- Verify ownership
- Set `isDeleted` to true
- Set `deletedAt` to current timestamp
- Save and return the updated document

### Hard Delete Operation

The hardDelete function should:

- Only be used for permanent removal (e.g., GDPR requests)
- Find and verify ownership first
- Use `findByIdAndDelete` to remove from database
- Log the permanent deletion for audit purposes

### Restore Operation

The restore function should:

- Find the document including deleted records
- Verify ownership
- Set `isDeleted` to false
- Set `deletedAt` to null
- Save and return the restored document

---

## 12. Service Dependencies

### How Services Call Other Services

When one service needs functionality from another, pass the required service functions as part of the dependencies object.

The calling controller or parent service is responsible for wiring up these dependencies. This keeps services decoupled and testable.

### Avoiding Circular Dependencies

To prevent circular imports:

- Services should depend on other services via function parameters, not direct imports
- Keep shared logic in utils that both services can import
- If two services need each other, consider extracting shared logic to a third service

### Shared Utilities vs Service Methods

**Put in shared utils:**

- Pure functions with no database access
- Formatters, validators, calculators
- Logic used across multiple features

**Put in service utils:**

- Logic specific to one feature
- Helpers that need access to feature's models
- Query builders for that feature's data

---

## 13. Testing Services

### Test File Location

Place test files alongside the files they test:

- `services/jobs.queries.test.ts` tests `jobs.queries.ts`
- `services/jobs.mutations.test.ts` tests `jobs.mutations.ts`

Alternatively, use a single `{feature}.service.test.ts` for smaller features.

### Unit Testing with Mocked Dependencies

For unit tests, mock the model dependencies to isolate business logic testing.

Create mock objects that simulate model behavior:

- Mock find/findById to return test data
- Mock save/create to capture and return input
- Mock updateOne/deleteOne to return operation results

### Integration Testing with In-Memory MongoDB

For integration tests, use mongodb-memory-server to test actual database interactions.

Use the test setup from shared test utilities that:

- Starts in-memory MongoDB before tests
- Clears collections between tests
- Stops server after all tests

### Common Test Patterns

**Test successful operations:**

- Provide valid input
- Assert return value matches expected shape
- Assert database state is correct (for mutations)

**Test error cases:**

- Provide invalid input or set up error conditions
- Assert specific error type is thrown
- Assert error message matches expected

**Test edge cases:**

- Empty inputs, boundary values
- Missing optional fields
- Maximum/minimum values

---

## 14. Checklist for New Features

Follow this checklist when creating a new feature with routes, controllers, and services.

### 1. Create Folder Structure

- [ ] Create `features/{feature}/` folder
- [ ] Create `features/{feature}/services/` folder
- [ ] Create `features/{feature}/services/queries.ts`
- [ ] Create `features/{feature}/services/mutations.ts`
- [ ] Create `features/{feature}/services/index.ts` barrel file
- [ ] Create `routes/{feature}.routes.ts`

### 2. Define Types

- [ ] Define input types for each operation
- [ ] Define output types if different from model
- [ ] Define filter types for list operations
- [ ] Add types to `{feature}.schemas.ts` if using Zod

### 3. Implement Query Functions

- [ ] Implement `find{Entity}ById`
- [ ] Implement `list{Entities}` with pagination
- [ ] Implement any search/filter functions needed
- [ ] Use `.lean()` for all read operations
- [ ] Add ownership filtering where appropriate

### 4. Implement Mutation Functions

- [ ] Implement `create{Entity}`
- [ ] Implement `update{Entity}`
- [ ] Implement `softDelete{Entity}`
- [ ] Implement `restore{Entity}` if needed
- [ ] Add ownership checks to all mutations
- [ ] Return plain objects from all mutations

### 5. Implement Utils

- [ ] Create ownership check helper
- [ ] Create query builder helpers if needed
- [ ] Create any formatting/transformation helpers

### 6. Set Up Exports

- [ ] Export all functions from individual files
- [ ] Re-export everything from index.ts

### 7. Add Error Handling

- [ ] Use AppError factories for all error cases
- [ ] Add not found errors for failed lookups
- [ ] Add forbidden errors for ownership violations
- [ ] Add appropriate errors for business rule violations

### 8. Add Validation

- [ ] Create Zod schemas for service-specific validation
- [ ] Add validation for internal service calls
- [ ] Reuse shared schemas where applicable

### 9. Handle Transactions (if needed)

- [ ] Identify operations requiring atomic updates
- [ ] Create `{feature}.transactions.ts` if needed
- [ ] Implement proper session handling and cleanup

### 10. Write Tests

- [ ] Create test files for queries and mutations
- [ ] Write unit tests with mocked dependencies
- [ ] Write integration tests for critical paths
- [ ] Test error cases and edge cases

### 11. Create Controller

- [ ] Create `features/{feature}/{feature}.controller.ts`
- [ ] Import services from `./services/index.js`
- [ ] Use `asyncHandler` wrapper for all handlers
- [ ] Extract userId from `req.user!.id`
- [ ] Call service functions with userId and request data
- [ ] Send response with `{ success: true, data: ... }`

### 12. Create Routes

- [ ] Create `routes/{feature}.routes.ts`
- [ ] Import controller handlers
- [ ] Apply auth middleware (`requireAuth` or `optionalAuth`)
- [ ] Apply validation middleware with Zod schemas
- [ ] Map HTTP methods to controller handlers
- [ ] Export router with explicit type annotation

### 13. Mount Routes

- [ ] Import router in `routes/v1.ts`
- [ ] Mount with `router.use("/{feature}", {feature}Router)`

### 14. Update Feature Exports

- [ ] Export model and types from `features/{feature}/index.ts`
- [ ] Export controller if needed externally
- [ ] Export services namespace

### 15. Documentation

- [ ] Add JSDoc comments to complex functions
- [ ] Document any non-obvious business rules
- [ ] Update API documentation if endpoints changed
