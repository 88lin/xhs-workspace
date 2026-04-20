# Third-Party Imports

This repository contains imported or adapted material from external open-source projects.

Per the user's project notes, direct permission from the original authors has been obtained for the current non-commercial, open-source integration work. This file records source provenance and imported scope only.

Older analysis documents in this repository may discuss earlier uncertainty around direct code reuse. For the current repository state, author permission is the source of truth.

## Imported Sources

### `Jamailar/RedBox`

- Source: `https://github.com/Jamailar/RedBox`
- Imported scope:
  - desktop application baseline -> `apps/desktop/`
- Purpose:
  - used as one of the reference and implementation starting points for the Tauri desktop workspace

### `fancyyan/xiaohongshu-content-collector`

- Source: `https://github.com/fancyyan/xiaohongshu-content-collector`
- Imported scope:
  - browser extension implementation baseline -> `apps/extension/`
- Purpose:
  - used as the browser-side capture and collection starting point

### `liyown/XHSSpec`

- Source: `https://github.com/liyown/XHSSpec`
- Imported scope:
  - template repository assets -> `packages/content-ops/template-repo/`
- Purpose:
  - used as the content operations, prompt, strategy, and workflow template baseline

## Notes

- Imported code is expected to be further split, trimmed, refactored, or rewritten as the product architecture stabilizes.
- Neutral naming should be preferred in current production code and documentation.
- Source provenance should remain documented even when implementations are heavily modified later.
