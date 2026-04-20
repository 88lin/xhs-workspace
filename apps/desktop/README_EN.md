# XHS Atelier Desktop

`apps/desktop/` contains the main Tauri desktop product in this repository.

The desktop app is the primary surface of `XHS Atelier`. The goal is to let non-technical users move from capture to organization to drafting and RedClaw execution inside one local desktop workspace instead of juggling scripts, shell commands, and scattered tools.

## What The Desktop App Covers

- `Overview`: workspace readiness, recent activity, release status, and automation health
- `Capture`: browser bridge intake, manual entry, and local `JSON / JSONL` imports
- `Library`: subject cards, summaries, tags, source material, and creation context
- `Creation Brief`: convert a subject into a reusable writing brief
- `Manuscripts`: save, reopen, branch, and continue editable drafts
- `RedClaw`: run direct generation, continuation, rewrite, and linked writing sessions
- `Archive`: keep history of generated drafts and reopen them later
- `Automation`: scheduled and long-cycle RedClaw tasks
- `Settings`: AI connection setup, export path, workspace backup, and release-readiness checks

## Recommended User Path

1. Open `Settings` and save the AI provider, model, endpoint, and API key.
2. Run the built-in connection test once.
3. Go to `Capture` and import material from the browser bridge, manual entry, or local files.
4. Promote useful material into a subject inside `Library`.
5. Generate a `Creation Brief`.
6. Write or refine the draft in `Manuscripts`.
7. Continue the same thread in `RedClaw`.
8. Archive, branch, resume, or automate the workflow as needed.

## Release Rule

Installer generation is not defined by local packaging.

- GitHub Actions is the official validation and packaging path
- local development commands are for implementation and debugging only
- desktop version metadata must stay aligned across:
  - `apps/desktop/package.json`
  - `apps/desktop/src-tauri/Cargo.toml`
  - `apps/desktop/src-tauri/tauri.conf.json`

## Related Documents

- Chinese desktop guide: [README.md](README.md)
- Desktop release flow: [../../docs/desktop-release-flow.en.md](../../docs/desktop-release-flow.en.md)
- Desktop launch checklist: [../../docs/desktop-launch-checklist.en.md](../../docs/desktop-launch-checklist.en.md)
