# Agent Note: Electron desktop launcher uses the loopback Web carrier

Status: implemented

English | [中文](2026-08-18-loopback-electron-desktop-launcher.md)

## Problem

仓库交付了完整的 Web 组合，包括运行期插件注入、HTTP unary RPC 与两条 WebSocket 事件流，但没有可安装的桌面入口。只归档 `apps/web/dist` 的桌面包无法启动 Host 图，也无法生成注入的 client manifest。新的 Electron IPC carrier 还需要支持流的传输、桌面组合入口以及独立的安全与集成测试路径。

## Decision

`apps/desktop` 是围绕现有 `dsh web` 组合的 Electron launcher。主进程以 `--port 0` 启动打包后的 CLI；Web profile 仍绑定到 `127.0.0.1`，launcher 在启用 context isolation、sandbox 且关闭 Node integration 的 BrowserWindow 中加载确切的就绪 URL。导航保持在该临时 origin 内；普通 HTTP(S) 链接交给系统浏览器，其他 scheme 会被忽略。

发布工作流在原生 runner 上构建 Windows x64、Linux x64、macOS x64 与 macOS arm64。每个 job 会重建 workspace 与原生依赖，然后上传未签名安装包和 SHA-256 清单。只有所有平台 job 成功后，发布 job 才获得 `GITHUB_TOKEN` 的写权限。

现有的 [GUI 分层与 RPC 协议](2026-07-19-gui-layering-and-rpc-protocol.md) 保持不变。桌面 shell 将来可以为 `AbstractApiClient` 添加 IPC 子类；那是拥有独立生命周期与证据的传输决策，不是安装包配置变更。

## Alternatives considered

**立即使用 file-origin renderer 与 IPC。** 首个 launcher 不采用，因为所需的 IPC 请求／响应与两条流 carrier 尚不存在；在还没有可安装产品前实现它会重复已经运行的 Web 组合的动态 manifest 与 Host 生命周期。

**只打包静态 Web dist。** 不采用，因为 `window.__DSH_BOOT__` 由运行中的 Host 图注入，而静态 shell 明确不是独立应用。

**启动面向网络的服务器。** 不采用，因为桌面进程不需要远程 authority；绑定到 `127.0.0.1` 保留现有 Host trust 姿态，并把浏览器 origin 限定在本地应用内。

## Consequences

首个桌面安装包复用生产 Web profile 及其已测试的 HTTP/WebSocket 路径，因此动态 client bundle、原生 Host 操作与用户配置继续共用一套实现。代价是携带短生命周期本地端口和额外子进程，且未签名产物在公开分发前仍需要平台签名与 notarization。IPC 仍是明确的后续传输，而不是打包层隐含的承诺。
