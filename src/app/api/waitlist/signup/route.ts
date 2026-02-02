/**
 * Waitlist Signup API
 *
 * POST /api/waitlist/signup
 *
 * Public endpoint (no auth required) that:
 * 1. Validates and stores the email in waitlist_signups table
 * 2. Sends a welcome email via Resend
 * 3. Creates a Resend contact for future launch broadcasts
 *
 * Security:
 * - Rate limited (5 requests per IP per hour)
 * - Returns success for duplicate emails (prevents email enumeration)
 * - Email sending is best-effort (failures don't fail the request)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServerSupabaseClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/middleware/rateLimit'
import WelcomeEmail from '@/components/emails/WelcomeEmail'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 signups per IP per hour
    const rateLimitResponse = await checkRateLimit(request, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const { email } = body

    // Validate email presence and type
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Validate email length
    if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Insert into database
    const supabase = getServerSupabaseClient()
    const { error } = await supabase
      .from('waitlist_signups')
      .insert({ email: normalizedEmail })

    if (error) {
      // Handle duplicate email (unique constraint violation)
      if (error.code === '23505') {
        // Return success to prevent email enumeration
        // Don't send another email for duplicates
        return NextResponse.json({ success: true })
      }

      console.error('Waitlist signup DB error:', error)
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      )
    }

    // Email and contact creation are best-effort — don't fail the request on errors
    if (resend) {
      // Send welcome email
      try {
        const { error: emailError } = await resend.emails.send({
          from: 'Slab Advisor <noreply@updates.slabadvisor.com>',
          to: normalizedEmail,
          subject: "You're on the list (and you're early)",
          react: WelcomeEmail({ email: normalizedEmail }),
        })
        if (emailError) {
          console.error('Resend email error:', emailError)
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
      }

      // Create Resend contact for future broadcast
      try {
        const { error: contactError } = await resend.contacts.create({
          email: normalizedEmail,
        })
        if (contactError) {
          console.error('Resend contact error:', contactError)
        }
      } catch (contactError) {
        console.error('Failed to create Resend contact:', contactError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
