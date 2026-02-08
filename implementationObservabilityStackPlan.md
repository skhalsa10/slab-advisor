# Observability Stack Implementation Plan

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

### 1.10 Add Event Tracking Throughout App (TODO)

The event tracking helpers are created in `src/lib/posthog/events.ts`. These need to be added to the relevant components/pages:

#### Authentication Events
- [ ] `src/app/auth/page.tsx` - Add `trackSignIn()` after successful login
- [ ] `src/app/auth/page.tsx` - Add `trackSignUp()` after successful signup
- [ ] Logout handler - Add `trackSignOut()` before logout

#### Card Events
- [ ] Card add flow - Add `trackCardAdded({ source: 'manual' | 'ai', category })`
- [ ] Card delete - Add `trackCardRemoved({ cardId })`
- [ ] AI identification - Add `trackCardAnalyzed({ success, confidence, creditsUsed, durationMs })`
- [ ] AI grading - Add `trackCardGraded({ grade, creditsUsed, durationMs })`
- [ ] Card detail page - Add `trackCardDetailsViewed({ cardId, category })`

#### Collection Events
- [ ] Collection page - Add `trackCollectionViewed({ viewMode, cardCount })`

#### Search Events
- [ ] Search components - Add `trackSearch({ query, resultsCount, filters })`

#### Credit Events
- [ ] Credit purchase flow - Add `trackCreditsPurchased({ amount, package, price })`
- [ ] Credit usage - Add `trackCreditsUsed({ amount, action })` in API routes

#### Error Events
- [ ] Error boundary - Add `trackError({ errorType, message, page })` in ErrorBoundary

#### Example Usage
```typescript
import { trackCardAdded, trackSearch } from '@/lib/posthog/events'

// In a component
function handleAddCard() {
  // ... add card logic
  trackCardAdded({ source: 'manual', category: 'pokemon' })
}

// In search
function handleSearch(query: string) {
  const results = await search(query)
  trackSearch({ query, resultsCount: results.length })
}
```

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
- [ ] **Phase 1: PostHog - Custom Event Tracking** - TODO (see section 1.10)
  - [ ] Add `trackSignIn/trackSignUp` to auth flows
  - [ ] Add `trackCardAdded/trackCardRemoved` to card flows
  - [ ] Add `trackCardAnalyzed/trackCardGraded` to AI flows
  - [ ] Add `trackCollectionViewed` to collection page
  - [ ] Add `trackSearch` to search components
  - [ ] Add `trackCreditsPurchased/trackCreditsUsed` to credit flows
  - [ ] Add `trackError` to ErrorBoundary
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
- [ ] **Phase 2: Sentry - Exception Catching & Tracing** - TODO (see section 2.11)
  - [ ] Add Sentry.captureException to API route error handlers
  - [ ] Add Sentry.captureException to existing try-catch blocks
  - [ ] Add performance spans for external API calls (Ximilar, etc.)
  - [ ] Add performance spans for key user actions
- [ ] **Post-Implementation** - Not Started
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

## 2.11 Sentry Exception Catching & Tracing Implementation (TODO)

The Sentry infrastructure is complete. Now we need to instrument the codebase with exception catching and performance tracing.

### Exception Catching (Sentry.captureException)

Add `Sentry.captureException(error)` to capture errors with context:

#### API Routes - Error Handlers
- [ ] `src/app/api/cards/identify/route.ts` - Card identification errors
- [ ] `src/app/api/cards/grade/route.ts` - Card grading errors
- [ ] `src/app/api/cards/upload-image/route.ts` - Image upload errors
- [ ] `src/app/api/collection/cards/route.ts` - Collection card CRUD errors
- [ ] `src/app/api/collection/cards/[id]/route.ts` - Single card operations errors
- [ ] `src/app/api/collection/products/route.ts` - Products errors
- [ ] `src/app/api/pokemon/search/route.ts` - Search errors
- [ ] `src/app/api/profile/create/route.ts` - Profile creation errors
- [ ] `src/app/api/profile/username-check/route.ts` - Username check errors

#### Client-Side Error Boundaries
- [ ] `src/components/error/ErrorBoundary.tsx` - Add Sentry.captureException in componentDidCatch
- [ ] `src/components/error/CardErrorBoundary.tsx` - Add Sentry.captureException
- [ ] `src/app/(authenticated)/collection/error.tsx` - Add Sentry.captureException

#### Utility Functions with Try-Catch
- [ ] `src/utils/credits.ts` - Credit operations (checkUserCredits, deductUserCredits, refundUserCredit)
- [ ] `src/lib/auth.ts` - Auth-related errors

### Performance Tracing (Sentry.startSpan)

Add spans for meaningful actions to track performance:

#### External API Calls (op: "http.client")
- [ ] `src/app/api/cards/identify/route.ts` - Wrap Ximilar API call
  ```typescript
  Sentry.startSpan({ op: "http.client", name: "Ximilar Card Identification" }, async () => { ... })
  ```
- [ ] `src/app/api/cards/grade/route.ts` - Wrap Ximilar grading API call
  ```typescript
  Sentry.startSpan({ op: "http.client", name: "Ximilar Card Grading" }, async () => { ... })
  ```
- [ ] Any other external API calls (Pokemon TCG API, price APIs, etc.)

#### Database Operations (op: "db.query")
- [ ] Heavy database queries in collection fetching
- [ ] Dashboard data aggregations

#### Key User Actions (op: "ui.action")
- [ ] `src/components/collection/AddToCollectionForm.tsx` - Card add submission
  ```typescript
  Sentry.startSpan({ op: "ui.action", name: "Add Card to Collection" }, async () => { ... })
  ```
- [ ] `src/components/search/QuickAddContent.tsx` - Quick add flow
- [ ] `src/components/collection/DeleteCardDialog.tsx` - Card deletion

### Example Implementation Patterns

#### API Route Error Handling
```typescript
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
  try {
    // ... existing logic
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'cards/identify' },
      extra: { requestBody: await request.clone().json() }
    })
    console.error('Card identification failed:', error)
    return NextResponse.json({ error: 'Identification failed' }, { status: 500 })
  }
}
```

#### External API Call with Span
```typescript
import * as Sentry from '@sentry/nextjs'

async function identifyCardWithXimilar(imageUrl: string) {
  return Sentry.startSpan(
    { op: "http.client", name: "Ximilar Card Identification" },
    async (span) => {
      const startTime = Date.now()
      const result = await fetch(XIMILAR_API_URL, { ... })
      span.setAttribute("response_status", result.status)
      span.setAttribute("duration_ms", Date.now() - startTime)
      return result.json()
    }
  )
}
```

#### Error Boundary with Sentry
```typescript
import * as Sentry from '@sentry/nextjs'

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  Sentry.captureException(error, {
    extra: {
      componentStack: errorInfo.componentStack,
    },
  })
}
```

### Testing Checklist for Instrumentation
- [ ] API errors appear in Sentry with proper tags and context
- [ ] External API spans show in Performance tab
- [ ] Error boundaries capture component errors
- [ ] User context appears on all errors
- [ ] Source maps show readable stack traces
