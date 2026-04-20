# XHS Atelier 浏览器采集扩展

`apps/extension/` 是 `XHS Atelier` 的浏览器 companion。

它负责在小红书页面采集内容、整理为 `JSON / JSONL` 导出包，并把数据送入桌面端的 `Capture / Inbox / Library` 工作流。主产品仍然是 [`apps/desktop/`](../desktop/README.md) 里的 Tauri 桌面应用。

[English Documentation](README_EN.md)

## 当前定位

- 浏览器侧采集入口：负责采集、筛选、导出
- 桌面端工作台：负责整理、创作、归档、RedClaw 执行流
- 两端配合使用：扩展把内容送进桌面端，桌面端把素材沉淀成可复用资产

## 主要能力

- 采集小红书页面中的笔记内容与基础元数据
- 支持浏览器侧的 AI 分析与标签整理
- 支持导出 `JSON`、`JSONL`、Markdown 等格式
- 支持把导出结果送入桌面端桥接目录，减少手工搬运
- 默认本地存储，避免把原始采集数据上传到第三方服务

## 安装方式

### 方式 1：直接从仓库加载（当前推荐）

1. 克隆当前仓库：

   ```bash
   git clone https://github.com/88lin/xhs-workspace.git
   ```

2. 打开 Chrome 或 Edge 的扩展管理页：`chrome://extensions/`
3. 打开右上角的“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择当前仓库中的 `apps/extension` 目录

### 方式 2：从 GitHub Releases 安装（发布后）

发布包会统一放在当前仓库的 Releases 页面：

- 仓库主页：<https://github.com/88lin/xhs-workspace>
- Releases：<https://github.com/88lin/xhs-workspace/releases>
- 发布标签约定：`extension-v*`

计划中的扩展压缩包命名为：

- `xhs-atelier-collector-v*.zip`

## 如何与桌面端协作

推荐流程：

1. 在桌面端 `Capture` 页面初始化或打开桥接目录
2. 在扩展侧导出 `JSON / JSONL` 或桥接包
3. 回到桌面端执行 `Import from bridge` 或本地文件导入
4. 在 `Library` 中整理主题卡、生成 creation brief、进入 Manuscripts / RedClaw

如果你只想临时采集内容，也可以只使用扩展；但如果你要做长期内容沉淀、批量整理和创作流，建议配合桌面端一起使用。

## 隐私与数据边界

- 采集数据默认保存在浏览器本地
- AI 分析只会把必要内容发送到你自己配置的模型服务
- 桌面端导入后，内容会进入本地工作区，不依赖远程数据库
- 详细说明见 [PRIVACY.md](PRIVACY.md)

## 当前限制

- 目前仍然以“加载已解压扩展”作为主安装方式
- 发布用 zip 包与 GitHub Actions 打包链已经对齐到当前仓库
- 浏览器扩展是 companion，不替代桌面端工作台

## 支持与反馈

- 项目仓库：<https://github.com/88lin/xhs-workspace>
- 问题反馈：<https://github.com/88lin/xhs-workspace/issues/new/choose>
- 桌面端发布说明：[../../docs/desktop-release-flow.md](../../docs/desktop-release-flow.md)
- 第三方来源与借鉴说明：[../../THIRD_PARTY_IMPORTS.md](../../THIRD_PARTY_IMPORTS.md)

## 来源说明

当前扩展能力基于已获授权的开源项目进行整理和并入，相关来源与边界已经统一记录在：

- [../../THIRD_PARTY_IMPORTS.md](../../THIRD_PARTY_IMPORTS.md)

这份说明会持续更新，用来明确哪些能力来自参考、哪些部分已经被当前项目重新整合。
