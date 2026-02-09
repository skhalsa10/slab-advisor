# Observability Stack Implementation Plan

## ✅ Implementation Complete

| Component | Status | Features |
|-----------|--------|----------|
| **PostHog** | ✅ Complete | Custom events, user identification, session recordings, GDPR consent |
| **Sentry - Errors** | ✅ Complete | Exception catching in all 17 API routes + ErrorBoundary |
| **Sentry - Performance** | ✅ Complete | Spans for Ximilar API, Resend, DB queries |
| **Sentry - Logs** | ✅ Complete | console.warn/error captured via consoleLoggingIntegration |
| **Sentry - Metrics** | ✅ Complete | Business metrics (cards_graded, credits_consumed, latencies) |
| **Vercel Speed Insights** | ✅ Complete | Web Vitals (pre-existing) |

---

## Overview

This document outlines the implementation of a comprehensive observability stack for Slab Advisor.

### Stack Components

| Tool | Purpose | Consent Required |
|------|---------|------------------|
| **Vercel Speed Insights** | Web Vitals (LCP, CLS, INP) | ❌ No (already installed) |
| **PostHog** | Product analytics, session recordings, feature flags | ✅ Yes |
| **Sentry** | Error tracking, performance monitoring, alerting | ❌ No (legitimate interest) |

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  OBSERVABILITY STACK                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   NO CONSENT NEEDED:                                    │
│   ├── Vercel Speed Insights (Web Vitals only)          │
│   └── Sentry (error tracking - legitimate interest)    │
│                                                         │
│   CONSENT REQUIRED:                                     │
│   └── PostHog                                           │
│       ├── If accepted: Full features                   │
│       │   • Session recordings                         │
│       │   • User identification                        │
│       │   • Detailed events                            │
│       │   • Feature flags                              │
│       │                                                │
│       └── If declined: Minimal mode                    │
│           • Anonymous page views only                  │
│           • No cookies                                 │
│           • No recordings                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: PostHog Implementation

### 1.1 Account Setup

- [ ] Create PostHog account at https://posthog.com
- [ ] Create project named "Slab Advisor"
- [ ] Select US Cloud (or EU Cloud for data residency)
- [ ] Copy Project API Key
- [ ] Note the PostHog host URL

### 1.2 Package Installation

```bash
npm install posthog-js
```

### 1.3 Environment Variables

Add to `.env.local` (gamma):
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Add same variables to Vercel dashboard for production.

### 1.4 Files to Create

#### `src/lib/posthog/client.ts`
PostHog client initialization with consent-aware loading.

```typescript
// PostHog client configuration
// - Initializes PostHog with project key
// - Handles consent state
// - Configures privacy settings (mask inputs, etc.)
// - Provides utility functions for consent management
```

#### `src/lib/posthog/events.ts`
Typed event definitions and tracking helpers.

```typescript
// Event tracking utilities
// - Type-safe event names
// - Event property interfaces
// - Helper functions for common events:
//   - trackCardAdded()
//   - trackCardAnalyzed()
//   - trackCardGraded()
//   - trackCreditsPurchased()
//   - trackSearch()
//   - trackError()
```

#### `src/lib/posthog/server.ts`
Server-side PostHog client for API routes (optional, for server-side events).

```typescript
// Server-side PostHog client
// - For tracking events from API routes
// - Uses posthog-node package
```

#### `src/components/providers/PostHogProvider.tsx`
React context provider with consent handling.

```typescript
// PostHog Provider
// - Wraps app with PostHog context
// - Manages consent state (localStorage)
// - Only initializes PostHog after consent
// - Provides usePostHog hook
// - Handles page view tracking
```

#### `src/components/consent/CookieConsent.tsx`
GDPR-compliant consent banner.

```typescript
// Cookie Consent Banner
// - Shows on first visit (if no consent decision stored)
// - Accept / Decline buttons
// - Links to privacy policy
// - Stores decision in localStorage
// - Triggers PostHog initialization on accept
// - Non-intrusive design (bottom banner)
```

#### `src/hooks/usePostHog.ts`
Custom hook for easy event tracking throughout the app.

