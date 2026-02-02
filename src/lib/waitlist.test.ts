import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isWaitlistMode, BYPASS_COOKIE_NAME, BYPASS_COOKIE_MAX_AGE } from './waitlist'

describe('waitlist utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('isWaitlistMode', () => {
    it('should return true when NEXT_PUBLIC_LAUNCH_MODE is "waitlist"', () => {
      process.env.NEXT_PUBLIC_LAUNCH_MODE = 'waitlist'
      expect(isWaitlistMode()).toBe(true)
    })

    it('should return false when NEXT_PUBLIC_LAUNCH_MODE is "open"', () => {
      process.env.NEXT_PUBLIC_LAUNCH_MODE = 'open'
      expect(isWaitlistMode()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_LAUNCH_MODE is undefined', () => {
      delete process.env.NEXT_PUBLIC_LAUNCH_MODE
      expect(isWaitlistMode()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_LAUNCH_MODE is empty string', () => {
      process.env.NEXT_PUBLIC_LAUNCH_MODE = ''
      expect(isWaitlistMode()).toBe(false)
    })
  })

  describe('constants', () => {
    it('should have correct cookie name', () => {
      expect(BYPASS_COOKIE_NAME).toBe('waitlist_bypass')
    })

    it('should have a 1-day max age', () => {
      expect(BYPASS_COOKIE_MAX_AGE).toBe(60 * 60 * 24)
    })
  })
})
