# Waterways Developer Handbook

This handbook explains how Waterways is built and how to contribute safely and effectively.

Use this together with:

- [QUICK_START.md](QUICK_START.md) for setup and day-1 execution
- [ARCHITECTURE.md](ARCHITECTURE.md) for diagrams and data model views
- [WAKE_WORD_SYSTEM.md](WAKE_WORD_SYSTEM.md) for voice and wake-word specifics

## 1. What This App Is

Waterways is a cross-platform field data collection system with:

- Mobile app for data capture in the field (offline-first)
- Web app for viewing, filtering, administration, and reporting
- Shared package for common types/utilities and local schema definitions
- Supabase backend for auth, Postgres/PostGIS data, storage, and edge functions

Core product behavior:

- Users collect trip-based observations in the mobile app
- Mobile stores data locally first (SQLite)
- Review and sync push trips, observations, and media to Supabase
- Web visualizes and manages observations, including admin workflows

## 2. Monorepo Design

Top-level structure:

```text
apps/
  mobile/           Expo React Native app
  web/              Vite React app
packages/
  shared/           shared TS types, schema, helpers, Supabase typing
supabase/
  migrations/       SQL migrations and RPC evolution
  functions/        Deno edge functions
tests/
  mobile/           mobile-focused Jest suites
  web/              web-focused Jest suites
  shared/           shared package Jest suites
```

Key intent of boundaries:

- `apps/mobile`: owns offline capture, local SQLite lifecycle, sync orchestration
- `apps/web`: owns browser UX, map/filter/report/admin experiences
- `packages/shared`: owns types and logic that must stay consistent across clients
- `supabase`: owns durable data model and backend logic evolution

## 3. Tech Stack and Runtime Choices

### Mobile

- Expo SDK 54
- React Native 0.81.5
- Expo Router for route-based navigation
- expo-sqlite for local persistence
- Supabase JS client through shared package

### Web

- Vite + React 19
- Supabase JS client with browser storage persistence
- Pigeon Maps for map rendering and clustering
- Tailwind + Radix UI primitives for UI composition

### Shared

- TypeScript package consumed by both apps
- Generated Supabase database types
- Local SQLite schema constants and query helpers

### Backend

- Supabase Postgres/PostGIS
- SQL migrations and custom RPCs (for filtered observation query and admin helpers)
- Supabase Edge Functions for server-side operations

## 4. Data and Sync Model

### Offline-first capture path (mobile)

1. Create trip/observation/media in local SQLite.
2. Mark records with sync status metadata.
3. When network is available and data is ready, sync manager:
   - upserts trip
   - uploads media to storage bucket
   - upserts observation with media URL references
4. Marks records as synced or error for retry.

Important implementation details:

- Local schema source of truth: `packages/shared/src/database/schema.ts`
- Local DB initialization and health checks: `apps/mobile/src/database/db.ts`
- Sync orchestration: `apps/mobile/src/database/SyncManager.ts`
- Network-triggered auto-sync flow: `apps/mobile/src/services/NetworkService.ts`

### Cloud data access path (web)

- Web calls Supabase directly for observation loading and filters
- Heavy filtering is pushed into SQL RPC functions to reduce client-side processing
- Admin-specific views call specialized RPCs and moderation endpoints

## 5. Environment and Configuration

Root `.env` must contain at minimum:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Version/runtime expectations:

- Node.js: `>=20 <23`
- Yarn workspaces

Notable config surfaces:

- Root scripts and workspaces: `package.json`
- Mobile build configuration: `apps/mobile/app.config.ts`, `apps/mobile/eas.json`
- Supabase local config: `supabase/config.toml`

## 6. Day-to-Day Developer Workflows

### 6.1 Start development

From repo root:

```bash
yarn install
yarn mobile
yarn web
```

### 6.2 Validate quality before merge

From repo root:

```bash
yarn lint
yarn type-check
yarn test
```

### 6.3 Work on mobile native-sensitive features

Use dev-client flow when native modules are involved:

