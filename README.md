# Zahln Student

The student app for paying in the mensa: scan the till's QR code, see the mensa, the items and your price, confirm with biometrics or a PIN, and see the result. A history screen lists past payments, including ones still being checked.

Part of the Zahln Mensa take-home, together with [zahln-till](../zahln-till) and [zahln-dashboard](../zahln-dashboard). The design document is in [DESIGN.md](DESIGN.md).

## Run it

Requirements: Node 22, Android Studio with an emulator (or a phone with USB debugging), Xcode for iOS.

```bash
npm install
cp .env.example .env   # API base URL and candidate id
npm run android        # builds a dev client and starts Metro
npm run ios
```

Pick **Student**, **Staff** or **Guest** on the first screen. To pay without a camera, open a till order by link:

```bash
adb shell am start -a android.intent.action.VIEW -d "zahln://pay?order=<order id>"
xcrun simctl openurl booted "zahln://pay?order=<order id>"
```

or type the order id on the scan screen.

If the device has no fingerprint, face or screen lock, the app asks you to choose a 4-digit PIN the first time you pay.

## Test

```bash
npm test               # Vitest: API client, payment state machine, intents, formatting
npm run typecheck
npm run e2e            # Maestro against the running dev build and the live mock
```

The Maestro flows create real orders on `dev.zahln.de` and check afterwards that exactly one payment exists per order. Flows 03 and 04 switch on a dev-only network fault (`zahln://dev/faults?mode=lose_response`) that drops the first response of each payment request after the server has handled it; 08 turns on airplane mode while the payment is being sent; 09 makes every payment request fail with 503.

In a dev build, long-press the greeting on Home to switch network faults by hand.

## What is built

- Seeded user picker; the same order shows a different amount for student, staff and guest.
- QR scan with a typed-code fallback, review screen with a server-time countdown, biometric or PIN confirmation.
- Payment states that only show what the server confirmed, survive lost responses, double taps, losing the network and the app being killed, and never charge twice. See DESIGN.md §2.
- `plugins/with-network-recovery.js`: Android drops dead HTTP/2 connections after a network change, so retries reach the server as soon as the network is back.
- History with pending payments and a detail view with the payment's full event history and any pending refund.
- A payment still being checked stays visible: Home shows a banner that opens it, also after the app was closed.
- Remote config: payments paused and minimum app version.
- English by default, German from the language button. Screen reader labels and announcements on the pay flow.

## Left out, and why

- **One monorepo.** The brief asks for one; the three surfaces are separate repositories with `src/api` and `src/core` copied between them. DESIGN.md §1 describes the move to a workspace.
- **Crash reporting and CI.** Described in DESIGN.md §3, not wired up; the time went into the payment states and the end-to-end tests.
- **iOS release build.** iOS runs in the simulator; only Android is built for install.
- **Offline payments.** Paying needs the network at that moment; anything else would mean showing a result the server has not confirmed.

## Libraries

Expo SDK 58 with Expo Router; TanStack Query for lists; Zustand for the session and language; react-native-mmkv so a payment intent is on disk before its request is sent; expo-local-authentication, expo-secure-store and expo-crypto for confirmation, the PIN hash and idempotency keys; expo-camera for QR scanning; Vitest and Maestro for tests; openapi-typescript for API types.

## Tools

I made the architecture and design decisions. Claude Code was used as a coding assistant during implementation. All flows were tested on an Android emulator against the mock API.

## Test logins

All passwords are `test1234`: `student`, `staff`, `guest`. Candidate id `c_b948552f5f` comes from `.env`.
