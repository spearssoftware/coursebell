# CourseBell

Never miss a bell. CourseBell helps students and teachers track school bell schedules with notifications for period starts and ends.

## Features

- **Bell schedules** — configure period times for each day of the week
- **Schedule templates** — save and reuse common schedule patterns
- **Notifications** — get alerted before periods start and end
- **QR sharing** — share schedules between devices via QR code or deep link
- **Day view** — see the full schedule for any day at a glance

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
