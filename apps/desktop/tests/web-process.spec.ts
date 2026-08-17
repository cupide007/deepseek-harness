import { describe, expect, it } from 'vitest'
import { isExternalHttpUrl, isLocalNavigation } from '../src/navigation.ts'
import { parseLocalWebUrl } from '../src/web-process.ts'

describe('desktop local Web host', () => {
  it('accepts only the dsh readiness line for an IPv4 loopback authority', () => {
    expect(parseLocalWebUrl('dsh web: http://127.0.0.1:49152')).toMatchObject({ hostname: '127.0.0.1', port: '49152' })
    expect(parseLocalWebUrl('dsh web: http://localhost:49152')).toBeUndefined()
    expect(parseLocalWebUrl('other output http://127.0.0.1:49152')).toBeUndefined()
  })

  it('keeps the Electron window on its own ephemeral loopback origin', () => {
    const local = new URL('http://127.0.0.1:49152')
    expect(isLocalNavigation('http://127.0.0.1:49152/session/next', local)).toBe(true)
    expect(isLocalNavigation('http://127.0.0.1:3080', local)).toBe(false)
    expect(isLocalNavigation('https://example.com', local)).toBe(false)
  })

  it('opens only HTTP(S) links outside the window', () => {
    expect(isExternalHttpUrl('https://example.com/help')).toBe(true)
    expect(isExternalHttpUrl('http://example.com/help')).toBe(true)
    expect(isExternalHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isExternalHttpUrl('javascript:alert(1)')).toBe(false)
  })
})
