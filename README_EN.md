# XHS Workspace

[中文](README.md) | English

XHS Workspace is an open-source workspace for Xiaohongshu knowledge management users and content creators.

The repository name is `xhs-workspace`, while the main product name is `XHS Atelier`. The goal is no longer to stay as a collection of scripts or command-line utilities. The goal is to turn capture, organization, drafting, archive, and ongoing content operations into a desktop product that non-technical users can actually use.

## What This Repository Includes

- `XHS Atelier Desktop`: the main Tauri desktop app.
- `XHS Atelier Collector`: the optional browser companion for capture, analysis, and bridge import.
- `packages/content-ops`: templates, prompts, strategy assets, and workflow materials.
- `skills/`: retained legacy Skill entry points for compatibility.

## Who This Is For

- knowledge management users who want to collect and reuse Xiaohongshu material over time
- content creators who want subjects, source material, briefs, drafts, and generation in one workspace
- non-technical users who want a real product instead of scripts, shell commands, or fragile local setup

## Current Capabilities

### Desktop App

- `Overview`: launch status, recent outputs, automation status, and release readiness.
- `Capture`: browser bridge import, manual entry, and `JSON / JSONL` file import.
- `Library`: turn captured material into reusable subject cards and writing assets.
- `Creation brief -> Manuscripts -> RedClaw`: generate a brief from a subject, write into Manuscripts, and continue in the RedClaw authoring flow.
- draft archive and continuation: continue, rewrite, resume sessions, and open external files.
- automation: scheduled tasks and long-cycle tasks that keep writing output attached to the same workspace.
- settings and workspace management: AI connection testing, export directory setup, workspace snapshot export, and restore.

### Browser Companion

- capture Xiaohongshu note content and base metadata inside the browser
- optional browser-side AI analysis and tag organization
- export `JSON`, `JSONL`, Markdown, and related formats
- send captured material into the desktop bridge directory
- keep captured data local by default

### Repository And Release Pipeline

- desktop installers are validated, built, and published through GitHub Actions
- the browser extension can be packaged as a zip through GitHub Actions
- desktop releases include `bundle-manifest.json` and `SHA256SUMS.txt`

## How Non-Technical Users Can Use It

1. Install the desktop app: official installers will be published through GitHub Releases. The desktop app is the main entry point.
2. Complete first-time setup: open `Settings`, fill in AI Provider, Model, Endpoint, and API Key, then run one real connection test.
3. Capture content: use browser bridge import, manual entry, or local `JSON / JSONL` files from `Capture`.
4. Organize subjects: turn captured material into subject cards in `Library`, then add summaries, tags, and content angles.
5. Start writing: generate a `Creation brief`, write into `Manuscripts`, and continue in `RedClaw`.
6. Manage output: continue, rewrite, or resume archived drafts from the recent output and archive views.
7. Run long-term workflows: configure scheduled tasks and long-cycle tasks when you want ongoing output.
8. Back up the workspace: export a workspace snapshot before major imports, machine changes, or release testing.

## Installation Paths

### For End Users

- Desktop installers: GitHub Releases.
- Browser extension: prefer packaged zip releases when available. During development, you can still use `Load unpacked` with `apps/extension/`.

### For Developers And Testers

Both products live in the same monorepo:

```text
xhs-workspace/
|- apps/
|  |- desktop/                 # Tauri desktop app
|  `- extension/               # browser capture companion
|- packages/
|  `- content-ops/             # content workflow and template assets
|- skills/                     # legacy Skill entry points
|- docs/                       # release and maintenance docs
`- .github/                    # GitHub Actions and repository governance
```

Official desktop packaging is not defined by local builds. GitHub Actions is the source of truth for release artifacts.

## Release Rules

- pushing to `main` / `master` / `develop` triggers desktop validation
- pushing a `desktop-v*` tag builds desktop installers and publishes a release
- pushing an `extension-v*` tag packages the browser extension zip
- the desktop version must stay aligned across:
  - `apps/desktop/package.json`
  - `apps/desktop/src-tauri/Cargo.toml`
  - `apps/desktop/src-tauri/tauri.conf.json`

## Current Boundaries

- code signing, macOS notarization, and auto-update channels are not configured yet
- the browser extension is a companion, not a replacement for the desktop workflow
- `skills/` still exists, but it is no longer the main product shape of the repository

## Key Documents

- [Desktop App Guide](apps/desktop/README.md)
- [Browser Extension Guide](apps/extension/README_EN.md)
- [Desktop Release Flow](docs/desktop-release-flow.en.md)
- [Desktop Launch Checklist](docs/desktop-launch-checklist.en.md)
- [Third-Party Import Notes](THIRD_PARTY_IMPORTS.md)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

## Legacy Skill Mode

If you still want the original Skill-based flow, the repository keeps that compatibility layer:

```bash
/plugin marketplace add 88lin/xhs-workspace
/plugin install rednote-to-obsidian@xhs-workspace-marketplace
```

Example:

```text
/xhs https://www.xiaohongshu.com/explore/...
```

## Open Source Notes

- License: [MIT](LICENSE)
- Third-party provenance and reuse boundaries: [THIRD_PARTY_IMPORTS.md](THIRD_PARTY_IMPORTS.md)
- Repository: <https://github.com/88lin/xhs-workspace>
- Releases: <https://github.com/88lin/xhs-workspace/releases>
- Issues: <https://github.com/88lin/xhs-workspace/issues/new/choose>
