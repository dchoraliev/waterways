# Waterways Quick Start Guide

Setup and development guide for Waterways — an offline-first mobile app with cloud sync. Covers local development, Android builds, and device testing.

**Estimated setup time:** 15–20 minutes (after dependencies install)  
**Architecture and system design:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Prerequisites

**Required**

- **Node.js** 20 LTS or later
- **Yarn** 1.22 or later
- **Git** (latest)
- **Android Studio** (with Android SDK and platform tools)
- **Java 17** (for Gradle)

**Optional**

- **Expo Go** on Android — fast JS-only iteration without a native build
- **Supabase CLI** — `npx supabase` or `npm i -g supabase`
- **EAS CLI** — `npm i -g eas-cli` for cloud builds

---

## Where to Run Commands

Commands in this guide run from one of three directories:

| Directory                    | Commands                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **repo root** (`waterways/`) | `yarn install`, `yarn mobile`, `yarn web`, `yarn lint`, `yarn test`, `yarn format`, `yarn type-check`                  |
| **`apps/mobile/`**           | `yarn start`, `yarn prebuild`, `yarn build:apk`, `yarn run:android`, `yarn install:debug`, `yarn start:dev-client`     |
| **`apps/mobile/android/`**   | Gradle wrapper commands: `./gradlew assembleRelease`, `./gradlew bundleRelease`, etc. (use `.\gradlew.bat` on Windows) |

Each command block below includes a `# Run from:` comment when it isn't obvious.

---

## Initial Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd waterways
yarn install
```

### 2. Configure environment variables

Create a `.env` file at the **repo root**:

```env
# Mobile (Expo)
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Web (Vite)
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

