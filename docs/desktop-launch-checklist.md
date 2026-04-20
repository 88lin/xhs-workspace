# 桌面端发布检查清单

这份清单只针对 `apps/desktop/`。

它的目标不是回答“能不能演示”，而是回答：

- 这个桌面端版本现在是否已经具备正式发布条件

## 一票否决项

如果以下任意一项仍未通过，就不要创建 `desktop-v*` 发布 tag：

- 桌面端 3 个版本文件的版本号不一致
- GitHub Actions `desktop-validate` 仍然失败
- 前端类型检查或前端构建失败
- Tauri host 编译失败
- 无 bundle 的桌面端构建检查失败

## 基础配置检查

1. 已在桌面端 `Settings` 中填写 AI Provider、Model、Endpoint、API Key。
2. 真实连接测试已经通过。
3. 导出目录设置已经确认。
4. 如需使用浏览器桥接，桥接目录已经初始化或可访问。

## 工作流检查

5. `Capture` 可以导入桥接包、手动录入内容或本地文件。
6. `Library` 可以创建、编辑和保存主题卡片。
7. `Creation Brief` 可以从主题卡片正常生成。
8. `Manuscripts` 可以创建、保存、重新打开稿件。
9. RedClaw 可以正常发起生成、继续生成和重写。
10. `Archive` 可以查看、继续、恢复或删除历史输出。
11. 自动化任务页面没有明显结构性错误或阻塞项。

## 版本与仓库检查

12. 以下 3 个文件中的版本号已经一致：
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/Cargo.toml`
   - `apps/desktop/src-tauri/tauri.conf.json`
13. 如有需要，已在 `apps/desktop/` 中执行 `pnpm release:check`。
14. 本次发布涉及的说明文档已经同步更新。
15. `packages/content-ops` 中被桌面端引用的内容资产路径未被破坏。

## GitHub Actions 检查

16. 推送代码后，等待 `desktop-validate` 通过。
17. 确认 Linux / macOS / Windows 三个平台的 host-check 都通过。
18. 确认桌面端校验链没有新的阻塞错误。
19. 如果只剩 Rust formatting advisory 警告，可以继续发布；如果是功能性错误，则必须先修复。

## 发布动作

20. 创建与版本号一致的 `desktop-v*` tag。
21. 推送该 tag。
22. 等待 `desktop-bundle` 完成。
23. 到 GitHub Releases 检查安装包是否已上传。
24. 检查 `bundle-manifest.json` 和 `SHA256SUMS.txt` 是否存在。

## 发布后建议检查

25. 至少下载一个平台的安装包做快速验证。
26. 检查 Release 标题、版本号和说明是否正确。
27. 检查 Issues / PR 模板中的桌面端说明链接是否仍然可用。

## 不建议的做法

- 不要把本地打包结果当成正式安装包
- 不要跳过 `desktop-validate`
- 不要用和版本号不一致的 `desktop-v*` tag
- 不要在说明文档还明显过期时直接发版

## 一句话判断

只有当“配置能用、基础工作流能走通、GitHub Actions 校验通过、版本号对齐、文档同步完成”这 5 件事同时成立时，才算真正具备桌面端正式发布条件。