```typescript
// usePostHog hook
// - Returns tracking functions
// - Returns consent state
// - Handles cases where PostHog isn't loaded
// - Type-safe event tracking
```

### 1.5 Files to Modify

#### `src/app/layout.tsx`
Add PostHogProvider to the provider tree.

```diff
+ import { PostHogProvider } from '@/components/providers/PostHogProvider'

  return (
    <html lang="en">
      <body>
+       <PostHogProvider>
          <ConditionalQuickAddProvider>
            {children}
          </ConditionalQuickAddProvider>
+       </PostHogProvider>
        <SpeedInsights />
      </body>
    </html>
  )
```

#### `src/components/providers/AuthProvider.tsx`
Identify user in PostHog when auth state changes.

```diff
+ import { usePostHog } from '@/hooks/usePostHog'

  // Inside auth state listener:
+ if (user) {
+   posthog.identify(user.id, {
+     email: user.email,
+     created_at: user.created_at
+   })
+ } else {
+   posthog.reset()
+ }
```

#### `src/components/error/ErrorBoundary.tsx`
Report errors to PostHog.

```diff
+ import { trackError } from '@/lib/posthog/events'

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
+   trackError(error, errorInfo)
    // existing logging
  }
```

### 1.6 Events to Track

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `user_signed_up` | After successful signup | `method: 'email' \| 'google' \| 'apple'` |
| `user_signed_in` | After successful login | `method: 'email' \| 'google' \| 'apple'` |
| `user_signed_out` | After logout | - |
| `card_added` | Card added to collection | `source: 'manual' \| 'ai'`, `category`, `card_id` |
| `card_removed` | Card removed from collection | `card_id` |
| `card_analyzed` | AI identification complete | `success`, `confidence`, `credits_used`, `duration_ms` |
| `card_graded` | AI grading complete | `grade`, `credits_used`, `duration_ms` |
| `credits_purchased` | Credit purchase complete | `amount`, `package`, `price` |
| `collection_viewed` | Collection page loaded | `view_mode: 'list' \| 'grid'`, `card_count` |
| `card_details_viewed` | Card detail page loaded | `card_id`, `category` |
| `search_performed` | Search executed | `query`, `filters`, `results_count` |
| `error_occurred` | Error caught by boundary | `error_type`, `message`, `page` |

### 1.7 Session Recording Configuration

Configure in PostHog dashboard:
- Enable session recordings
- Set sampling rate (start with 100%, reduce if needed)
- Enable console log capture
- Enable network request capture
- Configure privacy:
  - Mask all text inputs by default
  - Mask elements with `data-ph-no-capture` attribute
  - Block recording on sensitive pages if needed

### 1.8 Privacy Masking

Add `data-ph-no-capture` attribute to sensitive elements:
- Password fields
- Credit card inputs
- Personal information forms

### 1.9 Testing Checklist

- [ ] PostHog loads only after consent accepted
- [ ] PostHog does NOT load if consent declined
- [ ] Consent banner appears on first visit
- [ ] Consent decision persists across sessions
- [ ] User identification works after login
- [ ] User reset works after logout
- [ ] Core events fire correctly
- [ ] Session recordings capture (test in PostHog dashboard)
- [ ] Privacy masking works on inputs
- [ ] Page views tracked automatically

### 1.10 Event Tracking Implementation - COMPLETE

Event tracking has been added throughout the app. Here's what's implemented:

#### Authentication Events
- [x] `src/components/auth/AuthForm.tsx` - `trackSignIn()` / `trackSignUp()` for email auth
- [x] `src/app/auth/callback/page.tsx` - `trackSignIn()` / `trackSignUp()` for OAuth (Google)
- [x] `src/components/layout/Sidebar.tsx` - `trackSignOut()` before logout
- [x] `src/components/layout/Header.tsx` - `trackSignOut()` before logout

