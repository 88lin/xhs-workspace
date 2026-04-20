# Desktop Release Flow

The desktop app follows one fixed rule:

- do not install desktop dependencies locally for release work
- do not run `pnpm build` locally for release validation
- do not run `pnpm tauri build` locally for release packaging
- use GitHub Actions as the single path for validation, bundling, and release output

This keeps release artifacts consistent and avoids local environment drift.

## Release Metadata Rule

Before creating a desktop release tag, keep these three files on the same version:

- `apps/desktop/package.json`
- `apps/desktop/src-tauri/Cargo.toml`
- `apps/desktop/src-tauri/tauri.conf.json`

The repository now enforces this through:

- `pnpm release:check` in `apps/desktop/`
- `desktop-validate` on branch pushes and pull requests
- `desktop-bundle` on release tag pushes

Desktop release tags must match the desktop version exactly:

- version `0.1.0` -> tag `desktop-v0.1.0`
- version `0.2.0-beta.1` -> tag `desktop-v0.2.0-beta.1`

If the tag and the in-repo version differ, the release workflow fails before bundle generation.

## Active Workflows

### `desktop-validate`

Workflow file:

- `.github/workflows/desktop-validate.yml`

Triggers:

- `push` to `main` / `master` / `develop`
- `pull_request`
- manual `workflow_dispatch`

What it currently does:

- validates desktop version metadata before build work starts
- runs `pnpm install --frozen-lockfile` in `apps/desktop/`
- runs frontend typecheck via `pnpm typecheck`
- runs frontend production build via `pnpm build:web`
- runs `cargo fmt --all --check` in `apps/desktop/src-tauri/`
- runs Linux `cargo check --all-targets`
- runs a Linux Tauri app build check via `pnpm tauri build --ci --no-bundle`
- runs extra host checks on Linux / Windows / macOS with `cargo check --all-targets`
- only triggers automatically when desktop-related paths change

### `desktop-bundle`

Workflow file:

- `.github/workflows/desktop-bundle.yml`

Triggers:

- tag push matching `desktop-v*`
- manual `workflow_dispatch`

What it currently does:

- reruns release validation
- validates that the pushed tag matches the desktop version in the repository
- builds Tauri bundles on Linux / Windows / macOS
- writes `bundle-manifest.json` and `SHA256SUMS.txt` into the bundle output
- uploads versioned bundle artifacts to GitHub Actions
- publishes a GitHub Release automatically for tags starting with `desktop-v`
- uses the release name format `XHS Atelier Desktop vX.Y.Z`
- generates release notes through `.github/release.yml`

## Recommended Release Steps

1. Update the desktop version in all three release metadata files.
2. Push the desktop changes to the repository.
3. Wait for `desktop-validate` to pass.
4. Create a workspace backup snapshot, and copy the workspace/export folders too if you need a full rollback point.
5. Create a version tag such as `desktop-v0.1.0`.
6. Push the tag to GitHub.
7. Wait for `desktop-bundle` to finish.
8. Download installers plus `SHA256SUMS.txt` from GitHub Releases.
9. Verify the checksum for the installer you plan to distribute.

Example:

```bash
git tag desktop-v0.1.0
git push origin desktop-v0.1.0
```

Optional preflight command:

```bash
cd apps/desktop
pnpm release:check
```

## Verify Checksums

After downloading an installer and `SHA256SUMS.txt`, verify the file before sharing it.

Windows PowerShell example:

```powershell
Get-FileHash .\xhs-atelier-installer.msi -Algorithm SHA256
```

macOS / Linux example:

```bash
sha256sum ./xhs-atelier-installer.AppImage
```

Match the resulting hash with the entry in `SHA256SUMS.txt`.

## Workspace Snapshot Note

The desktop backup snapshot is a metadata restore point. It intentionally excludes:

- the RedClaw API key
- raw manuscript files
- local media files stored alongside the workspace

For a full rollback or machine migration, keep the snapshot together with copies of the workspace and export folders.

## Current Boundaries

- validation, bundle generation, artifact upload, and GitHub Release publishing are covered
- each release bundle now includes a machine-readable manifest and SHA-256 checksums
- GitHub auto-generated release notes are standardized through `.github/release.yml`
- signing, notarization, and auto-update channel work are not configured yet
- if CI fails, fix the repository or workflow rather than packaging locally
