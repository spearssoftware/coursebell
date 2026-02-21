# CourseBell

Expo + React Native app for scheduling school bell notifications.

## Project Structure

- `app/` — Expo Router screens (`(tabs)/`, `day/`, `onboarding.tsx`)
- `src/components/` — shared UI components
- `src/lib/` — pure logic (`bell-engine.ts`, `time-utils.ts`, `qr-codec.ts`)
- `src/store/` — Zustand stores (`schedule-store.ts`, `settings-store.ts`)
- `src/types.ts` — shared types
- `src/theme.ts` — colors, spacing, typography
- `__mocks__/` — Jest manual mocks for native modules

## Commands

```bash
npm test              # run all tests
npm run test:watch    # watch mode
npm run ios           # run on iOS simulator
npm run start         # start Expo dev server
```

## Releases

To cut a release:

```bash
npm run release -- patch   # or major / minor
git push && git push origin app-vX.Y.Z
gh release create app-vX.Y.Z --title "CourseBell vX.Y.Z" --generate-notes
```

The script bumps versions in `package.json` and `app.json`, commits `release: vX.Y.Z`, and creates the tag `app-vX.Y.Z`. Pushing the tag triggers the TestFlight build via EAS. The `gh release create` step creates a GitHub Release with auto-generated notes from commits since the last tag.

When asked to do a release, run the script with the appropriate bump type (default: patch), push both the commit and tag, then create the GitHub Release.
