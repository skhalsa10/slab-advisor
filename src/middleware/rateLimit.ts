/**
 * Rate Limiting Middleware
 *
 * Security: Prevents abuse, DoS attacks, and resource exhaustion
 * In-memory implementation (use Redis in production for distributed systems)
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore: RateLimitStore = {}

// Cleanup interval: Remove expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Max requests per window
}

/**
 * Rate limiting middleware
 *
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse if rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  // Get client identifier (IP address or user ID if authenticated)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  const now = Date.now()
  const key = `${request.nextUrl.pathname}:${ip}`

  // Clean up expired entry for this specific key
  if (rateLimitStore[key] && rateLimitStore[key].resetTime < now) {
    delete rateLimitStore[key]
  }

  // Initialize or increment counter
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + config.windowMs
    }
    return null
  }

  rateLimitStore[key].count++

  if (rateLimitStore[key].count > config.maxRequests) {
    const retryAfter = Math.ceil((rateLimitStore[key].resetTime - now) / 1000)

    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitStore[key].resetTime.toString()
        }
      }
    )
  }

  return null
}

/**
 * Get remaining requests for a client (useful for debugging)
 */
export function getRateLimitInfo(request: NextRequest, config: RateLimitConfig): {
  remaining: number
  resetTime: number
} {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const key = `${request.nextUrl.pathname}:${ip}`

  const entry = rateLimitStore[key]
  if (!entry) {
    return {
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs
    }
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime
  }
}
