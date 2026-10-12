#!/usr/bin/env bash
# Sync built @felipechandiadev/ui from sibling ../kai-ui into vendor/kai-ui.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${KAI_UI_PATH:-$ROOT/../kai-ui}"
DEST="$ROOT/vendor/kai-ui"

if [[ ! -f "$SRC/package.json" ]]; then
  echo "kai-ui not found at $SRC (set KAI_UI_PATH if needed)" >&2
  exit 1
fi

echo "Building kai-ui in $SRC ..."
(cd "$SRC" && npm run build)

echo "Copying package into $DEST ..."
mkdir -p "$DEST"
rm -rf "$DEST/dist"
cp "$SRC/package.json" "$SRC/README.md" "$DEST/"
cp -R "$SRC/dist" "$DEST/dist"

echo "Done. Run npm install in Berries if the lockfile needs refresh."
