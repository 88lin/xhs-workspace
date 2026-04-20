# Contributing

## Scope

This repository is evolving into an open-source Xiaohongshu creator workspace centered on:

- `apps/desktop`: the primary Tauri desktop product
- `apps/extension`: browser-side capture entry
- `packages/content-ops`: content workflow assets stored directly under `.xhsspec/`
- `skills/`: legacy Claude/Codex skill entry points

## Before You Start

- Read [README.md](/README.md) or [README_EN.md](/README_EN.md), then review the desktop docs in `docs/`.
- Prefer small, reviewable pull requests.
- Do not add local-only packaging steps. Desktop validation, bundle builds, and installer generation must stay in GitHub Actions.
- Do not commit secrets, API keys, or personal datasets.

## Development Rules

- Keep new code aligned with the current product direction: refined desktop workspace, light mode first, dark mode supported.
- Preserve compatibility with the desktop release workflows under `.github/workflows/`.
- Prefer neutral naming in new infrastructure code. Do not introduce new `RedBox` / `LexBox` branding into production paths.
- When modifying imported code, trim or adapt it to the current product instead of copying more legacy surface area.

## Pull Requests

- Describe the user-facing outcome and the main files changed.
- Call out any release, packaging, workflow, or schema impact.
- If you could not run verification locally, say so explicitly.
- Add screenshots for desktop UI changes when practical.

## Recommended PR Checklist

- The change is scoped and reversible.
- Desktop-facing copy is readable and not placeholder text.
- GitHub Actions workflows were not broken by the change.
- New files use clear names and match the repo structure.
