# XHS Workspace

[中文](README.md) | English

`XHS Workspace` is an open-source repository for Xiaohongshu knowledge management users and content creators.

The repository name is `xhs-workspace`, while the product name is `XHS Atelier`. The project direction is no longer to stay as a collection of scripts or command-line tools. The goal is to turn capture, organization, drafting, archive, and ongoing content operations into a desktop product that non-technical users can actually use.

## What This Repository Contains

- `XHS Atelier Desktop`: the main Tauri desktop product
- `XHS Atelier Collector`: the browser-side companion for capture and bridge import
- `packages/content-ops`: content operations assets, prompts, strategy files, and workflow materials
- `skills/`: retained legacy Skill entry points for compatibility

## Who This Is For

- users who want to collect and reuse Xiaohongshu material over time
- creators who want subjects, source material, briefs, drafts, and generation in one workspace
- non-technical users who want a product, not shell commands and fragile local scripts

## Current Capability Surface

### Desktop

- `Overview`: workspace readiness, recent outputs, automation status, and release readiness
- `Capture`: bridge intake, manual entry, and local `JSON / JSONL` imports
- `Library`: convert captured material into reusable subject cards
- `Creation Brief -> Manuscripts -> RedClaw`: move from organized material into actual writing flow
- `Archive`: continue, rewrite, and resume older outputs
- `Automation`: scheduled and long-cycle RedClaw tasks
- `Settings`: AI connection setup, export path, workspace backup, and release checks

### Browser Companion

- capture Xiaohongshu page content and base metadata
- export `JSON`, `JSONL`, Markdown, and related local formats
- hand off captured material to the desktop bridge directory
- stay local by default

### Release Pipeline

- desktop installers are validated, built, and published through GitHub Actions
- extension bundles can be packaged through GitHub Actions
- desktop releases include `bundle-manifest.json` and `SHA256SUMS.txt`

## Recommended End-User Path

1. Download the desktop installer from GitHub Releases.
2. Open `Settings` and configure the model service.
3. Run one real connection test.
4. Import captured material from the bridge directory, manual entry, or local files.
5. Organize the material into subjects in `Library`.
6. Generate a `Creation Brief`.
7. Create or refine a draft in `Manuscripts`.
8. Continue the writing session in RedClaw.
9. Use archive and automation only after the base workflow is stable.

## Repository Layout

```text
xhs-workspace/
|- apps/
|  |- desktop/                 # main Tauri desktop product
|  `- extension/               # browser capture companion
|- packages/
|  `- content-ops/             # content operations assets
|     |- .xhsspec/             # actual prompts, templates, specs, and strategy files
|     `- README.md             # directory guide
|- docs/                       # release and launch documents
|- skills/                     # legacy Skill compatibility layer
`- .github/                    # GitHub Actions and repo governance
```

`packages/content-ops` has been flattened. The old `template-repo/` transition layer is gone, so maintainers can work directly in the real asset directory.

## Release Rules

- pushes to `main` / `master` / `develop` trigger desktop validation
- pushing a `desktop-v*` tag builds desktop installers and publishes a release
- pushing an `extension-v*` tag packages the browser extension bundle
- desktop version metadata must stay aligned across:
  - `apps/desktop/package.json`
  - `apps/desktop/src-tauri/Cargo.toml`
  - `apps/desktop/src-tauri/tauri.conf.json`

The GitHub Actions workflows are now configured for the Node 24 runtime path, and the desktop validation pipeline is passing again.

## Current Boundaries

- code signing is not finished yet
- macOS notarization is not configured yet
- auto-update channels are not configured yet
- the extension remains a companion, not the primary product surface

## Key Documents

- [Desktop Guide (Chinese)](apps/desktop/README.md)
- [Desktop Guide (English)](apps/desktop/README_EN.md)
- [Browser Extension Guide](apps/extension/README_EN.md)
- [Content Ops Assets Guide](packages/content-ops/README.md)
- [Desktop Release Flow](docs/desktop-release-flow.en.md)
- [Desktop Launch Checklist](docs/desktop-launch-checklist.en.md)
- [Third-Party Import Notes](THIRD_PARTY_IMPORTS.md)

## Open Source Notes

- License: [MIT](LICENSE)
- Third-party provenance and reuse boundaries: [THIRD_PARTY_IMPORTS.md](THIRD_PARTY_IMPORTS.md)
- Repository: <https://github.com/88lin/xhs-workspace>
- Releases: <https://github.com/88lin/xhs-workspace/releases>
- Issues: <https://github.com/88lin/xhs-workspace/issues/new/choose>
