# XHS Workspace

中文 | [English](README_EN.md)

XHS Workspace 是一个面向小红书知识管理用户与内容创作者的开源工作台。

仓库名是 `xhs-workspace`，主产品名是 `XHS Atelier`。这个项目的目标不是再做一个命令行脚本集合，而是把内容采集、整理、创作、归档和持续运营，做成普通用户也能直接使用的桌面应用。

## 项目包含什么

- `XHS Atelier Desktop`：基于 Tauri 的桌面应用，是当前主产品。
- `XHS Atelier Collector`：可选浏览器扩展，用于浏览器侧采集、分析和桥接导入。
- `packages/content-ops`：内容策略、提示词、模板和工作流资产。
- `skills/`：保留的历史 Skill 入口，兼容原有使用方式。

## 适合谁使用

- 需要长期收集、沉淀和复用小红书内容素材的知识管理用户。
- 需要把选题、素材、草稿和生成流程放进同一工作台的内容创作者。
- 想把浏览器采集和本地创作流程串起来，而不想依赖命令行、脚本或复杂配置的普通用户。

## 当前已经支持的功能

### 桌面端

- `Overview` 总览页：查看项目状态、最近输出、自动化任务状态和发布准备情况。
- `Capture` 采集页：支持浏览器桥接导入、手动录入、`JSON / JSONL` 文件导入。
- `Library` 资料库：把采集内容整理成主题卡片，沉淀为可复用的创作资产。
- `Creation brief -> Manuscripts -> RedClaw` 连续创作流：从主题卡直接生成 brief、写入 Manuscripts，并进入 RedClaw 创作执行流。
- 草稿归档与继续创作：支持继续生成、重写、恢复会话、打开外部文件。
- 自动化能力：支持定时任务和长周期任务，把生成结果持续归档到同一个工作区。
- 设置与工作区管理：支持 AI 连接测试、导出目录设置、工作区快照导出与恢复。

### 浏览器扩展

- 在小红书页面采集笔记内容与基础元数据。
- 支持浏览器侧 AI 分析、标签整理和导出。
- 支持导出 `JSON`、`JSONL`、Markdown 等格式。
- 支持将采集结果送入桌面端桥接目录，减少手工搬运。
- 默认本地存储，不依赖远程数据库。

### 仓库与发布链路

- 桌面端安装包通过 GitHub Actions 自动校验、构建和发布。
- 浏览器扩展支持通过 GitHub Actions 打包 zip 发布。
- 桌面端发布会自动生成 `bundle-manifest.json` 和 `SHA256SUMS.txt`。

## 普通用户怎么使用

1. 安装桌面端：正式安装包会发布在 GitHub Releases。桌面端是主入口，建议先从桌面端开始使用。
2. 完成首次设置：打开 `Settings`，填写 AI Provider、Model、Endpoint、API Key，并执行一次真实连接测试。
3. 采集内容：在 `Capture` 中选择浏览器桥接导入、手动录入，或导入本地 `JSON / JSONL` 文件。
4. 整理主题：把采集内容整理进 `Library` 的主题卡片，补充摘要、标签和创作方向。
5. 开始创作：从主题卡生成 `Creation brief`，写入 `Manuscripts`，再进入 `RedClaw` 继续生成和修改。
6. 管理输出：在归档和最近输出中继续、重写或恢复之前的草稿。
7. 做长期运营：如果需要持续生产内容，可以在桌面端配置定时任务和长周期任务。
8. 备份工作区：在重要导入、换机器或发版前，导出工作区快照，保留本地恢复点。

## 安装方式

### 面向普通用户

- 桌面端安装包：查看 GitHub Releases。
- 浏览器扩展：优先从 Releases 下载打包 zip；开发阶段也可以通过 `Load unpacked` 直接加载 `apps/extension/`。

### 面向开发者或测试者

桌面端和扩展都在这个 monorepo 中维护：

```text
xhs-workspace/
|- apps/
|  |- desktop/                 # Tauri 桌面应用
|  `- extension/               # 浏览器采集扩展
|- packages/
|  `- content-ops/             # 内容工作流与模板资产
|- skills/                     # 历史 Skill 入口
|- docs/                       # 发布与维护文档
`- .github/                    # GitHub Actions 与仓库治理
```

桌面端正式安装包不以本地打包为准，统一以 GitHub Actions 产物为准。

## 发布规则

- 推送到 `main` / `master` / `develop` 时会自动触发桌面端校验。
- 推送 `desktop-v*` tag 时会自动构建桌面端安装包并发布 Release。
- 推送 `extension-v*` tag 时会自动打包浏览器扩展 zip。
- 桌面端版本号必须在这三个文件里保持一致：
  - `apps/desktop/package.json`
  - `apps/desktop/src-tauri/Cargo.toml`
  - `apps/desktop/src-tauri/tauri.conf.json`

## 当前边界

- 代码签名、macOS notarization 和自动更新通道还没有完成配置。
- 浏览器扩展是 companion，不替代桌面端主工作流。
- `skills/` 仍然保留，但已经不是这个仓库的主产品形态。

## 主要文档

- [桌面端说明](apps/desktop/README.md)
- [浏览器扩展说明](apps/extension/README.md)
- [桌面端发布流程](docs/desktop-release-flow.md)
- [桌面端发布检查清单](docs/desktop-launch-checklist.md)
- [第三方来源说明](THIRD_PARTY_IMPORTS.md)
- [贡献指南](CONTRIBUTING.md)
- [行为准则](CODE_OF_CONDUCT.md)
- [安全策略](SECURITY.md)

## 历史 Skill 用法

如果你仍然想使用最早的 Skill 方式，仓库里也保留了兼容入口：

```bash
/plugin marketplace add 88lin/xhs-workspace
/plugin install rednote-to-obsidian@xhs-workspace-marketplace
```

示例：

```text
/xhs https://www.xiaohongshu.com/explore/...
```

## 开源说明

- License: [MIT](LICENSE)
- 第三方来源与授权边界：见 [THIRD_PARTY_IMPORTS.md](THIRD_PARTY_IMPORTS.md)
- 仓库地址：<https://github.com/88lin/xhs-workspace>
- Releases：<https://github.com/88lin/xhs-workspace/releases>
- Issues：<https://github.com/88lin/xhs-workspace/issues/new/choose>
