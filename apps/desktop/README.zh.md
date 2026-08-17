# @deepseek-ai/dsh-desktop

[English](README.md) | 中文

桌面应用会在操作系统分配的 `127.0.0.1` 端口启动已打包的 `dsh web` profile，并在 Electron 窗口中加载该确切 origin。它复用完整组装好的 Web profile，包括动态 client-plugin bundle 与仅限 loopback 的宿主操作；renderer 不启用 Node integration，也不暴露 preload API。

窗口只允许同 origin 导航。新窗口或导航请求的 HTTP 和 HTTPS 链接会在操作系统默认浏览器中打开；其他 scheme 和格式错误的 URL 均会被忽略。

`pnpm --filter @deepseek-ai/dsh-desktop run package -- --win --x64` 会生成 NSIS 安装程序。其他发布目标分别使用 `--mac --x64`、`--mac --arm64` 或 `--linux --x64`。GitHub Actions 发布工作流是生成可分发安装程序的支持方式，因为每个目标都会在对应操作系统上重建原生依赖。

## Known Limitations and Deferred Work

- 首个桌面版本使用既有的 loopback HTTP/WebSocket 传输。使用 file origin renderer 与 IPC carrier 是另一项传输实现，而不是只替换打包方式。
