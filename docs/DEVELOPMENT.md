# Development Guide

## Development Environment Setup

### Required Tools

1. **Node.js & npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - Recommended: v18 or higher
   - Verify installation: `node --version` and `npm --version`

2. **Yarn (optional)**
   - Install globally: `npm install -g yarn`
   - Verify: `yarn --version`

3. **Expo CLI**
   - Install globally: `npm install -g expo-cli`
   - Verify: `expo --version`

### Mobile Development Setup

#### iOS (macOS only)
1. Install Xcode from the Mac App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

#### Android
1. Download and install [Android Studio](https://developer.android.com/studio)
2. Install Android SDK (API level 31+)
3. Set up Android emulator or connect a physical device
4. Add to your shell profile:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

#### Expo Go (Easiest)
- Install Expo Go app on your iOS or Android device
- No need for Xcode or Android Studio
- Simply scan QR code to run app

## Project Architecture

### Monorepo Structure

This project uses Yarn workspaces to manage multiple packages:

```
waterways/
├── apps/
│   ├── mobile/           # Mobile app (React Native)
│   │   ├── src/
│   │   │   └── database/  # SQLite database logic
│   │   ├── App.tsx
│   │   └── package.json
│   └── web/              # Web app (React Native Web)
├── packages/
│   └── shared/           # Shared code
│       ├── src/
│       │   ├── database/  # Schema definitions
│       │   ├── models/    # TypeScript types
│       │   └── supabase/  # Supabase client
│       └── package.json
└── tests/                # Centralized tests
    ├── mobile/
    ├── web/
    └── shared/
```

### Key Concepts

#### Workspaces
Each `apps/*` and `packages/*` directory is a separate npm package with its own `package.json`. The root workspace manages dependencies and scripts for all packages.

#### Path Aliases
Import from shared package using `@waterways/shared`:
```typescript
import { ALL_TABLES } from '@waterways/shared/src/database/schema';
```

#### Database Strategy
- **Mobile**: Local SQLite database for offline-first functionality
- **Cloud**: Supabase PostgreSQL for data sync and backup
- **Schema**: Single source of truth in `packages/shared/src/database/schema.ts`

## Common Development Tasks

### Adding a New Feature

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** in the appropriate workspace:
   - Mobile UI: `apps/mobile/src/`
   - Web UI: `apps/web/src/`
   - Shared logic: `packages/shared/src/`

3. **Add tests** in `tests/` directory:
   - Mobile tests: `tests/mobile/`
   - Web tests: `tests/web/`
   - Shared tests: `tests/shared/`

4. **Run quality checks:**
   ```bash
   npm run lint:fix
   npm run format
   npm run type-check
   npm test
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   git push origin feature/my-feature
   ```

### Updating Database Schema

1. **Update schema** in `packages/shared/src/database/schema.ts`

2. **Update Supabase** (if cloud schema changed):
   - Make changes in Supabase Dashboard
   - Regenerate types: `npm run types:generate`

3. **Test locally:**
   ```bash
   cd packages/shared
   npm run generate-db
   # Open waterways.db with SQLite viewer to verify schema
   ```

4. **Update mobile app** if needed:
   - Add migration logic in `apps/mobile/src/database/`
   - Test on fresh install and upgrade scenarios

### Working with Supabase

#### Connecting to Supabase

The Supabase client is in `packages/shared/src/supabase/client.ts`:

```typescript
import { supabase } from '@waterways/shared/src/supabase/client';

// Query data
const { data, error } = await supabase
  .from('observations')
  .select('*')
  .eq('trip_id', tripId);

// Insert data
const { data, error } = await supabase
  .from('observations')
  .insert({ trip_id: '123', observation: 'Test' });
```

#### Type Safety

All database types are auto-generated from your Supabase schema:

```typescript
import type { Database, Tables } from '@waterways/shared/src/models/database-types';

type Observation = Tables<'observations'>;
type Trip = Tables<'trips'>;
```

### Debugging

#### React Native Debugger
1. Install [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
2. Open app in Expo
3. Press `Ctrl+M` (Android) or `Cmd+D` (iOS)
4. Select "Debug Remote JS"

#### Console Logs
```typescript
console.log('Debug info:', data);
console.error('Error:', error);
```

#### React DevTools
```bash
npx react-devtools
```

## Troubleshooting

### Common Issues

**Metro bundler stuck:**
```bash
npx expo start --clear
```

**TypeScript errors after pulling:**
```bash
npm run build:shared
npm run type-check
```

**Native module errors:**
```bash
cd apps/mobile
rm -rf node_modules
npm install
```

**iOS build errors:**
```bash
cd apps/mobile/ios
pod install
```

**Android build errors:**
```bash
cd apps/mobile/android
./gradlew clean
```

