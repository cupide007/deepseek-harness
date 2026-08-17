/** Local web-host process management for the Electron main process. */

import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from 'node:child_process'
import { once } from 'node:events'

/** The one URL line emitted by the `dsh web` startup plugin. */
const WEB_URL_LINE = /^dsh web: (http:\/\/127\.0\.0\.1:\d+)(?:\s|$)/

/** A started local Web host and its URL. */
export interface LocalWebProcess {
  /** Loopback authority loaded into the Electron window. */
  readonly url: URL
  /** Stop the child process and await its exit. */
  stop(): Promise<void>
}

/** Dependency injection for deterministic launcher tests. */
export interface WebProcessDependencies {
  /** Launch the Electron binary in Node-compatible mode. */
  spawn(command: string, args: readonly string[], options: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams
}

/** Runtime values used to start the bundled dsh Web profile. */
export interface StartWebProcessOptions {
  /** Electron executable path; `ELECTRON_RUN_AS_NODE` makes it execute the CLI entry. */
  executable: string
  /** Absolute path to `@deepseek-ai/dsh`'s built bin. */
  dshBin: string
  /** Environment inherited by the Web host. */
  environment: NodeJS.ProcessEnv
}

/** Parse one stdout line and accept only the local authority the launcher requested. */
export function parseLocalWebUrl(line: string): URL | undefined {
  const match = WEB_URL_LINE.exec(line)
  const raw = match?.[1]
  return raw === undefined ? undefined : new URL(raw)
}

/** Start dsh Web on an OS-chosen loopback port and resolve once its URL is printed. */
export async function startWebProcess(
  options: StartWebProcessOptions,
  dependencies: WebProcessDependencies = { spawn },
): Promise<LocalWebProcess> {
  const child = dependencies.spawn(options.executable, [options.dshBin, 'web', '--port', '0'], {
    env: { ...options.environment, ELECTRON_RUN_AS_NODE: '1' },
    windowsHide: true,
  })
  let stderr = ''
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk: string) => { stderr += chunk })
  child.stdout.setEncoding('utf8')

  const url = await new Promise<URL>((resolve, reject) => {
    let stdout = ''
    const onStdout = (chunk: string): void => {
      stdout += chunk
      const lines = stdout.split(/\r?\n/)
      stdout = lines.pop() ?? ''
      for (const line of lines) {
        const parsed = parseLocalWebUrl(line)
        if (parsed === undefined) continue
        cleanup()
        resolve(parsed)
        return
      }
    }
    const onExit = (code: number | null, signal: NodeJS.Signals | null): void => {
      cleanup()
      reject(new Error(`dsh web exited before it became ready (code ${String(code)}, signal ${String(signal)}): ${stderr.trim()}`))
    }
    const onError = (error: Error): void => {
      cleanup()
      reject(error)
    }
    const cleanup = (): void => {
      child.stdout.removeListener('data', onStdout)
      child.removeListener('exit', onExit)
      child.removeListener('error', onError)
    }
    child.stdout.on('data', onStdout)
    child.once('exit', onExit)
    child.once('error', onError)
  })

  return {
    url,
    async stop(): Promise<void> {
      if (child.exitCode !== null || child.signalCode !== null) return
      child.kill()
      await once(child, 'exit')
    },
  }
}
