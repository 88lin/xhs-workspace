# XHS Workspace

中文 | [English](README_EN.md)

`XHS Workspace` 是一个面向小红书知识管理用户与内容创作者的开源工作台仓库。

仓库名是 `xhs-workspace`，主产品名是 `XHS Atelier`。这个项目当前的核心方向，不再是做一组脚本或命令行工具，而是把采集、整理、写作、归档和持续运营做成一个普通用户也能直接使用的桌面应用。

## 仓库里包含什么

- `XHS Atelier Desktop`：主产品，基于 Tauri 的桌面应用
- `XHS Atelier Collector`：浏览器侧采集扩展，用于把页面内容送入桌面端
- `packages/content-ops`：内容运营资产目录，存放提示词、策略、模板和规范文件
- `skills/`：保留的历史 Skill 兼容入口

## 适合哪些人

- 需要长期收集、沉淀、复用小红书内容素材的人
- 想把选题、资料、brief、草稿、改写、归档放在同一个工作流里的人
- 不想依赖命令行、脚本和复杂配置的普通用户

## 当前已经支持的能力

### 桌面端

- `Overview`：查看工作区状态、最近输出、自动化状态和发布准备情况
- `Capture`：导入浏览器桥接包、手动录入内容、导入本地 `JSON / JSONL`
- `Library`：把采集内容整理成主题卡片和长期可复用资产
- `Creation Brief -> Manuscripts -> RedClaw`：从主题进入创作 brief、稿件、生成执行流
- `Archive`：继续、重写、恢复历史输出
- `Automation`：管理定时任务和长周期任务
- `Settings`：AI 配置、连接测试、导出目录、工作区快照和发布检查

### 浏览器扩展

- 在小红书页面采集内容和基础元数据
- 支持本地导出 `JSON`、`JSONL`、Markdown 等格式
- 支持桥接到桌面端导入目录
- 默认本地使用，不依赖远程数据库

### 发布链路

- 桌面端安装包通过 GitHub Actions 自动校验、构建和发布
- 扩展端可以通过 GitHub Actions 打包 zip
- 桌面端发布产物包含 `bundle-manifest.json` 与 `SHA256SUMS.txt`

## 非技术用户怎么开始

1. 打开 GitHub Releases，下载桌面端安装包。
2. 启动桌面端后，先进入 `Settings` 配置模型服务。
3. 执行一次真实连接测试。
4. 打开 `Capture`，导入浏览器扩展导出的数据，或手动录入内容。
5. 在 `Library` 里把素材整理成主题卡片。
6. 从主题卡片生成 `Creation Brief`。
7. 在 `Manuscripts` 中创建草稿，并进入 RedClaw 继续创作。
8. 使用 `Archive` 和 `Automation` 做长期内容积累和持续输出。

## 仓库结构

```text
xhs-workspace/
|- apps/
|  |- desktop/                 # Tauri 桌面应用主产品
|  `- extension/               # 浏览器侧采集扩展
|- packages/
|  `- content-ops/             # 内容运营资产
|     |- .xhsspec/             # 实际提示词、模板、规范和策略目录
|     `- README.md             # 目录说明
|- docs/                       # 发布流程、上线清单、方案说明
|- skills/                     # 历史 Skill 兼容入口
`- .github/                    # GitHub Actions 与仓库治理配置
```

`packages/content-ops` 现在已经收平，不再保留历史的 `template-repo/` 过渡层，维护时可以直接进入真实资产目录。

## 发布规则

- 推送到 `main` / `master` / `develop` 会触发桌面端校验
- 推送 `desktop-v*` tag 会构建桌面端安装包并发布 Release
- 推送 `extension-v*` tag 会构建扩展端发布包
- 桌面端版本号必须在以下 3 个文件中保持一致：
  - `apps/desktop/package.json`
  - `apps/desktop/src-tauri/Cargo.toml`
  - `apps/desktop/src-tauri/tauri.conf.json`

GitHub Actions 现在已经切到 Node 24 兼容运行方式，桌面端校验链已恢复通过。

## 当前边界

- 代码签名还未完成
- macOS notarization 还未配置
- 自动更新通道还未接入
- 浏览器扩展仍然是辅助采集端，不替代桌面端主工作流

## 主要文档

- [桌面端说明](apps/desktop/README.md)
- [浏览器扩展说明](apps/extension/README.md)
- [内容资产目录说明](packages/content-ops/README.md)
- [桌面端发布流程](docs/desktop-release-flow.md)
- [桌面端发布检查清单](docs/desktop-launch-checklist.md)
- [第三方来源与并入说明](THIRD_PARTY_IMPORTS.md)
- [贡献指南](CONTRIBUTING.md)
- [行为准则](CODE_OF_CONDUCT.md)
- [安全策略](SECURITY.md)

## 历史 Skill 兼容模式

如果你仍然要沿用最早的 Skill 工作方式，仓库里还保留了兼容入口：

```bash
/plugin marketplace add 88lin/xhs-workspace
/plugin install rednote-to-obsidian@xhs-workspace-marketplace
```

示例：

```text
/xhs https://www.xiaohongshu.com/explore/...
```

## 开源信息

- License：[MIT](LICENSE)
- 第三方来源与授权边界：[THIRD_PARTY_IMPORTS.md](THIRD_PARTY_IMPORTS.md)
- 仓库地址：<https://github.com/88lin/xhs-workspace>
- Releases：<https://github.com/88lin/xhs-workspace/releases>
- Issues：<https://github.com/88lin/xhs-workspace/issues/new/choose>
