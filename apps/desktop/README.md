# XHS Atelier Desktop

`apps/desktop/` contains the main Tauri desktop product in this repository.

The goal of this app is to make Xiaohongshu capture, organization, manuscript drafting, and RedClaw execution usable from one polished desktop workspace instead of a collection of technical scripts.

## Main Workflow

The desktop app already supports these production-facing flows:

- save AI generation settings and run a real connection test
- import content through the browser bridge, manual entry, and JSON / JSONL files
- organize inbox items into subject cards
- generate a creation brief and write it into `Manuscripts`
- enter the RedClaw authoring flow from a subject or manuscript
- archive outputs and continue, rewrite, resume, or open them externally
- manage scheduled and long-cycle RedClaw automation

## Product Surface

The current desktop shell is organized around four main areas:

- `Overview`: launch readiness, setup state, and recent actions
- `Capture`: browser bridge imports, manual entry, and local file intake
- `Library`: subject cards, summaries, tags, and Markdown export
- `Settings`: AI configuration, export paths, automation setup, workspace backups, and release-readiness checks

Inside the `Library`, the main user path is:

- capture material
- promote it into a subject
- generate a creation brief
- write in `Manuscripts`
- continue in `RedClaw`
- archive and branch drafts over time

## Release Rules

For this project, release packaging must not happen locally.

- Do not rely on local installer packaging
- Do not treat local `pnpm tauri build` as the release path
- Use GitHub Actions for validation, bundle generation, and release publishing
- Keep the desktop version aligned across `package.json`, `Cargo.toml`, and `tauri.conf.json`
- Use a matching release tag in the format `desktop-vX.Y.Z`

Relevant workflows:

- `.github/workflows/desktop-validate.yml`
- `.github/workflows/desktop-bundle.yml`

The recommended preflight command is:

- `pnpm release:check`

## Local Commands

These commands still exist for development work inside `apps/desktop/`:

- `pnpm dev`
- `pnpm release:check`
- `pnpm build`
- `pnpm tauri:dev`
- `pnpm tauri:build`

`pnpm release:check` is the preflight command for release metadata.

The other commands are useful for implementation and debugging, but not as the official release pipeline.

## Bundle Metadata

The desktop bundle is branded as `XHS Atelier` and now includes:

- a fixed product identifier: `com.xhsatelier.desktop`
- repository and homepage metadata
- MIT license metadata
- release-oriented descriptions for generated installers

## What Users Need First

If you are using the desktop app for the first time, do these steps in order:

1. Open `Settings`.
2. Save the AI provider, model, endpoint, and API key.
3. Run the connection test once.
4. Open `Capture` and import material from the browser bridge, manual entry, or local files.
5. Create or open a subject in `Library`.
6. Generate the creation brief, move into `Manuscripts`, and open `RedClaw`.
7. Use archive history and automation after the base path works.

## Current Boundaries

- code signing, notarization, and auto-update channels are not configured yet
- GitHub Actions is the official release path for installers
- the extension remains a companion product rather than the primary surface
