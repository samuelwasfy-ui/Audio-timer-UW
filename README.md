# BHVD Mobile App (v1)

Minimalist focus timer with generative audio.

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- Watchman (for macOS)
- EAS CLI: `npm install -g eas-cli`

### 1. Clone & Install
```bash
git clone <repo-url>
cd bhvd
npm install
```

### 2. Environment Variables
Create a `.env` file in the root (do NOT commit this):
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 3. Run Locally
```bash
npx expo start
# Press 'i' for iOS simulator or 'a' for Android emulator
```

## 📱 Builds & Release (EAS)

### Configure Build
Ensure `eas.json` matches your distribution needs.

### iOS TestFlight
```bash
eas build --platform ios --profile preview
```

### Android Internal Track
```bash
eas build --platform android --profile preview
```

## 🔗 Deep Links & NFC
The app responds to:
- `bhvd://session`
- `https://bhvd.app/session`

**Testing NFC:**
1. Write `https://bhvd.app/session` to an NTAG215 tag.
2. Tap tag with phone.
3. If app installed -> Opens Session.
4. If not installed -> Opens fallback web URL.

## 🧪 Testing

**Audio QA:**
- [ ] Start session, lock screen. Audio should continue.
- [ ] Receive call. Audio should pause. Hang up. Audio should resume (or wait for user).

**Timer QA:**
- [ ] Start session, background app for 5 mins. Return. Timer should show -5 mins elapsed.

## 📂 Project Structure
- `/app` - Expo Router file-based routing.
- `/components` - Reusable UI (Timer, PhaseIndicator).
- `/lib` - Services (Audio, Supabase, Utils).
- `/assets` - Images and Audio files.

## 📄 License
Proprietary / Work-for-hire.