```bash
cd apps/mobile
yarn run:android
yarn start:dev-client
```

### 6.4 Supabase schema change flow

Preferred safe sequence:

1. Make SQL change (migration-first or SQL-editor-first)
2. Capture/commit migration in `supabase/migrations`
3. Regenerate types:

```bash
yarn types:generate
```

4. Update app/shared code and tests

## 7. Testing Strategy

Jest is configured as a multi-project setup:

- mobile tests: Expo and React Native behavior
- web tests: jsdom/browser behavior
- shared tests: pure TypeScript logic contracts

Main orchestration file:

- `jest.config.js`

Project-level configs:

- `tests/mobile/jest.config.js`
- `tests/web/jest.config.js`
- `tests/shared/jest.config.js`

Current practical expectations for contributors:

- Add unit tests when changing shared query helpers or core transformation logic
- Add mobile DB/sync tests when modifying sync or persistence behavior
- Add web API or view-model tests when changing map filtering/admin data flow

## 8. Release and Build Notes

Mobile release sensitivity:

- `@react-native-voice/voice` compatibility currently requires New Architecture disabled for Android in this codebase
- Validate release config before producing APK/AAB

Command:

```bash
yarn workspace @waterways/mobile check:release-config
```

Supporting script:

- `apps/mobile/scripts/check-release-config.js`

CI baseline:

- `.gitlab-ci.yml` runs install, lint, type-check, test
- iOS EAS build jobs are present as manual pipeline jobs

## 9. Continuous Improvement Playbook

Use this section to guide incremental modernization without destabilizing field operations.

### 9.1 Improvement principles

- Prefer small, reversible changes over broad refactors
- Protect offline reliability first (field usage must continue without network)
- Push expensive filtering/aggregation toward database-side RPC when practical
- Keep mobile and web contracts aligned via `@waterways/shared`

### 9.2 Suggested high-value focus areas

1. Sync reliability and observability:
   - Add richer sync metrics and error categorization
   - Surface retryable vs non-retryable failures in UI
2. Cleanup and consistency:
   - Remove temporary compatibility code paths once no longer needed
   - Standardize import aliases and service boundaries
3. Test depth:
   - Expand integration-like tests around trip->observation->media sync chain
   - Add regression tests for admin moderation and deleted/banned user flows
4. Documentation hygiene:
   - Update this handbook whenever adding subsystem-level behavior
   - Keep migration notes close to SQL changes

### 9.3 Definition of done for meaningful changes

A change is complete when:

- behavior is implemented and locally validated
- lint, type-check, and relevant tests pass
- migrations/types are updated if schema changed
- documentation is updated for operationally meaningful changes

## 10. Ownership Map (Where To Change What)

- Mobile navigation/app shell concerns:
  - `apps/mobile/src/app/`
- Mobile local DB and sync:
  - `apps/mobile/src/database/`
  - `apps/mobile/src/services/`
- Web auth/dashboard/admin/filtering:
  - `apps/web/src/contexts/`
  - `apps/web/src/api/`
  - `apps/web/src/pages/`
  - `apps/web/src/components/`
- Shared contracts and helpers:
  - `packages/shared/src/models/`
  - `packages/shared/src/database/`
  - `packages/shared/src/utils/`
- Backend evolution:
  - `supabase/migrations/`
  - `supabase/functions/`

## 11. Onboarding Checklist for New Contributors

1. Read `README.md`, `docs/QUICK_START.md`, and this handbook.
2. Run local setup and both apps.
3. Run lint, type-check, and test suites.
4. Inspect one end-to-end flow in code:
   - mobile capture -> local DB -> sync -> web query/render.
5. Pick a small issue and ship it with tests and docs updates.

## 12. Documentation Maintenance Rule

If a pull request changes one of these, update docs in the same PR:

- architecture boundaries
- sync behavior or failure handling
- Supabase schema/RPC contract
- release/build process
- contributor workflow expectations

That rule keeps onboarding cost low and enables steady continuous improvement over time.
