# XHS Atelier Collector Extension

`apps/extension/` is the browser-side companion for `XHS Atelier`.

It captures Xiaohongshu content in the browser, prepares `JSON / JSONL` export packages, and feeds them into the desktop app's `Capture / Inbox / Library` workflow. The primary product remains the Tauri desktop app in [`apps/desktop/`](../desktop/README.md).

[中文文档](README.md)

## Product Role

- browser capture entry: collect, review, export
- desktop studio: organize, write, archive, and run the RedClaw flow
- together: the extension sends raw material into the desktop app, and the desktop app turns it into reusable content assets

## Main Capabilities

- capture Xiaohongshu notes and basic metadata in the browser
- run optional AI analysis and tag organization on the browser side
- export `JSON`, `JSONL`, Markdown, and related formats
- hand off export packages to the desktop bridge directory
- keep captured source data local by default

## Installation

### Option 1: Load From This Repository (Recommended for now)

1. Clone the repository:

   ```bash
   git clone https://github.com/88lin/xhs-workspace.git
   ```

2. Open `chrome://extensions/` in Chrome or Edge
3. Enable `Developer mode`
4. Click `Load unpacked`
5. Select the `apps/extension` directory from this repository

### Option 2: Install From GitHub Releases (After packaged releases are published)

Release assets for this project will be published from the current repository:

- Repository: <https://github.com/88lin/xhs-workspace>
- Releases: <https://github.com/88lin/xhs-workspace/releases>
- Release tag convention: `extension-v*`

The planned extension archive naming is:

- `xhs-atelier-collector-v*.zip`

## Working With The Desktop App

Recommended flow:

1. Initialize or open the bridge directory from the desktop app's `Capture` page
2. Export `JSON / JSONL` or bridge packages from the extension
3. Import them from the bridge or as local files in the desktop app
4. Continue with subject organization, creation briefs, Manuscripts, and RedClaw inside the desktop app

You can still use the extension by itself for lightweight collection, but the long-term knowledge and creation workflow is designed around the desktop app.

## Privacy And Data Boundaries

- captured data stays in browser-local storage by default
- AI analysis only sends necessary content to the model provider you configured
- after import, the desktop app stores content in the local workspace
- see [PRIVACY.md](PRIVACY.md) for the detailed privacy note

## Current Boundaries

- the main install path is still `Load unpacked`
- packaged zip delivery and GitHub Actions packaging now live in this repository
- the extension is a companion product, not a replacement for the desktop studio

## Support

- Repository: <https://github.com/88lin/xhs-workspace>
- Issues: <https://github.com/88lin/xhs-workspace/issues/new/choose>
- Desktop release flow: [../../docs/desktop-release-flow.en.md](../../docs/desktop-release-flow.en.md)
- Third-party import notes: [../../THIRD_PARTY_IMPORTS.md](../../THIRD_PARTY_IMPORTS.md)

## Attribution

The current extension capability set is assembled from authorized open-source sources that have been merged or adapted into this repository. The provenance and boundaries are documented in:

- [../../THIRD_PARTY_IMPORTS.md](../../THIRD_PARTY_IMPORTS.md)
