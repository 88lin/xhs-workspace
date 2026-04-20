# 桌面端发布流程

桌面端遵循一个固定规则：

- 不在本地为发布工作安装桌面端依赖
- 不在本地为了发布校验执行 `pnpm build`
- 不在本地为了发布打包执行 `pnpm tauri build`
- 所有校验、打包和发布产物输出统一走 GitHub Actions

这样可以避免本地环境漂移，保证最终安装包来自同一条 CI 发布链路。

## 版本元数据规则

创建桌面端发布 tag 之前，下面三个文件里的版本号必须保持一致：

- `apps/desktop/package.json`
- `apps/desktop/src-tauri/Cargo.toml`
- `apps/desktop/src-tauri/tauri.conf.json`

仓库现在会通过以下方式强制校验：

- 在 `apps/desktop/` 中执行 `pnpm release:check`
- 分支推送和 PR 触发的 `desktop-validate`
- 发布 tag 触发的 `desktop-bundle`

桌面端发布 tag 必须和版本号严格对应：

- 版本 `0.1.0` -> tag `desktop-v0.1.0`
- 版本 `0.2.0-beta.1` -> tag `desktop-v0.2.0-beta.1`

如果 tag 和仓库中的桌面端版本不一致，发布工作流会在开始打包前直接失败。

## 当前工作流

### `desktop-validate`

工作流文件：

- `.github/workflows/desktop-validate.yml`

触发方式：

- 推送到 `main` / `master` / `develop`
- `pull_request`
- 手动触发 `workflow_dispatch`

当前职责：

- 在开始构建前校验桌面端版本元数据
- 在 `apps/desktop/` 执行 `pnpm install --frozen-lockfile`
- 执行前端 `pnpm typecheck`
- 执行前端生产构建 `pnpm build:web`
- 在 `apps/desktop/src-tauri/` 执行 `cargo fmt --all --check`
- 在 Linux 上执行 `cargo check --all-targets`
- 执行 `pnpm tauri build --ci --no-bundle`
- 在 Linux / Windows / macOS 上补充 `cargo check --all-targets`
- 只会在桌面端相关路径变更时自动触发

### `desktop-bundle`

工作流文件：

- `.github/workflows/desktop-bundle.yml`

触发方式：

- 推送匹配 `desktop-v*` 的 tag
- 手动触发 `workflow_dispatch`

当前职责：

- 重新执行一轮发布前校验
- 校验当前 tag 是否与仓库中的桌面端版本严格一致
- 在 Linux / Windows / macOS 上构建 Tauri 安装包
- 在 bundle 输出目录生成 `bundle-manifest.json` 和 `SHA256SUMS.txt`
- 将带版本号的 bundle 产物上传到 GitHub Actions Artifacts
- 对 `desktop-v*` tag 自动发布 GitHub Release
- 使用 `XHS Atelier Desktop vX.Y.Z` 作为 release 名称
- 通过 `.github/release.yml` 生成统一格式的 release notes

## 推荐发布步骤

1. 先把三个版本元数据文件更新到同一个版本号。
2. 将桌面端改动推送到仓库。
3. 等待 `desktop-validate` 通过。
4. 创建一份工作区快照；如果需要完整回滚点，再额外复制 workspace 和 export 文件夹。
5. 创建版本 tag，例如 `desktop-v0.1.0`。
6. 将 tag 推送到 GitHub。
7. 等待 `desktop-bundle` 完成。
8. 从 GitHub Releases 下载安装包和 `SHA256SUMS.txt`。
9. 在分发前校验你准备发布的安装包哈希值。

示例命令：

```bash
git tag desktop-v0.1.0
git push origin desktop-v0.1.0
```

可选的发布前本地检查命令：

```bash
cd apps/desktop
pnpm release:check
```

## 校验哈希

下载安装包和 `SHA256SUMS.txt` 后，分发前先做一次哈希校验。

Windows PowerShell 示例：

```powershell
Get-FileHash .\xhs-atelier-installer.msi -Algorithm SHA256
```

macOS / Linux 示例：

```bash
sha256sum ./xhs-atelier-installer.AppImage
```

将命令输出的哈希值与 `SHA256SUMS.txt` 中对应条目进行比对。

## 工作区快照说明

桌面端工作区快照属于“元数据恢复点”，会刻意排除：

- RedClaw API Key
- 原始 manuscript 文件
- 工作区旁边的本地媒体文件

如果要做完整回滚或跨机器迁移，请将这份快照与 workspace、export 文件夹副本一起保存。

## 当前边界

- 当前已经覆盖校验、打包、产物上传和 GitHub Release 发布
- 每次桌面端发布都会附带机器可读的 bundle 清单和 SHA-256 校验文件
- 自动生成的 release notes 已统一接入 `.github/release.yml`
- 代码签名、macOS notarization 与自动更新通道尚未配置
- 如果 CI 失败，应优先修复仓库代码或 workflow，而不是回到本地手工打包
