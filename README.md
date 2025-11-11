# Waterways App

A cross-platform application for water quality monitoring and environmental data collection, built with React Native, Expo, and Supabase.

## 📋 Project Overview

Waterways is a mobile-first application that enables users to:
- Record observations during field trips along waterways
- Capture photos and location data for environmental monitoring
- Sync data with cloud storage via Supabase
- Access data offline with local SQLite storage
- View and analyze observation data on web and mobile platforms

## 🚀 Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **React Native Web** - Web compatibility layer
- **TypeScript** - Type-safe JavaScript

### Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Storage)
- **expo-sqlite** - Local SQLite database for offline support

### Development Tools
- **Yarn Workspaces** - Monorepo management
- **ESLint & Prettier** - Code quality and formatting
- **Jest** - Testing framework
- **TypeScript** - Static type checking

## 🏗️ Project Structure

```
waterways/
├── apps/
│   ├── mobile/          # React Native mobile app (iOS/Android)
│   └── web/             # React Native Web app
├── packages/
│   └── shared/          # Shared code, types, and utilities
├── tests/
│   ├── mobile/          # Mobile app tests
│   ├── web/             # Web app tests
│   └── shared/          # Shared package tests
└── docs/                # Documentation
```

## ⚡ Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Yarn** (v1.22+) or **npm** (v8+)
- **Expo CLI** - `npm install -g expo-cli`
- **Supabase CLI** (optional) - For database management

For mobile development:
- **iOS**: macOS with Xcode installed
- **Android**: Android Studio with SDK installed
- Or use **Expo Go** app on your physical device

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd waterways
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup:**
   
   Copy the example environment file and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your values:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   You can find these values in your [Supabase Dashboard](https://supabase.com/dashboard) under Project Settings > API.

4. **Build shared package:**
   ```bash
   npm run build:shared
   ```

### Running the Apps

#### Mobile App

```bash
# Start Expo development server
npm run mobile

# Then choose:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on your device
```

Or run directly:
```bash
npm run mobile -- --ios
npm run mobile -- --android
```

#### Web App

```bash
npm run web
```

The web app will open at `http://localhost:19006`

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm run test:mobile
npm run test:web
npm run test:shared

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format all files
npm run format

# Type checking
npm run type-check
```

## 🗄️ Database

### Local SQLite Database

The mobile app uses SQLite for offline data storage. The database schema is defined in `packages/shared/src/database/schema.ts` and includes:

- **trips** - Field trip sessions
- **observations** - Environmental observations
- **observation_media** - Photos and media files
- **observation_categories** - Category definitions

To generate a SQLite database file for inspection:
```bash
cd packages/shared
npm run generate-db
```

This creates `packages/shared/src/database/waterways.db` that you can open with any SQLite viewer.

### Supabase (Cloud Database)

The project uses Supabase for cloud data sync. To regenerate TypeScript types after schema changes:

```bash
npm run types:generate
```

This updates `packages/shared/src/models/database-types.ts` with the latest database schema.

## 📱 Development Workflow

### Using Shared Code

Import from the shared package using the `@waterways/shared` alias:

```typescript
import { ALL_TABLES } from '@waterways/shared/src/database/schema';
import { supabase } from '@waterways/shared/src/supabase/client';
import type { Database, Tables } from '@waterways/shared/src/models/database-types';
```

### Workspace Commands

Each workspace can be targeted individually:

```bash
# Mobile workspace
npm run mobile
yarn workspace @waterways/mobile start

# Web workspace
npm run web
yarn workspace @waterways/web start

# Shared workspace
npm run build:shared
yarn workspace @waterways/shared build
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint:fix`
5. Format code: `npm run format`
6. Type check: `npm run type-check`
7. Commit your changes: `git commit -m "Add my feature"`
8. Push to the branch: `git push origin feature/my-feature`
9. Create a Pull Request

## 🐛 Troubleshooting

### Metro bundler issues
```bash
# Clear Metro cache
npx expo start --clear
```

### TypeScript errors
```bash
# Rebuild shared package
npm run build:shared

# Check for type errors
npm run type-check
```

## 🔗 Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

