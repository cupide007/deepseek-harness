# @deepseek-ai/dsh-desktop

English | [中文](README.zh.md)

The desktop application starts the packaged `dsh web` profile on an OS-assigned `127.0.0.1` port and loads that exact origin in an Electron window. It reuses the assembled Web profile, including its dynamic client-plugin bundles and loopback-only host operations; the renderer has neither Node integration nor an exposed preload API.

The window permits in-origin navigation only. HTTP and HTTPS links requested through a new window or navigation open in the operating system's default browser; every other scheme and malformed URL is ignored.

`pnpm --filter @deepseek-ai/dsh-desktop run package -- --win --x64` produces an NSIS installer. Replace `--win --x64` with `--mac --x64`, `--mac --arm64`, or `--linux --x64` for the other release targets. The GitHub Actions release workflow is the supported way to produce distributable installers because each target rebuilds native dependencies on its own operating system.

## Known Limitations and Deferred Work

- The first desktop release uses the existing loopback HTTP/WebSocket transport. A file-origin renderer with an IPC carrier remains a separate transport implementation, not a packaging-only replacement.
