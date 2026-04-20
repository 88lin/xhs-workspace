# Desktop Launch Checklist

This checklist is for `apps/desktop/`.

It is intended to answer one question clearly: is the desktop app ready to be released, not just demoed.

## Release Blockers

Do not cut a `desktop-v*` release tag if any of these are still failing:

- RedClaw `Model / Endpoint / API Key` is incomplete
- RedClaw connection test has not passed
- the embedded content pack is not available
- there is no usable subject card for the creation flow
- the desktop version is not aligned across `package.json`, `Cargo.toml`, and `tauri.conf.json`
- GitHub Actions `desktop-validate` is failing

If the only remaining signal is the advisory Rust formatting warning, treat it as a cleanup task, not as a release blocker.

## Recommended Order

1. Complete the AI settings in the desktop app.
2. Run the connection test.
3. Prepare at least one subject card in the library.
4. Run one full `Creation brief -> Manuscripts -> RedClaw` flow.
5. Confirm that output is archived successfully.
6. Align the desktop version in the three release metadata files.
7. Optionally run `pnpm release:check` in `apps/desktop/`.
8. Create a workspace backup snapshot, and copy the workspace/export folders as well if you need a full rollback point.
9. Push the code to GitHub.
10. Wait for `desktop-validate` to pass.
11. Create and push the matching `desktop-v*` tag.
12. Wait for `desktop-bundle` to publish the installers.
13. Verify that the GitHub Release includes `SHA256SUMS.txt` and `bundle-manifest.json`.

## Delivery Constraints

- do not install desktop dependencies locally for release work
- do not run `pnpm build` locally for release packaging
- do not run `pnpm tauri build` locally
- do not build installers locally
- use GitHub Actions as the only packaging path

## Manual Acceptance Checks

Before release, verify these workflows at least once:

- save settings
- test model connection
- create a subject card
- generate a creation brief
- write a manuscript
- trigger RedClaw generation
- see outputs in recent outputs and archive
- open manuscript paths and the export directory
- confirm the GitHub Release contains installers and checksum files
