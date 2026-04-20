# 桌面端发布检查清单

这份清单只针对 `apps/desktop/`。

目标不是“能演示”，而是“已经达到开源桌面端发布标准”。

## 发布阻塞项

如果以下任意一项仍未通过，就不要创建 `desktop-v*` 发布 tag：

- RedClaw 的 `Model / Endpoint / API Key` 配置不完整
- RedClaw 连接测试尚未通过
- 内置内容包无法正常加载
- 没有可进入创作流程的主题卡片
- `package.json`、`Cargo.toml`、`tauri.conf.json` 三处桌面端版本号还没对齐
- GitHub Actions `desktop-validate` 仍然失败

## 推荐顺序

1. 在桌面端完成 AI 设置。
2. 运行连接测试。
3. 至少准备一张可用的主题卡片。
4. 跑通一轮完整的 `Creation brief -> Manuscripts -> RedClaw` 创作流程。
5. 确认输出已经成功归档。
6. 统一三个桌面端版本元数据文件中的版本号。
7. 可选执行一次 `pnpm release:check`。
8. 创建一份工作区快照；如果需要完整回滚点，再额外复制 workspace 和 export 文件夹。
9. 将代码推送到 GitHub。
10. 等待 `desktop-validate` 通过。
11. 创建并推送与版本一致的 `desktop-v*` tag。
12. 等待 `desktop-bundle` 发布安装包。
13. 确认 GitHub Release 中包含 `SHA256SUMS.txt` 和 `bundle-manifest.json`。

## 发布约束

- 不在本地为发布工作安装桌面端依赖
- 不在本地执行 `pnpm build`
- 不在本地执行 `pnpm tauri build`
- 不在本地生成安装包
- 统一通过 GitHub Actions 完成发布产物输出

## 人工验收

正式发布前，至少手动确认一轮以下流程：

- 设置可以保存
- RedClaw 连接测试可用
- 主题卡片可以创建
- Creation brief 可以生成
- Manuscript 可以写入
- RedClaw 生成可以触发
- Recent outputs 和 archive 能看到结果
- Manuscript 路径与导出目录可以直接打开
- GitHub Release 中确实包含安装包和校验文件
