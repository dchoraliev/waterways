# Waterways Quick Start Guide

A comprehensive setup and development guide for Waterways—an offline-first mobile app with cloud synchronization. This guide covers local development, building, and testing on Android devices.

**Estimated setup time:** 15–20 minutes (after dependencies install)  
**For architecture and system design, see:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Prerequisites

### Required

- **Node.js** 20 LTS or later
- **Yarn** 1.22 or later
- **Git** (latest)
- **Android Studio** (with Android SDK and platform tools)
- **Java 17** (for Gradle compilation)

### Optional

- **Expo Go** app on Android (for fast JS-only iteration)
- **Supabase CLI** (`npx supabase` or `npm i -g supabase`)
- **EAS CLI** (`npm i -g eas-cli`) for cloud builds

---

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd waterways
yarn install
```

### 2. Configure Environment Variables

Create a `.env` file at the repository root:

```env
# Supabase (mobile)
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Supabase (web)
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**How to find these values:**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Project Settings** → **API**
4. Copy the URL and Anon Key

---

## Build Options for Android

Choose the appropriate build strategy based on your development workflow:

| Build Type | Best For | Setup | Output Location |
|---|---|---|---|
| **Expo Go** | Fast JS/UI iterations | `yarn mobile` | Runs in Expo Go app (no native rebuild) |
| **Dev Client** | Native module debugging & iteration | `yarn run:android` then `yarn start:dev-client` | Debug app installed + Metro server |
| **Debug APK** | QA testing on device | `yarn prebuild && yarn build:apk` | `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` |
| **Release APK/AAB** | Pre-release / Play Store submission | See [Release Builds](#release-builds) | `apps/mobile/android/app/build/outputs/` |
| **EAS Cloud** | Team builds without local Gradle setup | `eas build --platform android --profile preview` | EAS Dashboard |

### Important: Gradle Wrapper

The Gradle wrapper files (`gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`) must exist in `apps/mobile/android/`.

**If you see "gradlew is not recognized":**
- Use `.\gradlew.bat` on Windows PowerShell/CMD instead of `./gradlew`
- Or regenerate the Android project: `yarn prebuild`
- Or open Git Bash/WSL and use `./gradlew`

---

## Running the Apps

### Mobile (Expo)

From the repository root:

```bash
yarn mobile
```

Or from the `apps/mobile` directory:

```bash
cd apps/mobile
yarn start
```

### Web (Vite)

From the repository root:

```bash
yarn web
```

Expected: App launches on `http://localhost:5173` (or next available Vite port)

---

## Android Device Testing

### One-Time Device Setup

1. **Enable Developer Options** on your Android device:
   - Settings → About phone → Tap "Build number" 7 times
2. **Enable USB Debugging:**
   - Settings → Developer Options → Enable USB Debugging
3. **Connect via USB** and accept the "Allow USB Debugging?" prompt on your device
4. **Verify ADB connection:**

   ```bash
   adb devices
   ```

   Expected output: Device listed as `device`. If status is `unauthorized`, accept the prompt on your phone and retry.

### Per-Session Connection Setup

Run these commands to ensure stable ADB connectivity for Metro:

```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices

# Configure port forwarding for Metro
adb reverse tcp:8081 tcp:8081
adb reverse tcp:19000 tcp:19000
adb reverse tcp:19001 tcp:19001

# Verify mappings
adb reverse --list
```

### Testing Workflow: Native Debug Loop

**Recommended for active development with native modules or native dependencies:**

1. **Build and install debug app** (one-time, after native changes):

   ```bash
   cd apps/mobile
   yarn run:android
   ```

2. **Start Metro for the dev client** (in a separate terminal):

   ```bash
   cd apps/mobile
   yarn start:dev-client
   ```

3. **Test on device:**
   - Open the installed app on your Android device
   - Run your test scenario
   - After JS-only edits: Just reload the app (no rebuild needed)
   - After native changes: Re-run `yarn run:android`

### Testing Workflow: APK Install Loop

**For building standalone debug APKs (useful for sharing with testers):**

1. **Generate native Android project and build APK:**

   ```bash
   cd apps/mobile
   yarn prebuild
   yarn build:apk
   ```

2. **Install on connected device:**

   ```bash
   cd apps/mobile
   yarn install:debug
   ```

   Alternative:
   ```bash
   adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Start Metro server** (in another terminal):

   ```bash
   cd apps/mobile
   yarn start
   ```

4. **Launch and test** on the device

---

## Release Builds

### Local Release Build (Gradle)

**macOS / Linux:**
```bash
cd apps/mobile/android
./gradlew assembleRelease      # APK
./gradlew bundleRelease        # AAB (Play Store format)
```

Artifacts are output to `apps/mobile/android/app/build/outputs/`

**Note:** Release builds require keystore (signing) configuration. See Gradle documentation for production signing setup.

### Cloud Build with EAS (Optional)

Use Expo's **EAS Build** service to compile artifacts without local Gradle setup:

#### One-Time Setup

```bash
npm install -g eas-cli      # Or use `npx eas`
eas login
cd apps/mobile
eas build:configure         # Creates `eas.json` if needed
```

#### Build Commands

```bash
# Preview build (internal testing)
eas build --platform android --profile preview

# Production build (Play Store)
eas build --platform android --profile production
```

Download your APK/AAB from the EAS Dashboard and distribute.

---

## Quality Assurance

### Run Tests

From repository root:

```bash
yarn test              # All tests
yarn test:mobile       # Mobile unit/integration tests only
yarn test:web          # Web tests only
yarn test:shared       # Shared library tests only
```

### Linting and Type Checking

```bash
yarn lint              # ESLint (fix: --fix flag)
yarn type-check        # TypeScript validation
yarn format            # Prettier (write mode)
```

### Database Schema Changes

After modifying the Postgres schema, regenerate TypeScript types:

```bash
yarn types:generate
npx prettier --write packages/shared/src/models/database-types.ts
```

See [ARCHITECTURE.md](ARCHITECTURE.md#database-schema-changes-checklist) for the complete schema workflow.

---

## Troubleshooting

### Metro Cache Issues

Clear the Metro bundler cache:

```bash
cd apps/mobile
yarn start --clear
```

### Android SDK Location Not Found

**Error:**
```
com.android.builder.errors.EvalIssueException: SDK location not found. 
Define a valid SDK location with an ANDROID_HOME environment variable 
or by setting the sdk.dir path in your project's local properties file.
```

**Solution 1: Set ANDROID_HOME environment variable (Recommended)**

1. Locate your Android SDK installation:
   - Android Studio default: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
   - Or check in Android Studio: **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK** → Note the SDK location

2. Set the environment variable on Windows:
   - Open **System Properties** → **Environment Variables**
   - Create a new **User variable** named `ANDROID_HOME` with the SDK path as value
   - Or use PowerShell:
     ```powershell
     $env:ANDROID_HOME = "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"
     ```

3. Verify the variable is set:
   ```bash
   echo $env:ANDROID_HOME  # PowerShell
   echo %ANDROID_HOME%     # CMD
   ```

4. **Restart your terminal** and retry the build

**Solution 2: Create local.properties file**

1. Create or edit `apps/mobile/android/local.properties`:
   ```properties
   sdk.dir=C:\Users\<YourUsername>\AppData\Local\Android\Sdk
   ```

2. Replace the path with your actual Android SDK location

3. Retry the build:
   ```bash
   cd apps/mobile
   yarn build:apk
   ```

### Gradle Wrapper Not Recognized (Windows)

**Solution 1:** Use the Windows batch file:
```powershell
.\gradlew.bat assembleDebug  # Instead of ./gradlew
```

**Solution 2:** Regenerate the wrapper:
```bash
yarn prebuild
```

**Solution 3:** Use Git Bash or WSL:
```bash
# Open Git Bash and run:
./gradlew assembleDebug
```

### Port Already in Use

Kill existing Metro processes and restart:

```bash
cd apps/mobile
yarn start
```

### Wireless ADB Debugging (Android 11+)

```bash
adb pair <phone-ip>:<pairing-port>
adb connect <phone-ip>:5555
adb devices
```

### Supabase Authentication / Data Errors

- **Verify `.env` values** are correct and visible to your app
- **Check RLS policies** in the Supabase Dashboard align with your write operations
- **Re-authenticate** in the app to refresh your session token

---

## Next Steps

- **System Architecture:** Review [ARCHITECTURE.md](ARCHITECTURE.md) for offline-first design, data flow, and sync orchestration
- **Wake Word System:** See [WAKE_WORD_SYSTEM.md](WAKE_WORD_SYSTEM.md) for voice recognition setup
- **Contributing:** Follow the pre-PR checklist in [ARCHITECTURE.md](ARCHITECTURE.md)
