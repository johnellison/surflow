# Hono CRUD Endpoint Generator

Generate a complete REST resource API for a Surflow entity on the Hono backend.

## Input

The user will provide:
- **Resource name** (e.g., `spots`, `coaches`, `bookings`)
- **Which CRUD operations** to include (default: all of list, get, create, update, delete)
- **Auth requirements** (public, authenticated, or role-based)
- **Special endpoints** beyond standard CRUD (e.g., `POST /spots/:id/favorite`)

If not specified, infer the entity's Drizzle schema from `services/api/db/schema/` and its Zod types from `packages/core/types/`.

## What to Generate

### 1. Route File — `services/api/routes/{resource}/index.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
```

Standard endpoints pattern:
- `GET /` — List with pagination (`?limit=20&offset=0`), optional filters as query params
- `GET /:id` — Get by ID, 404 if not found
- `POST /` — Create, validate body with Zod `Create{Entity}Schema`
- `PATCH /:id` — Partial update, validate with `Update{Entity}Schema`
- `DELETE /:id` — Soft delete (set `deletedAt`) or hard delete based on entity

Rules:
- Use `zValidator('json', schema)` for body validation
- Use `zValidator('query', schema)` for query parameter validation
- Wrap all DB calls in try/catch, return consistent error envelope
- Return consistent response shape: `{ data, meta? }` for success, `{ error, message }` for errors
- Apply auth middleware where required

### 2. Query Helpers — `services/api/routes/{resource}/queries.ts`

Drizzle query functions separated from route handlers:
- `list{Entity}(filters, pagination)` — with `eq()`, `like()`, `and()` for filters
- `get{Entity}ById(id)`
- `create{Entity}(data)`
- `update{Entity}(id, data)`
- `delete{Entity}(id)`

Rules:
- Import `db` from the central database client
- Use Drizzle's query builder, not raw SQL
- Return typed results using the Zod types
- Include `.where(isNull(table.deletedAt))` on list/get if entity uses soft delete

### 3. Register Route — `services/api/routes/index.ts`

Add the new route to the main Hono app:
```typescript
import { resourceRoutes } from './{resource}';
app.route('/{resource}', resourceRoutes);
```

Create the route registry file if it doesn't exist.

### 4. API Client Method — `packages/api-client/{resource}.ts`

Typed client functions that call the API endpoints:
```typescript
export const {resource}Api = {
  list: (filters?) => client.get<{Entity}[]>('/{resource}', { params: filters }),
  getById: (id: string) => client.get<{Entity}>(`/{resource}/${id}`),
  create: (data: Create{Entity}) => client.post<{Entity}>('/{resource}', data),
  update: (id: string, data: Update{Entity}) => client.patch<{Entity}>(`/{resource}/${id}`, data),
  delete: (id: string) => client.delete(`/{resource}/${id}`),
};
```

Add export to `packages/api-client/index.ts` barrel.

## Response Envelope Convention

```typescript
// Success
{ data: T, meta?: { total: number, limit: number, offset: number } }

// Error
{ error: string, message: string, details?: unknown }
```

## Auth Middleware Pattern

```typescript
// Public: no middleware
// Authenticated: authMiddleware()
// Coach-only: authMiddleware(), roleMiddleware('coach')
// Admin-only: authMiddleware(), roleMiddleware('admin')
```

## Verification Checklist

- [ ] Route file exports a Hono instance
- [ ] All request bodies validated with Zod
- [ ] Query helpers use proper Drizzle syntax
- [ ] API client methods match the endpoint signatures
- [ ] Route registered in main app
- [ ] Error responses follow envelope convention
