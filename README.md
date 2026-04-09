# Waterways

Waterways is a cross-platform field data collection app for waterway observations.

## Core Docs

Use these as the main documentation set:

1. [docs/QUICK_START.md](docs/QUICK_START.md) — complete setup and run guide (mobile, web, APK, ADB wired/wireless)
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system architecture, sync model, and schema diagrams
3. [docs/WAKE_WORD_SYSTEM.md](docs/WAKE_WORD_SYSTEM.md) — wake-word pipeline and voice-to-intent expansion plan
4. [docs/DEVELOPER_HANDBOOK.md](docs/DEVELOPER_HANDBOOK.md) — how the app is built, engineering workflow, and continuous improvement guide

## Repository Structure

```text
waterways/
├── apps/
│   ├── mobile/   # Expo React Native app
│   └── web/      # Vite React web app
├── packages/
│   └── shared/   # shared types, db schema, supabase client
├── supabase/     # migrations and edge functions
└── tests/        # jest suites (mobile/web/shared)
```

## Common Commands

```bash
# install
yarn install

# run
yarn mobile
yarn web

# quality
yarn test
yarn lint
yarn type-check
yarn format

# supabase types
yarn types:generate
```
