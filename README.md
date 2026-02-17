# CourseBell

A mobile app that keeps students and teachers on track with customizable school bell schedules and timely notifications. Set up your periods, get alerts before they start and end, and share schedules instantly via QR code.

## Features

- **Live countdown** — see the current period highlighted and a real-time countdown to the next bell
- **Flexible schedules** — configure periods (name, start/end time, bells) independently for each weekday
- **Smart notifications** — get notified when periods start, when they're about to end (1–15 min warning), and when they end
- **Mute today** — silence all bells for the day with one tap
- **QR sharing** — generate a QR code or deep link to share your full schedule with others
- **Copy days** — duplicate one day's periods to another to set up similar schedules quickly
- **Onboarding** — guided first-launch flow that walks through setup and notification permissions

## Tech Stack

- [Expo](https://expo.dev) (SDK 54) with [Expo Router](https://docs.expo.dev/router/introduction/)
- React Native 0.81 (New Architecture)
- TypeScript
- Zustand for state management
- Jest + React Native Testing Library

## Getting Started

```bash
npm install
npm start
```

Press `i` to open in the iOS Simulator or scan the QR code with Expo Go.

## Testing

```bash
npm test
npm run test:watch
```

## Releasing

Bump the version, create a tag, and push to trigger a TestFlight build:

```bash
npm run release -- patch   # 0.6.0 → 0.6.1
npm run release -- minor   # 0.6.0 → 0.7.0
npm run release -- major   # 0.6.0 → 1.0.0

git push && git push origin app-v<version>
```

## CI/CD

| Workflow | Trigger | What it does |
| --- | --- | --- |
| **CI** (`ci.yml`) | Push to `main`, PRs | Type check + Jest tests |
| **Release** (`release.yml`) | `app-v*` tag push, manual | Build iOS app and upload to TestFlight |
