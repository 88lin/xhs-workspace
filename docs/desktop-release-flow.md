# 桌面端发布流程

这份文档只说明一件事：

- `XHS Atelier` 桌面端的正式安装包，以 GitHub Actions 产物为准，不以本地打包结果为准

## 固定原则

- 不把本地 `pnpm tauri build` 视为正式发布结果
- 不把本地安装依赖和本地构建当成对外发布流程
- 正式校验、正式打包、正式 Release 都在 GitHub Actions 中完成

## 发布前必须对齐的版本文件

在创建桌面端发布 tag 之前，以下 3 个文件中的版本号必须完全一致：

- `apps/desktop/package.json`
- `apps/desktop/src-tauri/Cargo.toml`
- `apps/desktop/src-tauri/tauri.conf.json`

仓库里已经提供了版本检查脚本：

- 在 `apps/desktop/` 中执行 `pnpm release:check`

## 当前 GitHub Actions 工作流

### `desktop-validate`

文件：

- `.github/workflows/desktop-validate.yml`

触发条件：

- 推送到 `main`
- 推送到 `master`
- 推送到 `develop`
- 针对桌面端相关路径的 Pull Request
- 手动触发

主要职责：

- 先校验桌面端版本元数据
- 安装桌面端依赖
- 执行前端类型检查
- 执行前端构建
- 执行 Rust 格式检查
- 执行 Tauri host 编译检查
- 执行无 bundle 的 Tauri 构建检查
- 在 Linux / macOS / Windows 上分别执行 host-check

当前说明：

- Rust 格式检查仍然保留
- 但它现在是 advisory，不阻塞桌面端整条验证链
- 其余步骤仍然是硬性校验项

### `desktop-bundle`

文件：

- `.github/workflows/desktop-bundle.yml`

触发条件：

- 推送匹配 `desktop-v*` 的 tag
- 手动触发

主要职责：

- 再次校验版本和 tag 是否匹配
- 安装桌面端依赖
- 生成 Tauri 图标资源
- 为 Linux / Windows / macOS 构建桌面端安装包
- 生成 `bundle-manifest.json`
- 生成 `SHA256SUMS.txt`
- 自动发布 GitHub Release

## 当前 Action 运行时说明

桌面端相关工作流已经切换到 Node 24 兼容运行方式：

- 使用 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`
- `actions/checkout` 已更新
- `actions/setup-node` 已更新

这样做的目的，是清掉 GitHub Actions 对 Node 20 JavaScript Action 弃用的警告，并提前适配后续运行时切换。

## 发布 tag 规则

桌面端发布 tag 必须和桌面端版本号严格对应：

- 版本 `0.1.0` 对应 tag `desktop-v0.1.0`
- 版本 `0.2.0-beta.1` 对应 tag `desktop-v0.2.0-beta.1`

不要手写一个和版本号不一致的 tag。

## 推荐发布顺序

1. 修改桌面端版本号，并确保 3 个版本文件一致。
2. 推送桌面端相关改动到仓库分支。
3. 等待 `desktop-validate` 通过。
4. 确认桌面端界面、导入、写作和归档流程都没有明显阻塞项。
5. 创建与版本号一致的 `desktop-v*` tag。
6. 推送该 tag。
7. 等待 `desktop-bundle` 完成。
8. 到 GitHub Releases 检查安装包、校验文件和说明是否齐全。

## 示例

假设当前桌面端版本是 `0.1.0`：

```bash
git tag desktop-v0.1.0
git push origin desktop-v0.1.0
```

## 桌面端正式发布前建议人工确认的内容

- `Settings` 中 AI 连接测试能通过
- `Capture` 能导入桥接包或本地文件
- `Library` 能创建或编辑主题
- `Creation Brief` 能正确承接主题信息
- `Manuscripts` 能保存和重新打开草稿
- RedClaw 能发起生成、继续和重写
- `Archive` 能继续、恢复和清理历史输出
- 自动化任务的基础开关和任务列表正常

## 备份说明

桌面端工作区快照主要是元数据恢复点，默认不包含所有本地媒体文件。

在以下场景前建议备份：

- 大规模导入前
- 迁移机器前
- 发布测试前
- 重置工作区前

如果需要完整迁移，除了快照之外，还应同时保留：

- 工作区目录
- 导出目录
- 与稿件相关的本地文件

## 当前未纳入正式发布链路的内容

- 代码签名
- macOS notarization
- 自动更新通道

这些后续可以补，但不影响当前 GitHub Actions 产物式发布模式。
