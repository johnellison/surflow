# Cross-Platform Screen Scaffold

Generate paired Expo (mobile) and Next.js (web) screens for a Surflow feature, with shared components and data hooks.

## Input

The user will provide:
- **Feature name** (e.g., `forecast`, `webcams`, `recovery`, `coaches`)
- **Screen type**: `tab` (top-level tab), `detail` (e.g., `/spot/[id]`), or `flow` (multi-step like booking)
- **Data source**: Which API client method(s) to use

If not specified, infer from the Scratchpad.md task being worked on.

## What to Generate

### 1. Shared Feature Component — `packages/ui/{feature}/`

Create the main presentational component that works on both platforms:

```
packages/ui/{feature}/
├── index.tsx          # Barrel export
├── {Feature}Screen.tsx  # Main screen component (receives data as props)
└── {Feature}Card.tsx    # List item component if applicable
```

Rules:
- Components receive data as props — no data fetching inside
- Use shared primitives from `packages/ui/primitives/` (Button, Text, Card, Input)
- For cross-platform: use `react-native` primitives (View, Text, ScrollView, FlatList) — these work on web via React Native Web
- Keep styles using StyleSheet.create or Tamagui tokens
- Export component and its prop types

### 2. Mobile Screen — `apps/mobile/app/(tabs)/{feature}.tsx` (for tabs)

Or `apps/mobile/app/{feature}/[id].tsx` for detail screens.

```typescript
import { {Feature}Screen } from '@surflow/ui/{feature}';
import { use{Feature}Data } from '@surflow/api-client/{feature}';
```

Rules:
- Use Expo Router conventions (export default function, use `useLocalSearchParams` for params)
- Fetch data using the API client hook
- Show loading skeleton while fetching
- Handle error state
- Pull-to-refresh on list screens (`RefreshControl`)

### 3. Web Page — `apps/web/app/(app)/{feature}/page.tsx`

```typescript
import { {Feature}Screen } from '@surflow/ui/{feature}';
```

Rules:
- Default to Server Component where possible
- Add `'use client'` only if the screen needs interactivity (most screens will)
- Use the same shared component as mobile
- Add appropriate `metadata` export for SEO
- For detail pages: `app/(app)/{feature}/[id]/page.tsx` with `generateMetadata`

### 4. Data Hook — `packages/api-client/hooks/use{Feature}.ts`

React hook that wraps the API client for the feature:

```typescript
import useSWR from 'swr';
import { {feature}Api } from '../{feature}';

export function use{Feature}List(filters?) {
  return useSWR(['{feature}', filters], () => {feature}Api.list(filters));
}

export function use{Feature}Detail(id: string) {
  return useSWR(id ? ['{feature}', id] : null, () => {feature}Api.getById(id));
}
```

Rules:
- Use SWR for client-side data fetching (shared between mobile and web)
- Key includes filters for proper cache invalidation
- Return `{ data, error, isLoading, mutate }` shape
- Null key pattern for conditional fetching

### 5. Navigation Wiring

**Mobile**: If this is a tab screen, update `apps/mobile/app/(tabs)/_layout.tsx` to add the tab:
```typescript
<Tabs.Screen name="{feature}" options={{ title: '{Feature}', tabBarIcon: ... }} />
```

**Web**: If this is a main section, add to the app sidebar/nav in `apps/web/components/app-nav.tsx` (or equivalent).

## Screen Type Templates

### Tab Screen (list view)
- Header with title + filter/sort controls
- FlatList/ScrollView of cards
- Pull-to-refresh
- Empty state
- FAB or header action for create (if applicable)

### Detail Screen
- Back navigation
- Hero section (image/video)
- Content sections
- Action buttons (book, favorite, start routine, etc.)
- Related items

### Flow Screen (multi-step)
- Step indicator
- Form fields per step
- Back/Next navigation
- Summary/confirmation step
- Submit action

## Verification Checklist

- [ ] Shared component has no platform-specific imports (no `next/router`, no `expo-router`)
- [ ] Mobile screen uses Expo Router conventions
- [ ] Web page uses Next.js App Router conventions
- [ ] Data hook uses SWR with proper cache keys
- [ ] Loading and error states handled on both platforms
- [ ] Types imported from `@surflow/core/types`