#### Card Events
- [x] `src/components/collection/QuickAddForm.tsx` - `trackCardAdded({ source: 'manual', category: 'pokemon' })`
- [x] `src/components/collection/AddToCollectionForm.tsx` - `trackCardAdded({ source: 'manual', category: 'pokemon' })`
- [x] `src/hooks/useQuickAdd.ts` - `trackCardAdded()` for quick add flow
- [x] `src/components/collection/CollectionQuickViewContent.tsx` - `trackCardRemoved({ cardId })`
- [x] `src/components/dashboard/GradingAnalysisModal.tsx` - `trackCardGraded({ grade, creditsUsed, durationMs, cardId })`
- [x] `src/app/browse/pokemon/[setId]/[cardId]/CardDetailClient.tsx` - `trackCardDetailsViewed({ cardId, category })`

#### Collection Events
- [x] `src/app/(authenticated)/collection/CollectionClient.tsx` - `trackCollectionViewed({ viewMode, cardCount })`

#### Search Events
- [x] `src/hooks/useQuickAdd.ts` - `trackSearch({ query, resultsCount })`

#### Credit Events
- [x] `src/components/dashboard/GradingAnalysisModal.tsx` - `trackCreditsUsed({ amount: 1, action: 'grade' })`
- [ ] Credit purchase flow - `trackCreditsPurchased()` (payment flow not yet built)

#### Error Events
- [x] `src/components/error/ErrorBoundary.tsx` - `trackError({ errorType, message, componentStack })`

#### Not Yet Implemented (Features Don't Exist)
- [ ] `trackCardAnalyzed()` - AI identification client-side flow not yet built
- [ ] `trackCreditsPurchased()` - Payment/purchase flow not yet built

### 1.11 Testing & Verification Guide

#### Step 1: Start Development Server
```bash
npm run dev
```

#### Step 2: Open PostHog Dashboard
1. Go to https://us.posthog.com (or your PostHog host)
2. Navigate to **Activity** → **Live Events**
3. Enable "Live mode" toggle to see events in real-time

#### Step 3: Accept Cookie Consent
- On first visit, accept the cookie consent banner
- This enables full PostHog tracking

#### Step 4: Test Each Event

| Action | Expected Event | Properties to Verify |
|--------|---------------|---------------------|
| Sign up with email | `user_signed_up` | `method: 'email'` |
| Sign in with email | `user_signed_in` | `method: 'email'` |
| Sign in with Google | `user_signed_in` | `method: 'google'` |
| Sign out | `user_signed_out` | - |
| Search for a card | `search_performed` | `query`, `resultsCount` |
| View card details page | `card_details_viewed` | `cardId`, `category: 'pokemon'` |
| Add card to collection | `card_added` | `source: 'manual'`, `category`, `cardId` |
| View collection page | `collection_viewed` | `viewMode`, `cardCount` |
| Delete card from collection | `card_removed` | `cardId` |
| Complete AI grading | `card_graded` | `grade`, `creditsUsed`, `durationMs`, `cardId` |
| Complete AI grading | `credits_used` | `amount: 1`, `action: 'grade'` |
| Trigger error boundary | `error_occurred` | `errorType`, `message`, `componentStack` |

#### Step 5: Verify in PostHog Dashboard

**Live Events View:**
- Navigate to Activity → Live Events
- Filter by event name to find specific events
- Click on events to see full properties

**User Identification:**
- After login, check that events have `distinct_id` matching the user's ID
- User properties should include `email` and `created_at`

**Session Recording (if enabled):**
- Navigate to Recordings
- Watch a session to verify user actions are captured
- Verify sensitive inputs are masked

#### Debugging Tips
- Open browser DevTools → Console
- In development, PostHog debug mode shows all captured events
- Look for `[PostHog.js]` log messages
- Check Network tab for `posthog.com/e` requests

---

## Phase 2: Sentry Implementation

### 2.1 Account Setup

- [ ] Create Sentry account at https://sentry.io
- [ ] Create project (select Next.js)
- [ ] Copy DSN
- [ ] Create auth token for source maps

### 2.2 Package Installation

```bash
npx @sentry/wizard@latest -i nextjs
```

This wizard will:
- Install `@sentry/nextjs`
- Create config files
- Update `next.config.ts`
- Set up source map uploads

