# Wake Word System

This is the single source of truth for wake-word behavior and future voice-to-intent expansion.

## Current objective

Enable hands-free observation capture during active field journeys while keeping reliability high in noisy environments.

## Current flow

```mermaid
flowchart TD
  A[User says wake phrase] --> B[Wake word listener]
  B --> C{Match confidence >= threshold?}
  C -- No --> B
  C -- Yes --> D[Start observation recording]
  D --> E[Create observation locally]
  E --> F[Open post-observation camera window]
  F --> G[Optional photo/video capture]
  G --> H[Sync pipeline uploads media + observation]
```

## Runtime behavior

- Wake-word listening is enabled only where native/runtime support is available.
- In Expo Go, wake word is disabled and UI shows informational text.
- Observation capture still works through the standard Start Observation control.

## Signal path (conceptual)

```mermaid
sequenceDiagram
  participant Mic
  participant WakeWord
  participant JourneyScreen
  participant Recorder
  participant LocalDB

  Mic->>WakeWord: audio frames
  WakeWord->>WakeWord: detect phrase similarity
  WakeWord-->>JourneyScreen: onWakeWordDetected
  JourneyScreen->>Recorder: start recording timer flow
  Recorder->>LocalDB: save observation + media refs
```

## Voice-to-intent expansion plan

Goal: map natural speech to explicit in-app intents after wake word (and eventually without explicit wake word in controlled contexts).

### Proposed intent pipeline

```mermaid
flowchart LR
  U[Utterance] --> ASR[Speech-to-text]
  ASR --> NLU[Intent parser]
  NLU --> CONF{Confidence >= threshold}
  CONF -- No --> CLARIFY[Ask user to repeat/confirm]
  CONF -- Yes --> ROUTE[Intent router]
  ROUTE --> CAPTURE[Capture intents]
  ROUTE --> MEDIA[Media intents]
  ROUTE --> NAV[Navigation intents]
  ROUTE --> META[Metadata intents]
```

### Initial intents to implement

- Media intents (post-observation):
  - "take a photo"
  - "take a video"
  - "retake photo"
  - "stop video"
- Observation intents:
  - "start observation"
  - "stop recording"
  - "tag as erosion"
- Navigation intents:
  - "open review"
  - "end journey"

### Example mapping table

| Example phrase | Intent | Parameters |
|---|---|---|
| "take a video" | `media.capture` | `mode=video` |
| "take a photo" | `media.capture` | `mode=photo` |
| "stop recording" | `observation.stop` | none |
| "tag as algae" | `observation.tag` | `category=algae` |

## Recommended implementation phases

1. **Deterministic command grammar** for top-priority intents (`take photo`, `take video`).
2. **Intent confidence + confirmation UX** for ambiguous phrases.
3. **Context-aware intent routing** (e.g., only allow `take video` during camera window).
4. **Telemetry and analytics** on intent success/failure for iteration.

## Guardrails

- Always provide a touch fallback for every voice path.
- Keep destructive actions behind confirmation.
- Log intent classification results for debugging and QA.

---

## Release build checklist (Android)

When producing a standalone Android APK that uses the native `@react-native-voice/voice` module, ensure the following so wake-word works in release builds:

- Set `newArchEnabled = false` in `apps/mobile/android/gradle.properties` (react-native-voice is not New-Architecture/TurboModule-ready in this codebase).
- Ensure `newArchEnabled: false` is present in `apps/mobile/app.config.ts` so Expo prebuilds with the same flag.
- Confirm `android.permissions` includes `RECORD_AUDIO` in `app.config.ts` (required at runtime).
- Bump `versionCode`/`versionName` in `android/app/build.gradle` for each side-loaded APK iteration.
- Use `yarn workspace @waterways/mobile check:release-config` (or `node apps/mobile/scripts/check-release-config.js`) to validate the above before building.

Notes & rationale

- The fix used in this repository is to disable the New Architecture for Android builds to keep compatibility with `@react-native-voice/voice` while we migrate native voice code to the new architecture.
- The `check:release-config` script performs the basic safety checks listed above and fails the build process if mismatches are detected.

If you want this repository to support the New Architecture in the future, the long-term fix is to update or replace the voice/native speech module with a TurboModule-compatible implementation and add appropriate ProGuard/Turbomodule keep rules.

