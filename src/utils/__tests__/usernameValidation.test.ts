import { describe, it, expect } from 'vitest'
import {
  validateUsernameFormat,
  suggestUsernameFromEmail,
} from '../usernameValidation'

describe('validateUsernameFormat', () => {
  it('should accept valid usernames', () => {
    expect(validateUsernameFormat('john_smith').valid).toBe(true)
    expect(validateUsernameFormat('user123').valid).toBe(true)
    expect(validateUsernameFormat('abc').valid).toBe(true)
    expect(validateUsernameFormat('test_user_123').valid).toBe(true)
  })

  it('should reject too short usernames', () => {
    const result = validateUsernameFormat('ab')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('at least 3')
  })

  it('should reject too long usernames', () => {
    const result = validateUsernameFormat('a'.repeat(31))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('no more than 30')
  })

  it('should reject invalid characters', () => {
    expect(validateUsernameFormat('user-name').valid).toBe(false)
    expect(validateUsernameFormat('user.name').valid).toBe(false)
    expect(validateUsernameFormat('user name').valid).toBe(false)
    expect(validateUsernameFormat('user@name').valid).toBe(false)
  })

  it('should reject usernames starting with underscore', () => {
    expect(validateUsernameFormat('_username').valid).toBe(false)
  })

  it('should reject usernames ending with underscore', () => {
    expect(validateUsernameFormat('username_').valid).toBe(false)
  })

  it('should reject reserved usernames (case-insensitive)', () => {
    expect(validateUsernameFormat('admin').valid).toBe(false)
    expect(validateUsernameFormat('Admin').valid).toBe(false)
    expect(validateUsernameFormat('ADMIN').valid).toBe(false)
    expect(validateUsernameFormat('root').valid).toBe(false)
    expect(validateUsernameFormat('support').valid).toBe(false)
  })

  it('should reject empty username', () => {
    expect(validateUsernameFormat('').valid).toBe(false)
  })

  it('should trim whitespace before validation', () => {
    expect(validateUsernameFormat('  john  ').valid).toBe(true)
  })
})

describe('suggestUsernameFromEmail', () => {
  it('should extract basic username from email', () => {
    expect(suggestUsernameFromEmail('john@example.com')).toBe('john')
    expect(suggestUsernameFromEmail('jane123@example.com')).toBe('jane123')
  })

  it('should convert dots to underscores', () => {
    expect(suggestUsernameFromEmail('john.doe@example.com')).toBe('john_doe')
  })

  it('should remove email tags', () => {
    expect(suggestUsernameFromEmail('user+tag@example.com')).toBe('user')
  })

  it('should handle special characters', () => {
    expect(suggestUsernameFromEmail('user-name@example.com')).toBe('user_name')
    expect(suggestUsernameFromEmail('user.doe-smith@example.com')).toBe(
      'user_doe_smith'
    )
  })

  it('should ensure minimum length', () => {
    const result = suggestUsernameFromEmail('ab@example.com')
    expect(result.length).toBeGreaterThanOrEqual(3)
  })

  it('should ensure maximum length', () => {
    const longEmail = 'a'.repeat(50) + '@example.com'
    const result = suggestUsernameFromEmail(longEmail)
    expect(result.length).toBeLessThanOrEqual(30)
  })

  it('should not start or end with underscore', () => {
    const result = suggestUsernameFromEmail('_user_@example.com')
    expect(result.startsWith('_')).toBe(false)
    expect(result.endsWith('_')).toBe(false)
  })

  it('should be lowercase', () => {
    expect(suggestUsernameFromEmail('JohnDoe@example.com')).toBe('johndoe')
  })
})
