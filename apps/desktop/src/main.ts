/** Electron desktop entry: launches one loopback dsh Web host and contains it in one window. */

import { app, BrowserWindow, dialog, shell } from 'electron'
import { createRequire } from 'node:module'
import { isExternalHttpUrl, isLocalNavigation } from './navigation.ts'
import { startWebProcess, type LocalWebProcess } from './web-process.ts'

/** Resolve dsh's packaged bin without depending on an asar-internal layout. */
function dshBin(): string {
  return createRequire(import.meta.url).resolve('@deepseek-ai/dsh/lib/bin.js')
}

/** Open only ordinary web URLs outside the application's contained window. */
function openExternal(url: string): void {
  if (isExternalHttpUrl(url)) void shell.openExternal(url)
}

/** Keep the user-visible child beneath the packaged app's process tree. */
let web: LocalWebProcess | undefined
let stopping = false

async function createWindow(): Promise<void> {
  web = await startWebProcess({
    executable: process.execPath,
    dshBin: dshBin(),
    environment: process.env,
  })
  const localUrl = web.url
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    if (isLocalNavigation(url, localUrl)) return
    event.preventDefault()
    openExternal(url)
  })
  await window.loadURL(localUrl.toString())
}

async function stopWeb(): Promise<void> {
  const current = web
  web = undefined
  await current?.stop()
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows()[0]
    if (window === undefined) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })
  app.whenReady()
    .then(createWindow)
    .catch(async (error: unknown) => {
      await dialog.showMessageBox({ type: 'error', message: 'DeepSeek Harness failed to start.', detail: String(error) })
      await stopWeb()
      app.quit()
    })
  app.on('window-all-closed', () => { app.quit() })
  app.on('before-quit', (event) => {
    if (web === undefined || stopping) return
    event.preventDefault()
    stopping = true
    void stopWeb().finally(() => {
      stopping = false
      app.quit()
    })
  })
}