To find these values: open the [Supabase Dashboard](https://app.supabase.com), select your project, and go to **Project Settings → API**.

---

## Running the Apps

### Mobile

```bash
# Run from: repo root
yarn mobile
```

### Web

```bash
# Run from: repo root
yarn web
```

Opens at `http://localhost:5173` (or the next available Vite port).

---

## Android Build Options

| Build type          | Best for                                                          | How to start                                                                                                        |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Expo Go**         | Fast JS/UI changes — no native rebuild                            | `yarn mobile` (repo root)                                                                                           |
| **Dev Client**      | Native module work with fast JS reloads                           | `yarn run:android` then `yarn start:dev-client` (both from `apps/mobile`)                                           |
| **Debug APK**       | QA or sharing with testers                                        | `yarn prebuild && yarn build:apk` (`apps/mobile`) → `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` |
| **Release APK/AAB** | Pre-release or Play Store submission                              | See [Release Builds](#release-builds)                                                                               |
| **EAS Cloud**       | Team builds without local Gradle — not yet verified for this repo | `eas build --platform android --profile preview` (`apps/mobile`)                                                    |

### Gradle wrapper note

The wrapper files (`gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`) must exist in `apps/mobile/android/`. If they're missing, run `yarn prebuild` from `apps/mobile` to regenerate them.

On Windows, always use `.\gradlew.bat` instead of `./gradlew` in PowerShell/CMD. Git Bash and WSL can use `./gradlew`.

---

## Android Device Setup

### One-time setup

1. **Enable Developer Options:** Settings → About phone → Tap "Build number" 7 times
2. **Enable USB Debugging:** Settings → Developer Options → USB Debugging → On
3. Connect via USB and accept the "Allow USB Debugging?" prompt on the device
4. Verify the connection:

   ```bash
   adb devices
   ```

   The device should be listed as `device`. If it shows `unauthorized`, accept the prompt on the phone and retry.

### Per-session ADB setup

Run this at the start of each development session to ensure Metro can reach the device:

```bash
adb kill-server
adb start-server
adb devices

# Port forwarding for Metro
adb reverse tcp:8081 tcp:8081
adb reverse tcp:19000 tcp:19000
adb reverse tcp:19001 tcp:19001

adb reverse --list   # confirm mappings
```

---

## Development Workflows

### Native debug loop (recommended for native module work)

Use this when you're working on native code or need native modules available during development.

1. Build and install the debug app (repeat after any native change):

   ```bash
   # Run from: apps/mobile
   yarn run:android
   ```

2. Start Metro in a second terminal:

   ```bash
   # Run from: apps/mobile
   yarn start:dev-client
   ```

3. Open the installed app on the device. After JS-only changes, reload the app. After native changes, re-run `yarn run:android`.

### APK install loop (for sharing builds or isolated testing)

1. Generate the native project and build the APK:

   ```bash
   # Run from: apps/mobile
   yarn prebuild
   yarn build:apk
   ```

2. Install on device:

   ```bash
   # Run from: apps/mobile

   # Debug APK
   yarn install:debug
   # or directly:
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk

   # Release APK (uninstall any previously signed variant first)
   adb uninstall com.waterways.mobile || true
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

   If the release APK is unsigned, sign it with `apksigner` before installing:

   ```bash
   $ANDROID_HOME/build-tools/<version>/apksigner sign \
     --ks android/keystore.jks \
     --ks-key-alias <alias> \
     --out android/app/build/outputs/apk/release/app-release-signed.apk \
     android/app/build/outputs/apk/release/app-release-unsigned.apk

   adb install -r android/app/build/outputs/apk/release/app-release-signed.apk
   ```

3. To install an AAB locally using [`bundletool`](https://developer.android.com/tools/bundletool):

   ```bash
   # Run from: apps/mobile/android
   ./gradlew bundleRelease

   java -jar bundletool.jar build-apks \
     --bundle=app/build/outputs/bundle/release/app-release.aab \
     --output=app-release.apks \
     --mode=universal

   java -jar bundletool.jar install-apks --apks=app-release.apks
   ```

---

## Release Builds

### Checklist before every release build

1. Pull latest and run `yarn` at the repo root — this applies patches in `patches/`.
2. Copy `apps/mobile/local.properties.template` to `apps/mobile/android/local.properties` and set `sdk.dir` to your Android SDK path (use forward slashes on Windows, e.g. `C:/Users/<You>/AppData/Local/Android/Sdk`).
3. Run `yarn prebuild --clean --platform android` from `apps/mobile` — this applies the Expo config plugins that inject required native settings.
4. Run the Gradle wrapper command for your platform (see below).

### Build commands

**Windows (PowerShell / CMD):**

```powershell
# Run from: apps/mobile/android
.\gradlew.bat assembleRelease      # APK
.\gradlew.bat bundleRelease        # AAB (Play Store format)
```

**macOS / Linux:**

```bash
# Run from: apps/mobile/android
./gradlew assembleRelease      # APK
./gradlew bundleRelease        # AAB (Play Store format)
```

Artifacts are written to `apps/mobile/android/app/build/outputs/`.

> **iOS:** local iOS release builds require macOS and Xcode. Use EAS Build for cloud iOS artifacts.

### How native settings are managed

A few things in this repo are enforced automatically so you don't have to manage them by hand:

- `apps/mobile/plugins/withAndroidCompatibility.js` — an Expo config plugin (tracked in git) that injects `android.enableJetifier=true` and other compatibility settings into the generated native project during `yarn prebuild`.
- `patches/` — library-level fixes (e.g. `@react-native-voice+voice*.patch`) applied automatically on `yarn install` via `postinstall`. Do not edit these manually.

If `assembleRelease` fails with a Metro module resolution error (`Unable to resolve module expo-router/entry`), run `yarn prebuild --clean` from `apps/mobile` before retrying the Gradle command.

### Voice / wake-word in release APKs

If you're building a release that uses the wake-word or speech features, check these settings before building:

- `apps/mobile/android/gradle.properties` — `newArchEnabled=false`
- `apps/mobile/app.config.ts` — `newArchEnabled: false` and `android.permissions` includes `android.permission.RECORD_AUDIO`
- Increment `versionCode` / `versionName` in `android/app/build.gradle` for each sideload test

**Run the pre-release config validator every time before building:**

```bash
# Run from: repo root
yarn workspace @waterways/mobile check:release-config
```

Expected output: `Release config check passed.` On failure, the script prints specific fixes and exits non-zero. Add this as a pre-build step in CI to catch misconfigured APKs early.

**Build and verify on device:**

```bash
# Run from: apps/mobile
yarn prebuild --clean
cd android
./gradlew assembleRelease            # Windows: .\\gradlew.bat assembleRelease
adb uninstall com.waterways.mobile || true
adb install -r app/build/outputs/apk/release/app-release.apk
adb logcat -d '*:S' ReactNative:V ReactNativeJS:V AndroidRuntime:E | grep "Wake status\|useWakeWord"
```

The Journey screen should show a wake-word status message (`Wake word is starting…`, `Wake word unavailable in this build/device`, or `💡 Say "Hey Wade, Start Recording"`). If you see `Cannot read property 'isSpeechAvailable' of null`, confirm `newArchEnabled=false` in both `gradle.properties` and `app.config.ts`, then rebuild.

> `@react-native-voice/voice` is not compatible with React Native's New Architecture (TurboModules). Keeping `newArchEnabled=false` is the required workaround until the module is migrated.

See [WAKE_WORD_SYSTEM.md](WAKE_WORD_SYSTEM.md) for design notes.

### When Is a Native Rebuild Required?

Not every change needs a full native rebuild. Use this table to decide:

| What changed | Rebuild needed? | What to do |
|---|---|---|
| JS/TS code, React components, styles | **No** | Hot-reload / restart Metro |
| `app.config.ts` or `app.json` (name, permissions, plugins, bundle ID, etc.) | **Yes** | `yarn prebuild --clean` then rebuild, or trigger an EAS build |
| `eas.json` (build profiles, environment) | **Yes (EAS only)** | Trigger a new EAS build |
| `plugins/withAndroidCompatibility.js` or any Expo config plugin | **Yes** | `yarn prebuild --clean` then rebuild |
| `package.json` if adding/removing a native module (e.g. camera, voice) | **Yes** | `yarn install` then `yarn prebuild --clean` then rebuild |
| `patches/` (patch-package files) | **Yes** | `yarn install` (applies patches) then `yarn prebuild --clean` then rebuild |
| Supabase edge functions or migrations | **No** | Deploy via Supabase CLI; no app rebuild needed |
| `.env` variables used at build time | **Yes** | Rebuild to bake in new values |
| `.env` variables read at runtime via `Constants.expoConfig.extra` | **No** | Restart the app (values are embedded at build time, so a rebuild is needed if they actually changed) |
| Android `gradle.properties` or iOS plist changes | **Yes** | `yarn prebuild --clean` then rebuild |

> **Rule of thumb:** if the change touches anything outside `src/`, you probably need a rebuild.

---

### Cloud Builds with EAS

EAS Build compiles native artifacts (iOS and Android) in the cloud without requiring local Xcode or Gradle setup.

#### Local EAS builds (from your machine)

**One-time setup:**

```bash
npm install -g eas-cli
eas login
# Run from: apps/mobile
eas build:configure
```

**Build commands (from `apps/mobile`):**

```bash
eas build --platform ios --profile development       # iOS dev client
eas build --platform android --profile preview       # Android internal testing
eas build --platform android --profile production    # Play Store
```

Download artifacts from the [EAS Dashboard](https://expo.dev).

#### CI/CD builds (GitLab pipeline)

The GitLab pipeline exposes two manual EAS iOS jobs in `.gitlab-ci.yml`:

- `eas_build_ios_shared`: builds the shared team development client from `main`
- `eas_build_ios_sandbox`: builds an isolated sandbox development client for feature branches and merge requests

**How to trigger a CI build:**

| Trigger | Behavior |
|---|---|
| Push to `main` | `eas_build_ios_shared` appears as a **manual** play button |
| Push to a non-`main` branch | `eas_build_ios_sandbox` appears as a **manual** play button |
| Merge request pipeline | `eas_build_ios_sandbox` appears as a **manual** play button |
| Run pipeline from GitLab web UI (**CI/CD → Pipelines → Run pipeline**) | `eas_build_ios_sandbox` appears as a **manual** play button |

The sandbox job uses a separate iOS bundle identifier and app scheme, so it does not overwrite the shared team build on a tester's device.

The shared and sandbox variant selectors are already defined in `.gitlab-ci.yml`. In GitLab's UI you only need to add secret CI/CD variables such as `EXPO_TOKEN` unless you want to override backend settings for CI.

**Required setup — `EXPO_TOKEN`:**

EAS CLI authenticates via the `EXPO_TOKEN` environment variable in CI. You must configure it once in GitLab:

1. Generate a token at [expo.dev](https://expo.dev) → **Account Settings → Access Tokens → Create Token**
2. In your GitLab repo go to **Settings → CI/CD → Variables → Add Variable**:
   - **Key:** `EXPO_TOKEN`
   - **Value:** *(paste your token)*
   - **Mask variable:** ✅ (hides it from job logs)
   - **Protect variable:** ❌ **leave unchecked** unless the branch is protected — protected variables are only injected into jobs running on **protected** branches
3. Commit and push — the build job will now authenticate automatically

> **Common pitfall:** if the build fails with `An Expo user account is required to proceed`, the `EXPO_TOKEN` variable is either missing, misspelled, or marked as protected on a non-protected branch. Edit the variable in GitLab and uncheck "Protect variable."

---

## Quality Assurance

### Tests

```bash
# Run from: repo root
yarn test              # all tests
yarn test:mobile       # mobile unit/integration only
yarn test:web          # web only
yarn test:shared       # shared library only
```

### Lint, type-check, format

```bash
# Run from: repo root
yarn lint              # ESLint (add --fix to auto-fix)
yarn type-check        # TypeScript
yarn format            # Prettier (write mode)
```

### Database schema changes

After modifying the Postgres schema, regenerate TypeScript types:

```bash
# Run from: repo root
yarn types:generate
npx prettier --write packages/shared/src/models/database-types.ts
```

See [ARCHITECTURE.md](ARCHITECTURE.md#database-schema-changes-checklist) for the full schema workflow.

---

## Troubleshooting

### Metro cache issues

```bash
# Run from: apps/mobile
yarn start --clear
```

### Android SDK not found

**Error:**

```
SDK location not found. Define a valid SDK location with an ANDROID_HOME
environment variable or by setting sdk.dir in local.properties.
```

**Option 1 — Set `ANDROID_HOME` (recommended):**

Find your SDK path:

- Android Studio default on Windows: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
- Or check in Android Studio: **File → Settings → Appearance & Behavior → System Settings → Android SDK**

Set it:

```powershell
# PowerShell (current session)
$env:ANDROID_HOME = "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"
```

For a permanent setting, add `ANDROID_HOME` as a User variable in **System Properties → Environment Variables**. Restart your terminal after.

**Option 2 — Set `sdk.dir` in `local.properties`:**

Copy the template and edit it:

```bash
cp apps/mobile/local.properties.template apps/mobile/android/local.properties
```

Then set `sdk.dir` in `apps/mobile/android/local.properties`:

```properties
sdk.dir=C:/Users/<YourUsername>/AppData/Local/Android/Sdk
```

Use forward slashes even on Windows.

**Verify `android.enableJetifier=true` is in `gradle.properties`:**

This line is required — omitting it causes manifest merge errors with legacy support libraries. The project's Expo config plugin injects it during `yarn prebuild`, but verify it's present before building:

```powershell
# PowerShell
Select-String -Path apps/mobile/android/gradle.properties -Pattern 'android.enableJetifier'
```

```bash
# macOS / Linux
grep 'android.enableJetifier' apps/mobile/android/gradle.properties
```

If it's missing, either add it manually or run `yarn prebuild --clean --platform android` from `apps/mobile`.

**Then retry:**

```bash
# Run from: apps/mobile
yarn build:apk
```

### Release bundle fails: `Unable to resolve module expo-router/entry`

**Error:** `Task :app:createBundleReleaseJsAndAssets FAILED` — Metro can't resolve `./../../node_modules/expo-router/entry.js`.

This happens when Metro resolves the entry path from the wrong working directory in a monorepo. The fix is to use a stable local entry file:

- `apps/mobile/package.json` should have `"main": "index.ts"`
- `apps/mobile/index.ts` is the stable entry point

After pulling the fix:

```bash
# Run from: apps/mobile
yarn prebuild --clean --platform android
cd android
./gradlew assembleRelease
```

### Gradle wrapper not recognized (Windows)

Use the batch wrapper instead:

```powershell
# Run from: apps/mobile/android
.\gradlew.bat assembleDebug
```

Or regenerate it:

```bash
# Run from: apps/mobile
yarn prebuild
```

Or use Git Bash / WSL where `./gradlew` works normally.

### Port already in use

```bash
# Run from: apps/mobile
yarn start
```

Metro will prompt to use a different port, or kill the existing process first.

### Wireless ADB (Android 11+)

```bash
adb pair <phone-ip>:<pairing-port>
adb connect <phone-ip>:5555
adb devices
```

### Supabase auth or data errors

- Verify `.env` values are correct and match your project
- Check that RLS policies in the Supabase Dashboard match your write operations
- Re-authenticate in the app to refresh the session token

---

## Next Steps

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) — offline-first design, data flow, sync orchestration, and the pre-PR checklist
- **Wake word system:** [WAKE_WORD_SYSTEM.md](WAKE_WORD_SYSTEM.md) — voice recognition setup and design notes
