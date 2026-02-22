#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: npm run release -- <major|minor|patch>"
  exit 1
fi

BUMP_TYPE="$1"

if [[ "$BUMP_TYPE" != "major" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "patch" ]]; then
  echo "Error: argument must be major, minor, or patch"
  exit 1
fi

# Abort if there are uncommitted changes (they won't be included in the release)
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: uncommitted changes detected. Commit or stash them before releasing."
  git status --short
  exit 1
fi

CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

echo "Bumping: $CURRENT_VERSION → $NEW_VERSION"

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '${NEW_VERSION}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

node -e "
const fs = require('fs');
const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
app.expo.version = '${NEW_VERSION}';
app.expo.ios.buildNumber = '${NEW_VERSION}';
fs.writeFileSync('app.json', JSON.stringify(app, null, 2) + '\n');
"

git add package.json app.json
git commit -m "release: v${NEW_VERSION}"
git tag "app-v${NEW_VERSION}"

echo ""
echo "Created commit and tag app-v${NEW_VERSION}"
echo "Run 'git push && git push origin app-v${NEW_VERSION}' to trigger the TestFlight build"
echo ""
echo "To create the GitHub Release after pushing:"
echo "  gh release create app-v${NEW_VERSION} --title \"CourseBell v${NEW_VERSION}\" --generate-notes"