### 2.3 Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=slab-advisor
```

Add to `.env.sentry-build-plugin` (created by wizard):
```bash
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=slab-advisor
```

Add same variables to Vercel dashboard.

### 2.4 Files Created by Wizard

The Sentry wizard will create:

#### `sentry.client.config.ts`
```typescript
// Client-side Sentry initialization
// - DSN configuration
// - Sample rates
// - Environment detection
// - Release tracking
```

#### `sentry.server.config.ts`
```typescript
// Server-side Sentry initialization
// - Same config as client
// - Runs in Node.js environment
```

#### `sentry.edge.config.ts`
```typescript
// Edge runtime Sentry initialization
// - For middleware
// - Lightweight config
```

#### `src/instrumentation.ts`
```typescript
// Next.js instrumentation hook
// - Initializes Sentry on server startup
// - Required for App Router
```

### 2.5 Files to Create

#### `src/app/global-error.tsx`
Root-level error boundary for the entire app.

```typescript
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

#### `src/app/error.tsx`
App-level error page (if not exists).

```typescript
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

#### `src/lib/sentry/index.ts`
Sentry utility functions.

```typescript
// Sentry utilities
// - captureError() - wrapper with additional context
// - setUserContext() - set user info
// - clearUserContext() - clear on logout
// - withServerTiming() - wrap async functions with performance spans
```

### 2.6 Files to Modify

#### `next.config.ts`
The wizard will add Sentry webpack plugin. Verify it looks like:

```typescript
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  // existing config
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: '/monitoring', // Optional: bypass ad blockers
})
```

#### `src/components/error/ErrorBoundary.tsx`
Integrate Sentry capture.

```diff
+ import * as Sentry from '@sentry/nextjs'

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
+   Sentry.captureException(error, {
+     extra: {
+       componentStack: errorInfo.componentStack
+     }
+   })
    // existing logging
  }
```

#### `src/components/providers/AuthProvider.tsx`
Set Sentry user context.

```diff
+ import * as Sentry from '@sentry/nextjs'

  // Inside auth state listener:
  if (user) {
+   Sentry.setUser({
+     id: user.id,
+     email: user.email
+   })
  } else {
+   Sentry.setUser(null)
  }
