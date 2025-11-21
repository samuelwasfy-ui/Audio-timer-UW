# BHVD v1 Architecture

## 1. System Overview
BHVD is a "Offline First" React Native application built with Expo. It utilizes Supabase for persistent storage and authentication, but core features (Timer, Audio) function without a network connection.

## 2. Tech Stack
- **Frontend**: React Native (Expo SDK 50+)
- **Language**: TypeScript
- **Audio Engine**: `expo-av` (Sound Objects) or Web Audio API (Web fallback)
- **Backend/DB**: Supabase (PostgreSQL + GoTrue Auth)
- **Builds**: EAS Build (CI/CD)
- **Analytics**: PostHog (Privacy focused) + Sentry (Error tracking)

## 3. Data Flow

### Session Start (NFC/Manual)
1. **Trigger**: User taps NFC tag (URL `https://bhvd.app/session`) OR opens app manually.
2. **Deep Link Handler**: 
   - Parses URL.
   - Checks Auth state.
   - Navigates to `SessionScreen`.
3. **Audio Service**:
   - Initializes Audio Session (Category: Playback, MixWithOthers: False).
   - Starts Generative/Looped Audio Buffer.

### During Session (Local State)
- **State Manager**: React Context / Zustand.
- **Timer**: `requestAnimationFrame` or `setInterval` (accurate to +/- 1s).
- **Background Mode**: UI background modes enabled in `Info.plist` to keep audio thread alive.

### Session End (Sync)
1. **Completion**: Timer hits 0 or User ends manually.
2. **Local Save**: Session data stored in `AsyncStorage` immediately (Offline support).
3. **Remote Sync**: 
   - App attempts to push to Supabase `sessions` table.
   - If offline, queues for next app open.

## 4. Key Modules

### Audio Controller
- Responsibilities: Fading in/out, looping, handling interruptions (phone calls).
- Implementation: Singleton class wrapping `expo-av`.

### NFC Listener
- Responsibilities: detecting tags when app is open/backgrounded (Android).
- Implementation: `expo-linking` for cold starts, native event listeners for active state.

## 5. Security
- **RLS**: All database access is scoped to `auth.uid()`.
- **Env Vars**: API Keys stored in EAS Secrets, not in code repo.
- **HTTPS**: All transport encrypted.
