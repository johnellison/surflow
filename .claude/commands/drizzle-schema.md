# Drizzle Schema Generator

Generate a complete, synchronized entity definition across the Surflow stack.

## Input

The user will provide:
- **Entity name** (e.g., `spot`, `coach`, `booking`)
- **Fields** with types and constraints

If the user doesn't provide fields, check `Scratchpad.md` and `.taskmaster/docs/prd.txt` for the entity's data model under the `## Data Models (Core)` section in the PRD.

## What to Generate

### 1. Drizzle Table Schema — `services/api/db/schema/{entity}.ts`

```typescript
import { pgTable, text, timestamp, integer, real, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
```

Rules:
- Use `cuid2` for primary key IDs: `text('id').$defaultFn(() => createId()).primaryKey()`
- Always include `createdAt` and `updatedAt` timestamps
- Use `pgEnum` for constrained string fields (e.g., status, region, difficulty)
- Add proper foreign key references with `references(() => otherTable.id)`
- Add indexes on commonly queried fields (foreign keys, status, region)
- Export the table and any enums

### 2. Zod Validation Schema — `packages/core/types/{entity}.ts`

```typescript
import { z } from 'zod';
```

Rules:
- Define `{Entity}Schema` for the full record (matches DB row)
- Define `Create{Entity}Schema` for insert (omit id, timestamps)
- Define `Update{Entity}Schema` for partial updates (all fields optional except id)
- Export inferred types: `type {Entity} = z.infer<typeof {Entity}Schema>`
- Ensure field validations match DB constraints (min/max, enums, url format, etc.)

### 3. Re-export from barrel — `packages/core/types/index.ts`

Add `export * from './{entity}';` to the barrel file. Create the barrel file if it doesn't exist.

### 4. Seed Data Template — `services/api/db/seed/{entity}.ts`

Generate 3-5 realistic seed records for the entity. For Surflow, use surf-specific data:
- Spots: Real Moroccan and Bali surf spots with accurate GPS
- Coaches: Realistic coach profiles for Taghazout and Canggu
- Exercises: Real surf PT exercises (shoulder mobility, hip openers, etc.)

Export a `seed{Entity}` async function that inserts the data using Drizzle.

### 5. Register in schema barrel — `services/api/db/schema/index.ts`

Add `export * from './{entity}';` to the schema barrel. Create if needed.

## Verification Checklist

After generating, confirm:
- [ ] Drizzle schema field names match Zod schema field names
- [ ] Enum values are identical in both Drizzle and Zod
- [ ] Foreign keys reference tables that exist (or note them as TODO)
- [ ] Types are re-exported from `packages/core/types/index.ts`
- [ ] No circular imports
