/** URL policy for the Electron-rendered local Web application. */

/** True only for a URL served by this process's ephemeral loopback host. */
export function isLocalNavigation(url: string, localUrl: URL): boolean {
  try {
    const candidate = new URL(url)
    return candidate.protocol === localUrl.protocol
      && candidate.hostname === localUrl.hostname
      && candidate.port === localUrl.port
  } catch {
    return false
  }
}

/** Whether the operating system may open the URL outside the contained window. */
export function isExternalHttpUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}
