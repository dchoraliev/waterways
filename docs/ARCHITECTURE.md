# Waterways Architecture

This document explains the current project architecture and data flow.

Schema diagrams in this file are derived from Supabase generated types in `packages/shared/src/models/database-types.ts` (`Database['public']['Tables']`).

## High-level system

```mermaid
flowchart LR
  U[Field User] --> M[Mobile App - Expo]
  U --> W[Web App - Vite React]

  M --> L[(Local SQLite)]
  M --> S[(Supabase)]
  W --> S

  S --> DB[(Postgres + PostGIS)]
  S --> ST[(Supabase Storage)]
```

## Monorepo layout

```mermaid
flowchart TD
  R[waterways repo]
  R --> A[apps]
  R --> P[packages]
  R --> SB[supabase]
  R --> T[tests]

  A --> AM[apps/mobile]
  A --> AW[apps/web]
  P --> PS[packages/shared]
```

## Mobile sync model (offline-first)

- Mobile writes trips/observations/media to local SQLite first.
- Sync uploads trips and observations to Supabase.
- Media is uploaded to Supabase Storage buckets:
  - `Images` (photos)
  - `Vidoes` (videos)
- Observation payload includes media URL list in `observation_media`.

```mermaid
sequenceDiagram
  participant User
  participant Mobile
  participant SQLite
  participant Supabase
  participant Storage

  User->>Mobile: record observation
  Mobile->>SQLite: insert trip/observation/media
  User->>Mobile: end journey
  Mobile->>Supabase: upsert trip
  Mobile->>Storage: upload media file
  Storage-->>Mobile: public URL
  Mobile->>Supabase: upsert observation + observation_media[url]
  Mobile->>SQLite: mark synced
```

## Supabase data model (from generated types)

The ER diagrams below reflect the current `public` tables and relationships defined in generated Supabase types.

### Core relational graph

```mermaid
erDiagram
  USERS ||--o{ PROJECTS : "projects_created_by_fkey"
  USERS ||--o{ TRIPS : "trips_user_id_fkey"
  USERS ||--o{ OBSERVATIONS : "observations_user_id_fkey"
  USERS ||--o{ PROJECT_MEMBERSHIP : "project_membership_user_id_fkey"
  PROJECTS ||--o{ TRIPS : "trips_project_id_fkey"
  PROJECTS ||--o{ PROJECT_MEMBERSHIP : "project_membership_project_id_fkey"
  TRIPS ||--o{ OBSERVATIONS : "observations_trip_id_fkey"

  USERS {
    string id PK
    string email
    string first_name
    string last_name
    string role
    string status
    boolean verified
    boolean share_name_on_map
    string created_at
  }

  PROJECTS {
    string id PK
    string name
    string description
    string join_code
    string created_by FK
    string created_at
  }

  PROJECT_MEMBERSHIP {
    string id PK
    string project_id FK
    string user_id FK
    string joined_at
  }

  TRIPS {
    string id PK
    string user_id FK
    string project_id FK
    string unique_userID_localID_pair
    string start_time
    string end_time
    unknown start_location
    unknown end_location
    string created_at
  }

  OBSERVATIONS {
    string id PK
    string user_id FK
    string trip_id FK
    string unique_userID_localID_pair
    string observation
    unknown location
    string[] categories
    string[] observation_media
    string created_at
  }
```

### Additional public tables

```mermaid
erDiagram
  OBSERVATION_CATEGORIES {
    int id PK
    string type
    boolean active
  }

  USER_SIGNUPS_AUDIT {
    string id PK
    string user_id
    string email
    string created_at
  }

  SPATIAL_REF_SYS {
    int srid PK
    string auth_name
    int auth_srid
    string srtext
    string proj4text
  }
```

### Relationship inventory (exact FK names)

- `observations_trip_id_fkey`: `observations.trip_id -> trips.id`
- `observations_user_id_fkey`: `observations.user_id -> users.id`
- `project_membership_project_id_fkey`: `project_membership.project_id -> projects.id`
- `project_membership_user_id_fkey`: `project_membership.user_id -> users.id`
- `projects_created_by_fkey`: `projects.created_by -> users.id`
- `trips_project_id_fkey`: `trips.project_id -> projects.id`
- `trips_user_id_fkey`: `trips.user_id -> users.id`

### Notes about type fidelity

- Column nullability and runtime value shape come from `Row` types in generated definitions.
- `location`, `start_location`, and `end_location` are typed as `unknown` in generated output.
- `categories` and `observation_media` are typed as string arrays.
- These diagrams intentionally model Supabase tables only (not local SQLite tables).

## Rendering Mermaid in VS Code

### Option A: built-in markdown preview

1. Open this file in VS Code.
2. Run `Markdown: Open Preview` (`Ctrl+Shift+V`) or `Markdown: Open Preview to the Side` (`Ctrl+K V`).
3. Mermaid blocks render directly in the preview pane.

### Option B: use a Mermaid preview extension

If your environment does not render Mermaid in markdown preview, install one extension:

- `bierner.markdown-mermaid` (Markdown Preview Mermaid Support)

Then reopen markdown preview.

### Exporting rendered diagrams

- Use the preview pane and run `Markdown: Print` for PDF export, or use a screenshot tool for PNG capture.
- Keep diagrams in fenced code blocks starting with ```mermaid so both built-in and extension renderers detect them.

## Runtime notes

- Expo Go is used for normal dev iteration.
- Wake-word availability depends on runtime/native module support.
- Supabase generated types are stored in:
  - `packages/shared/src/models/database-types.ts`

## Important boundaries

- `packages/shared` contains common models/supabase types/utilities.
- `apps/mobile` owns local-db and sync orchestration.
- `apps/web` consumes Supabase-hosted data for browser UX.
