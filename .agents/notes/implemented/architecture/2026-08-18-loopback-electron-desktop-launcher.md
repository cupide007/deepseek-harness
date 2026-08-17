# Agent Note: Electron desktop launcher uses the loopback Web carrier

Status: implemented

English | [中文](2026-08-18-loopback-electron-desktop-launcher.zh.md)

## Problem

The repository ships a complete Web composition with runtime plugin injection, HTTP unary RPC, and two WebSocket event streams, but it has no installable desktop entry. A desktop package that only archives `apps/web/dist` cannot boot the host graph or produce the injected client manifest. A new Electron IPC carrier would also require a stream-capable transport, a desktop composition entry, and a separate security and integration test path.

## Decision

`apps/desktop` is an Electron launcher around the existing `dsh web` composition. The main process starts the packaged CLI with `--port 0`; the Web profile remains bound to `127.0.0.1`, and the launcher loads the exact readiness URL in a BrowserWindow with context isolation, sandboxing, and Node integration disabled. Navigation remains on that ephemeral origin; ordinary HTTP(S) links open in the system browser, and other schemes are ignored.

The release workflow builds Windows x64, Linux x64, macOS x64, and macOS arm64 on native runners. Each job rebuilds the workspace and native dependencies before uploading unsigned installers and SHA-256 manifests. A publish job gives `GITHUB_TOKEN` write access only after all platform jobs succeed.

The existing [GUI layering and RPC protocol](2026-07-19-gui-layering-and-rpc-protocol.md) remains unchanged. The desktop shell can later add an IPC subclass of `AbstractApiClient`; that work is a transport decision with its own lifecycle and evidence, not an installer configuration change.

## Alternatives considered

**File-origin renderer with IPC now.** Rejected for the first launcher because the required IPC request/response and two-stream carrier does not exist, and implementing it would duplicate the already-running Web composition's dynamic manifest and host lifecycle before an installable product exists.

**Package only the static Web dist.** Rejected because `window.__DSH_BOOT__` is injected by the running host graph and the static shell is explicitly not a standalone application.

**Start a network-facing server.** Rejected because the desktop process needs no remote authority; binding to `127.0.0.1` preserves the existing host trust posture and limits the browser origin to the local application.

## Consequences

The first desktop installer reuses the production Web profile and its tested HTTP/WebSocket path, so dynamic client bundles, native host actions, and user configuration keep one implementation. It carries a short-lived local port and an additional child process, and the unsigned artifacts require platform signing and notarization before public distribution. IPC remains a deliberate future transport rather than an implicit promise of the packaging layer.
