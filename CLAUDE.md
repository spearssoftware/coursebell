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

`main` is protected, so the version bump has to land through a pull request. The
release script creates the commit and tag locally; move the commit to a branch,
merge it, then tag the merge commit:

```bash
npm run release -- patch   # or major / minor — commits and tags locally
```

```bash
git branch release/vX.Y.Z && git tag -d app-vX.Y.Z && git branch -f main origin/main
```

```bash
git checkout release/vX.Y.Z && git push -u origin release/vX.Y.Z
```

```bash
gh pr create --title "release: vX.Y.Z" --body "Version bump." && gh pr merge --squash --delete-branch
```

```bash
git tag app-vX.Y.Z && git push origin app-vX.Y.Z
```

```bash
gh release create app-vX.Y.Z --title "CourseBell vX.Y.Z" --generate-notes
```

The script bumps versions in `package.json` and `app.json`. Pushing the tag
triggers `.github/workflows/release.yml`, which builds on a macOS runner
(`expo prebuild` + `xcodebuild` with automatic signing via the App Store Connect
API key) and uploads to TestFlight with `altool`. `gh release create` adds a
GitHub Release with notes generated from commits since the last tag.

To exercise the pipeline without shipping a build, dispatch the workflow with
`validate_only` — it runs the same steps but asks App Store Connect to validate
the binary instead of accepting it:

```bash
gh workflow run release.yml --ref main -f validate_only=true
```

### Signing

The app is owned by the **Spears Software LLC** team (`8699D47AJD`) in App Store
Connect; the workflow pins that ID. Signing is automatic — `-allowProvisioningUpdates`
plus the API key lets Xcode provision the profile and use the team's cloud-managed
distribution certificate, so no certificate or profile secrets are stored. The
required secrets are `APP_STORE_CONNECT_API_KEY` (base64 of the `.p8`),
`APP_STORE_CONNECT_KEY_ID` (the bare 10-character ID), and
`APP_STORE_CONNECT_ISSUER_ID`. The key must belong to the same team that owns
the app, or uploads fail with confusing errors about bundle IDs and profiles.
