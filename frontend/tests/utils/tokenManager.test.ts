import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getToken,
  setToken,
  clearTokens,
  isTokenExpired,
  decodeToken
} from '@/utils/tokenManager'

describe('Token Manager Utility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('setToken & getToken', () => {
    it('should store and retrieve token from localStorage', () => {
      const testToken = 'test-jwt-token-12345'
      setToken(testToken)

      expect(getToken()).toBe(testToken)
    })

    it('should return null when no token is stored', () => {
      expect(getToken()).toBeNull()
    })

    it('should overwrite existing token', () => {
      setToken('first-token')
      expect(getToken()).toBe('first-token')

      setToken('second-token')
      expect(getToken()).toBe('second-token')
    })
  })

  describe('clearTokens', () => {
    it('should remove token from localStorage', () => {
      setToken('test-token')
      expect(getToken()).toBe('test-token')

      clearTokens()
      expect(getToken()).toBeNull()
    })

    it('should not throw error when clearing empty localStorage', () => {
      expect(() => clearTokens()).not.toThrow()
    })
  })

  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      // Create a valid JWT token structure
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ 
        sub: '1234567890',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      }))
      const signature = 'test-signature'
      const token = `${header}.${payload}.${signature}`

      const decoded = decodeToken(token)
      expect(decoded).toBeTruthy()
      expect(decoded.sub).toBe('1234567890')
      expect(decoded.email).toBe('test@example.com')
    })

    it('should handle malformed tokens', () => {
      const malformedToken = 'not.a.valid.jwt'
      const decoded = decodeToken(malformedToken)

      expect(decoded).toBeNull()
    })

    it('should handle tokens without payload', () => {
      const invalidToken = 'header..signature'
      const decoded = decodeToken(invalidToken)

      expect(decoded).toBeNull()
    })

    it('should handle invalid base64 encoding', () => {
      const invalidToken = 'header.!!!invalid.signature'
      const decoded = decodeToken(invalidToken)

      expect(decoded).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      // Token expires in 1 hour
      const futureExp = Math.floor(Date.now() / 1000) + 3600
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: futureExp }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for expired token', () => {
      // Token expired 1 hour ago
      const pastExp = Math.floor(Date.now() / 1000) - 3600
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: pastExp }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return true for malformed token', () => {
      expect(isTokenExpired('malformed-token')).toBe(true)
    })

    it('should return true for token without exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ sub: '123' }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })

    it('should handle edge case of token expiring very soon', () => {
      // Token expires in 1 second
      const soonExp = Math.floor(Date.now() / 1000) + 1
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: soonExp }))
      const token = `${header}.${payload}.signature`

      // Should still be valid if not yet expired
      expect(isTokenExpired(token)).toBe(false)
    })
  })

  describe('Token Flow Integration', () => {
    it('should handle complete user authentication lifecycle', () => {
      // 1. User logs in, token is stored
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ 
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      }))
      const token = `${header}.${payload}.signature`
      
      setToken(token)
      expect(getToken()).toBe(token)

      // 2. Check if token is still valid
      expect(isTokenExpired(token)).toBe(false)

      // 3. Decode and verify token content
      const decoded = decodeToken(token)
      expect(decoded?.email).toBe('user@example.com')

      // 4. User logs out, clear tokens
      clearTokens()
      expect(getToken()).toBeNull()
    })

    it('should handle expired token detection', () => {
      const expiredToken = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
        btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })) + '.sig'

      setToken(expiredToken)
      
      expect(getToken()).toBe(expiredToken)
      expect(isTokenExpired(expiredToken)).toBe(true)

      clearTokens()
      expect(getToken()).toBeNull()
    })
  })
})
