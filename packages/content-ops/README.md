# Content Ops Assets

`packages/content-ops/` 存放的是桌面端内容工作流要用到的策略资产、提示词、模板和规范文件。

这部分原来带有一层 `template-repo/` 目录。现在已经收平，直接保留为：

- `packages/content-ops/.xhsspec/`

这样做的原因很简单：

- 仓库里当前只保留一套内容运营资产，没有必要再包一层“模板仓库”
- 桌面端 Rust 侧内置引用路径更短，维护时更不容易出错
- 普通维护者进 `packages/` 后能直接看到真实资产目录，而不是先进入一个历史过渡层

## 目录结构

- `.xhsspec/brand/`：品牌画像、受众、语气、禁区、价值主张
- `.xhsspec/commands/`：工作流命令说明
- `.xhsspec/prompts/`：实际提示词模板
- `.xhsspec/specs/`：写作、发布、复盘等规范说明
- `.xhsspec/strategy/`：选题框架、关键词图谱、内容支柱
- `.xhsspec/templates/`：可复用的执行模板
- `.xhsspec/knowledge/`：经验沉淀、模式总结
- `.xhsspec/trends/`：趋势观察占位目录

## 当前用途

目前这些资产主要被桌面端用于：

- 生成 `Creation Brief`
- 组织 `Manuscripts` 前置上下文
- 构造 RedClaw 的创作上下文包
- 给后续内容运营自动化提供基础提示词和结构模板

## 维护原则

- 优先保留通用、可长期复用的内容资产
- 避免再引入额外一层模板仓库目录
- 文件名尽量稳定，方便桌面端内置引用和后续自动化调用
- 变更这部分内容时，同时检查桌面端是否仍能正确读取对应文件
