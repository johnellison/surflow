# External API Integration Generator

Generate a complete fetch → cache → normalize → store pipeline for integrating an external data source into Surflow.

## Input

The user will provide:
- **Source name** (e.g., `noaa`, `open-meteo`, `copernicus`, `webcam-provider`)
- **API endpoint(s)** and documentation URL
- **Target entity**: Which internal entity this feeds (e.g., `forecast`, `webcam`)
- **Polling schedule**: How often to refresh (e.g., hourly, every 5 minutes)

## What to Generate

### 1. API Client — `services/api/integrations/{source}.ts`

```typescript
import { z } from 'zod';
```

Contents:
- **Response schema**: Zod schema for the external API's response shape
- **Fetch function**: `fetch{Source}Data(params)` with:
  - Configurable base URL via env var (`{SOURCE}_API_URL` or `{SOURCE}_API_KEY`)
  - Request timeout (default 10s)
  - Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
  - Response validation against Zod schema
  - Proper error typing (network error vs API error vs validation error)

```typescript
export async function fetch{Source}Data(params: {Source}Params): Promise<{Source}Response> {
  const url = buildUrl(params);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: buildHeaders(),
      });

      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      const raw = await response.json();
      return {Source}ResponseSchema.parse(raw);
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await sleep(BACKOFF_MS * Math.pow(2, attempt));
    }
  }
}
```

### 2. Normalizer — `services/api/integrations/{source}.normalizer.ts`

Transform external data shape into Surflow's internal schema:

```typescript
import type { {Entity} } from '@surflow/core/types';

export function normalize{Source}Response(
  raw: {Source}Response,
  spotId: string
): Partial<{Entity}>[] {
  // Map external fields to internal schema
  // Handle unit conversions (e.g., meters to feet, Celsius to Fahrenheit)
  // Handle missing/null fields with sensible defaults
  // Return array of partial entity records ready for upsert
}
```

Rules:
- Document every field mapping with inline comments
- Flag fields that have no external equivalent with `// Not available from {source}`
- Unit conversions must be explicit (no magic numbers)
- Handle timezone normalization to UTC

### 3. Cache Layer — `services/api/integrations/{source}.cache.ts`

Redis caching using Upstash:

```typescript
import { Redis } from '@upstash/redis';

const CACHE_TTL_SECONDS = 3600; // 1 hour, adjust per source
const CACHE_PREFIX = 'surflow:{source}';

export async function getCached{Source}(key: string): Promise<{Entity}[] | null> {
  const cached = await redis.get(`${CACHE_PREFIX}:${key}`);
  if (!cached) return null;
  return JSON.parse(cached);
}

export async function setCached{Source}(key: string, data: {Entity}[]): Promise<void> {
  await redis.set(`${CACHE_PREFIX}:${key}`, JSON.stringify(data), { ex: CACHE_TTL_SECONDS });
}

export async function invalidate{Source}Cache(pattern: string): Promise<void> {
  // SCAN + DEL for pattern-based invalidation
}
```

### 4. Storage — Drizzle upsert helper in `services/api/integrations/{source}.storage.ts`

```typescript
export async function upsert{Source}Data(records: Partial<{Entity}>[]): Promise<void> {
  // Use Drizzle's onConflictDoUpdate for idempotent writes
  // Conflict key: typically (spot_id, timestamp, source) for forecasts
  // Update: overwrite data fields, bump updatedAt
}
```

### 5. Poller Job — `services/api/jobs/{source}-poller.ts`

Background job that orchestrates the pipeline:

```typescript
export async function poll{Source}(): Promise<PollResult> {
  const spots = await getActiveSpots(); // or relevant scope
  const results = { success: 0, failed: 0, cached: 0 };

  for (const spot of spots) {
    try {
      // 1. Check cache freshness
      const cached = await getCached{Source}(spot.id);
      if (cached && !isStale(cached)) {
        results.cached++;
        continue;
      }

      // 2. Fetch from external API
      const raw = await fetch{Source}Data(buildParams(spot));

      // 3. Normalize
      const normalized = normalize{Source}Response(raw, spot.id);

      // 4. Store in DB
      await upsert{Source}Data(normalized);

      // 5. Update cache
      await setCached{Source}(spot.id, normalized);

      results.success++;
    } catch (error) {
      results.failed++;
      console.error(`[{source}-poller] Failed for spot ${spot.id}:`, error);
    }
  }

  return results;
}
```

### 6. Cron Registration

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/{source}-poll",
    "schedule": "0 * * * *"
  }]
}
```

Create the cron endpoint in `services/api/routes/cron/{source}-poll.ts`:
- Verify `CRON_SECRET` header
- Call `poll{Source}()`
- Return result summary

### 7. Environment Variables

Add to `.env.example`:
```
# {Source} Integration
{SOURCE}_API_URL=
{SOURCE}_API_KEY=
```

## Verification Checklist

- [ ] Fetch function has timeout and retry logic
- [ ] External response validated with Zod (never trust external data)
- [ ] Normalizer handles missing fields gracefully
- [ ] Cache TTL appropriate for the data freshness requirements
- [ ] Upsert uses proper conflict resolution
- [ ] Poller logs errors but doesn't crash on individual spot failure
- [ ] Cron endpoint verifies CRON_SECRET
- [ ] Env vars documented in .env.example