```

#### API Routes
Wrap error handling with Sentry.

```diff
+ import * as Sentry from '@sentry/nextjs'

  export async function POST(request: Request) {
    try {
      // ... existing logic
    } catch (error) {
-     console.error('API error:', error)
+     Sentry.captureException(error)
+     console.error('API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
```

### 2.7 Performance Monitoring

Configure in `sentry.client.config.ts`:

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance
  tracesSampleRate: 1.0, // Capture 100% of transactions (reduce in production)

  // Session Replay (optional - overlaps with PostHog)
  replaysSessionSampleRate: 0, // Disable - using PostHog for recordings
  replaysOnErrorSampleRate: 0, // Disable - using PostHog for recordings

  // Environment
  environment: process.env.NODE_ENV,
})
```

### 2.8 Custom Performance Spans

For tracking external API calls:

```typescript
// In API routes or server components
import * as Sentry from '@sentry/nextjs'

async function identifyCard(imageUrl: string) {
  return await Sentry.startSpan(
    { name: 'ximilar.identify', op: 'http.client' },
    async () => {
      // Ximilar API call
      const result = await fetch(XIMILAR_API_URL, { ... })
      return result.json()
    }
  )
}
```

### 2.9 Alerting Configuration (In Sentry Dashboard)

Create these alert rules:

| Alert Name | Condition | Action |
|------------|-----------|--------|
| New Error | First occurrence of error | Email + Slack |
| Error Spike | >10 errors in 5 minutes | Email + Slack |
| High Error Rate | Error rate >5% | Email |
| Slow API | p95 latency >3s | Email |
| New Release Errors | Errors in release within 1 hour | Email + Slack |

### 2.10 Testing Checklist

- [ ] Sentry initializes on app load
- [ ] Intentional error is captured in Sentry
- [ ] Stack traces are readable (source maps working)
- [ ] User context is set after login
- [ ] User context is cleared after logout
- [ ] API route errors are captured
- [ ] Performance transactions appear in dashboard
- [ ] Custom spans appear for external APIs
- [ ] Alerts fire correctly (test with intentional error)

---

## Post-Implementation

### Dashboard Setup

#### PostHog
- [ ] Create dashboard with key metrics
- [ ] Set up funnel: Signup → First Card Added → First Grade
- [ ] Create cohort: Active users (event in last 7 days)
- [ ] Set up feature flag for A/B testing (optional)

#### Sentry
- [ ] Configure issue ownership rules
- [ ] Set up Slack integration
- [ ] Create saved searches for common error types
- [ ] Review and tune alert thresholds

### Documentation Updates

- [ ] Update CLAUDE.md with observability context
- [ ] Add environment variables to deployment docs
- [ ] Document event naming conventions

### Monitoring

After 1 week:
- [ ] Review PostHog consent rates
- [ ] Check Sentry error volume
- [ ] Tune sampling rates if needed
- [ ] Review session recording storage usage

---

## Environment Variables Summary

### Development (`.env.local`)

```bash
# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=slab-advisor
```

### Production (Vercel Dashboard)

Same variables as above, potentially with different PostHog project for production vs staging.

---

## Files Summary

### New Files (Phase 1 - PostHog)

| File | Purpose |
|------|---------|
| `src/lib/posthog/client.ts` | PostHog client initialization |
| `src/lib/posthog/events.ts` | Typed event tracking helpers |
| `src/lib/posthog/server.ts` | Server-side PostHog (optional) |
| `src/components/providers/PostHogProvider.tsx` | React provider with consent |
| `src/components/consent/CookieConsent.tsx` | GDPR consent banner |
| `src/hooks/usePostHog.ts` | Custom hook for tracking |

### New Files (Phase 2 - Sentry)

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Client-side Sentry config |
| `sentry.server.config.ts` | Server-side Sentry config |
| `sentry.edge.config.ts` | Edge runtime Sentry config |
| `src/instrumentation.ts` | Next.js instrumentation hook |
| `src/app/global-error.tsx` | Root error boundary |
| `src/app/error.tsx` | App-level error page |
| `src/lib/sentry/index.ts` | Sentry utilities |

### Modified Files

| File | Changes |
|------|---------|
| `package.json` | Add posthog-js, @sentry/nextjs |
| `src/app/layout.tsx` | Add PostHogProvider |
| `src/components/providers/AuthProvider.tsx` | User identification |
| `src/components/error/ErrorBoundary.tsx` | Error reporting |
| `next.config.ts` | Sentry webpack plugin |
| API routes | Error capture |

---

## Timeline

| Phase | Estimated Effort | Dependencies |
|-------|------------------|--------------|
| Phase 1: PostHog | 2-3 hours | PostHog account |
| Phase 2: Sentry | 2-3 hours | Sentry account |
| Post-Implementation | 1-2 hours | Both phases complete |

---

## Status

- [x] **Phase 1: PostHog - Infrastructure** - Complete
  - [x] Package installation (posthog-js, posthog-node)
  - [x] Environment variables configured
  - [x] `src/instrumentation-client.ts` - PostHog initialization with `cookieless_mode: 'on_reject'`
  - [x] `src/lib/posthog/utils.ts` - Consent and identity helpers
  - [x] `src/lib/posthog/events.ts` - Typed event tracking helpers
  - [x] `src/components/consent/CookieConsent.tsx` - GDPR consent banner using `posthog.get_explicit_consent_status()`
  - [x] `src/app/layout.tsx` - Added CookieConsent component
  - [x] `src/components/providers/AuthProvider.tsx` - User identification on login/logout
- [x] **Phase 1: PostHog - Custom Event Tracking** - Complete
  - [x] Add `trackSignIn/trackSignUp` to auth flows (`AuthForm.tsx`, `callback/page.tsx`)
  - [x] Add `trackCardAdded/trackCardRemoved` to card flows (`QuickAddForm.tsx`, `AddToCollectionForm.tsx`, `useQuickAdd.ts`, `CollectionQuickViewContent.tsx`)
  - [x] Add `trackCardGraded` to AI grading flow (`GradingAnalysisModal.tsx`)
  - [x] Add `trackCollectionViewed` to collection page (`CollectionClient.tsx`)
  - [x] Add `trackSearch` to search components (`useQuickAdd.ts`)
  - [x] Add `trackCreditsUsed` to credit flows (`GradingAnalysisModal.tsx`)
  - [x] Add `trackCardDetailsViewed` to card details page (`CardDetailClient.tsx`)
  - [x] Add `trackSignOut` to sign out handlers (`Sidebar.tsx`, `Header.tsx`)
  - [x] Add `trackError` to ErrorBoundary (`ErrorBoundary.tsx`)
  - [ ] `trackCardAnalyzed` - Pending (AI identification client-side flow not yet built)
  - [ ] `trackCreditsPurchased` - Pending (no payment flow exists yet)
- [x] **Phase 2: Sentry - Infrastructure** - Complete
  - [x] Package installation (@sentry/nextjs via wizard)
  - [x] Environment variables configured (Vercel + .env.sentry-build-plugin)
  - [x] `src/instrumentation-client.ts` - Client-side Sentry with integrations
  - [x] `sentry.server.config.ts` - Server-side Sentry with enableLogs
  - [x] `sentry.edge.config.ts` - Edge runtime Sentry
  - [x] `src/instrumentation.ts` - Next.js instrumentation hook
  - [x] `src/app/global-error.tsx` - Root error boundary
  - [x] `next.config.ts` - Wrapped with withSentryConfig
  - [x] User context tracking in AuthProvider (Sentry.setUser on login/logout)
  - [x] Next.js upgraded to 15.5.12 for Turbopack compatibility
  - [x] Tested: captureException, captureMessage, console.error, unhandled errors
- [x] **Phase 2: Sentry - Exception Catching & Tracing** - Complete
  - [x] Add Sentry.captureException to all 17 API route error handlers
  - [x] Add performance spans for external API calls (Ximilar identify, Ximilar grade, Resend email)
  - [x] Add performance spans for database operations (Pokemon search, grading opportunities, profile create)
  - [x] Add Sentry.captureException to ErrorBoundary.tsx
- [x] **Phase 2: Sentry - Logs** - Complete
  - [x] Added consoleLoggingIntegration({ levels: ["warn", "error"] }) to client, server, and edge configs
  - [x] Console.warn and console.error now captured in Sentry Logs
- [x] **Phase 2: Sentry - Metrics** - Complete
  - [x] Added business metrics to key API routes:
    - [x] `cards_graded` (count) with success/failed status
    - [x] `cards_identified` (count) with success/failed/error status
    - [x] `credits_consumed` (count) with operation attribute
    - [x] `collection_cards_added` (count) with created/updated action
    - [x] `pokemon_searches` (count) with has_results attribute
    - [x] `card_grading_latency` (distribution) in milliseconds
    - [x] `card_identification_latency` (distribution) in milliseconds
    - [x] `pokemon_search_latency` (distribution) in milliseconds
    - [x] `pokemon_search_results` (distribution) result count
- [ ] **Post-Implementation** - Partially Complete
  - [x] Sentry dashboard configured and working
  - [x] PostHog dashboard configured and working
  - [ ] Create PostHog funnel: Signup → First Card Added → First Grade
  - [ ] Set up Slack integration for Sentry alerts
  - [ ] Review and tune sampling rates after 1 week
- [ ] **Performance: Refactor Camera Capture to Use Blob URLs** - TODO
  - [ ] Refactor camera capture flow to use `URL.createObjectURL(blob)` for display
  - [ ] Convert to base64 only at API submission time
  - [ ] Add `URL.revokeObjectURL()` cleanup on unmount
  - [ ] Files to update:
    - [ ] `src/components/dashboard/AIAnalysisVisualization.tsx`
    - [ ] `src/components/dashboard/GradingConfirmation.tsx`
    - [ ] `src/components/dashboard/ImagePreview.tsx`
    - [ ] `src/components/search/ScanResultsView.tsx`
    - [ ] Camera capture hooks/utilities (source of base64)

---

## 2.11 Sentry Exception Catching & Tracing Implementation - COMPLETE

All Sentry instrumentation has been implemented across the codebase.

### Exception Catching (Sentry.captureException) - COMPLETE

All API routes have `Sentry.captureException(error, { tags: {...} })` in their catch blocks:

#### API Routes - Error Handlers
- [x] `src/app/api/cards/identify/route.ts` - Card identification errors
- [x] `src/app/api/cards/grade/route.ts` - Card grading errors
- [x] `src/app/api/cards/upload-image/route.ts` - Image upload errors
- [x] `src/app/api/collection/cards/route.ts` - Collection card CRUD errors
- [x] `src/app/api/collection/cards/[id]/route.ts` - Single card operations errors
- [x] `src/app/api/collection/products/route.ts` - Products errors
- [x] `src/app/api/collection/products/[id]/route.ts` - Single product operations errors
- [x] `src/app/api/collection/sets/[setId]/ownership/route.ts` - Set ownership errors
- [x] `src/app/api/collection/sets/[setId]/stats/route.ts` - Set stats errors
- [x] `src/app/api/pokemon/search/route.ts` - Search errors
- [x] `src/app/api/pokemon/cards/[cardId]/route.ts` - Card fetch errors
- [x] `src/app/api/pokemon/products/[id]/route.ts` - Product fetch errors
- [x] `src/app/api/profile/create/route.ts` - Profile creation errors
- [x] `src/app/api/profile/username-check/route.ts` - Username check errors
- [x] `src/app/api/profile/grading-tips/route.ts` - Grading tips errors
- [x] `src/app/api/grading-opportunities/route.ts` - Grading opportunities errors
- [x] `src/app/api/waitlist/signup/route.ts` - Waitlist signup errors

#### Client-Side Error Boundaries
- [x] `src/components/error/ErrorBoundary.tsx` - Sentry.captureException in componentDidCatch

### Performance Tracing (Sentry.startSpan) - COMPLETE

#### External API Calls (op: "http.client")
- [x] `src/app/api/cards/identify/route.ts` - `Ximilar Card Identification` span
- [x] `src/app/api/cards/grade/route.ts` - `Ximilar Card Grading` span
- [x] `src/app/api/cards/grade/route.ts` - `Download Annotated Images` span
- [x] `src/app/api/cards/upload-image/route.ts` - `Upload Card Image` span
- [x] `src/app/api/waitlist/signup/route.ts` - `Resend Send Email` span
- [x] `src/lib/ximilar-service.ts` - `Ximilar Identify API` span

#### Database Operations (op: "db.query")
- [x] `src/app/api/pokemon/search/route.ts` - `DB: Pokemon Search` span
- [x] `src/app/api/grading-opportunities/route.ts` - `DB: Fetch Grading Opportunities` span
- [x] `src/app/api/profile/create/route.ts` - `DB: Create Profile` span

### Sentry Logs - COMPLETE

Console logging integration added to capture structured logs:

- [x] `sentry.server.config.ts` - `consoleLoggingIntegration({ levels: ["warn", "error"] })`
- [x] `sentry.edge.config.ts` - `consoleLoggingIntegration({ levels: ["warn", "error"] })`
- [x] `src/instrumentation-client.ts` - `consoleLoggingIntegration({ levels: ["warn", "error"] })`

### Sentry Metrics - COMPLETE

Business metrics added to key API routes:

| Metric | Type | Route | Attributes |
|--------|------|-------|------------|
| `cards_graded` | count | cards/grade | status: success/failed |
| `cards_identified` | count | cards/identify | status: success/failed/error |
| `credits_consumed` | count | cards/grade | operation: grading |
| `collection_cards_added` | count | collection/cards | action: created/updated |
| `pokemon_searches` | count | pokemon/search | has_results: true/false/error |
| `card_grading_latency` | distribution | cards/grade | unit: millisecond |
| `card_identification_latency` | distribution | cards/identify | unit: millisecond |
| `pokemon_search_latency` | distribution | pokemon/search | unit: millisecond |
| `pokemon_search_results` | distribution | pokemon/search | - |

### Testing Checklist for Instrumentation - VERIFIED
- [x] API errors appear in Sentry with proper tags and context
- [x] External API spans show in Performance tab
- [x] Error boundaries capture component errors
- [x] User context appears on all errors
- [x] Source maps show readable stack traces
- [x] Logs appear in Sentry Logs tab
- [x] Metrics appear in Sentry Metrics tab
