#!/bin/sh
# Make the reduced-motion still frame for a GIF: foo.gif -> foo-still.png (first frame).
# macOS only (uses sips). Usage: scripts/gif-still.sh src/assets/gifs/foo.gif
set -eu
for gif in "$@"; do
  still="${gif%.gif}-still.png"
  sips -s format png "$gif" --out "$still" >/dev/null
  echo "wrote $still"
done
