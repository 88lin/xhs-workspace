#!/usr/bin/env bash

set -euo pipefail

VERSION="${VERSION:-1.2.0}"
PACKAGE_NAME="${PACKAGE_NAME:-xhs-atelier-collector-v${VERSION}.zip}"
TEMP_DIR="${TEMP_DIR:-xhs-atelier-collector-package}"

echo "Packaging XHS Atelier Collector v${VERSION}..."

echo "Checking for hard-coded API keys..."
if grep -r "sk-or-v1-[a-zA-Z0-9]\{20,\}\|sk-ant-[a-zA-Z0-9]\{20,\}\|AIza[a-zA-Z0-9]\{20,\}" --include="*.js" --include="*.json" --exclude="package.sh" . | grep -v "placeholder\|Placeholder\|keyPlaceholder"; then
    echo "Potential real API key detected. Please inspect the files before packaging."
    exit 1
fi

echo "No hard-coded API keys detected."

rm -f "$PACKAGE_NAME"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

required_files=(
    manifest.json
    background.js
    bridge.js
    injector.js
    ai-panel.css
    onboarding.html
    onboarding.js
    README.md
    README_EN.md
    LICENSE
    PRIVACY.md
)

required_dirs=(
    icons
    popup
    lib
)

optional_dirs=(
    exports
)

echo "Copying extension files..."
for file in "${required_files[@]}"; do
    cp "$file" "$TEMP_DIR/"
done

for dir in "${required_dirs[@]}"; do
    cp -r "$dir" "$TEMP_DIR/"
done

for dir in "${optional_dirs[@]}"; do
    if [ -d "$dir" ]; then
        cp -r "$dir" "$TEMP_DIR/"
    fi
done

find "$TEMP_DIR" -name ".DS_Store" -delete

echo "Creating archive..."
(
    cd "$TEMP_DIR"
    zip -r "../$PACKAGE_NAME" . -x "*.DS_Store" "*.git*"
)

rm -rf "$TEMP_DIR"

if [ -f "$PACKAGE_NAME" ]; then
    FILE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    echo "Package created successfully."
    echo "Archive: $PACKAGE_NAME"
    echo "Size: $FILE_SIZE"
else
    echo "Packaging failed."
    exit 1
fi
