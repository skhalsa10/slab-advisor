# Stripe Integration & Account Management - Implementation Plan

## Overview

This document outlines the comprehensive plan for integrating Stripe payments, building account management features, and implementing The Vault store for Slab Advisor. The work is divided into 6 phases, each with its own detailed sub-plan to be created when implementation begins.

---

## Current State

| Feature | Status |
|---------|--------|
| Sidebar | 4 nav items (Dashboard, Collection, Explore, Quick Add), shows email + credits |
| Account Page | Does not exist |
| Username | Fully implemented on signup, no display in account |
| Cookie Consent | Implemented via PostHog, no database sync |
| Credits System | Fully implemented (free/purchased tracking, atomic deduction) |
| Stripe | Not implemented (greenfield) |
| Store | Does not exist |

---

## Phase 1: Sidebar & Account Page Foundation

### Objective
Create the account/settings page with core features before adding payment functionality.

### Deliverables

1. **Sidebar Modification** ([Sidebar.tsx](src/components/layout/Sidebar.tsx))
   - Add "Account" nav item with gear icon
   - Display username instead of email
   - Show account type badge (Basic/Pro)

2. **Account Page** (`src/app/(authenticated)/account/`)
   - Profile section: username, email, member since
   - Credits section: balance breakdown, next reset date
   - Subscription section: account type badge (Basic for now)
   - Privacy section: cookie consent toggle, privacy policy link
   - Danger Zone: delete collection data with confirmation

3. **API Routes**
   - `GET /api/account/profile` - Fetch profile with credit details
   - `DELETE /api/account/delete-data` - Delete user's collection data
   - `PATCH /api/account/cookie-consent` - Update consent preference

4. **Database Migration**
   - Add `cookie_consent_at` and `cookie_consent_withdrawn_at` to profiles table

### Dependencies
- None (builds on existing infrastructure)

---

## Phase 2: Stripe Foundation

### Objective
Set up Stripe infrastructure and database schema without user-facing payment features.

### Deliverables

1. **Dependencies**
   ```bash
   npm install stripe @stripe/stripe-js
   ```

2. **Environment Variables**
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - Price IDs for products

3. **Stripe Client Setup**
   - `src/lib/stripe.ts` - Server-side client
   - `src/lib/stripe-client.ts` - Client-side loadStripe
   - `src/types/stripe.ts` - TypeScript types

4. **Database Migrations**
   - `subscriptions` table (user_id, stripe_customer_id, status, plan_type, period dates)
   - `payments` table (user_id, stripe_payment_intent_id, amount, status, payment_type)
   - Auto-create subscription record trigger on user signup
   - Backfill existing users

### Dependencies
- Phase 1 complete (account page exists to display subscription status)

---

## Phase 3: Credit Purchases

### Objective
Allow users to purchase additional credits via Stripe Checkout.

### Deliverables

1. **Stripe Products** (Create in Stripe Dashboard)
   | Product | Price | Credits |
   |---------|-------|---------|
   | Credit Pack 5 | $4.99 | 5 |
   | Credit Pack 10 | $8.99 | 10 |
   | Credit Pack 25 | $19.99 | 25 |

2. **API Routes**
   - `POST /api/stripe/create-checkout-session` - Create checkout for credits
   - `POST /api/stripe/webhooks` - Handle Stripe events

3. **Webhook Handler**
   - `checkout.session.completed` - Add credits via `add_purchased_credits` RPC
   - Record payment in `payments` table
   - Track metrics (Sentry) and events (PostHog)

4. **UI Components**
   - `BuyCreditsModal.tsx` - Credit package selection
   - Update `CreditsSection.tsx` with buy button
   - Success/cancel handling on account page

### Dependencies
- Phase 2 complete (Stripe infrastructure ready)

---

## Phase 4: Founding Member Subscription

### Objective
Implement $5/month Founding Member subscription with enhanced benefits.

### Subscription Benefits
- 10 credits/month (instead of 2 free)
- "Founding Member" badge on profile
- Priority support (future)

### Deliverables

1. **Database Migration**
   - Add `subscription_credits` and `subscription_credits_reset_at` to `user_credits`
   - Update `deduct_user_credit` function (deduct order: free -> subscription -> purchased)
   - Add `reset_subscription_credits` RPC function

2. **Stripe Product** (Create in Dashboard)
   - Founding Member: $5/month recurring

3. **API Routes**
   - Update checkout session for subscription mode
   - `POST /api/stripe/create-portal-session` - Stripe Customer Portal

4. **Webhook Updates**
   - `customer.subscription.updated` - Update status
   - `customer.subscription.deleted` - Mark canceled
   - `invoice.paid` - Reset subscription credits monthly
   - `invoice.payment_failed` - Handle failed payments

5. **UI Components**
   - `SubscriptionCard.tsx` - Plan status, upgrade/manage buttons
   - Founding Member badge display

### Dependencies
- Phase 3 complete (webhook infrastructure exists)

### Financial Note
Revisit pricing structure during implementation to confirm $5/month with 10 credits is optimal.

---

## Phase 5: The Vault Store

### Objective
Implement store for limited physical product drops with inventory management.

### Deliverables

1. **Database Migrations**
   - `vault_drops` table (name, description, drop_date, is_active)
   - `vault_products` table (drop_id, stripe_ids, price, inventory_count, max_per_customer)
   - `vault_orders` table (user_id, product_id, status, shipping_address, tracking)
   - `reserve_vault_inventory` RPC function (atomic inventory check/reservation)
   - `release_vault_inventory` RPC function (for failed checkouts)

2. **Store Pages**
   - `src/app/store/page.tsx` - Active drops listing
   - `src/app/store/[dropId]/page.tsx` - Drop detail with products
   - `src/app/(authenticated)/store/orders/page.tsx` - Order history

3. **API Routes**
   - `GET /api/store/drops` - List active drops
   - `GET /api/store/products/[id]` - Product details
   - `POST /api/store/checkout` - Create order with shipping
   - `GET /api/store/orders` - User's order history

4. **Stripe Features**
   - `shipping_address_collection` - US only initially
   - `automatic_tax: { enabled: true }` - Stripe Tax
   - Stripe Radar for bot protection

5. **Webhook Updates**
   - Handle vault order completion
   - Release inventory on failed/canceled checkout

### Dependencies
- Phase 3 complete (payment infrastructure exists)

### Shipping Note
Start with US only. Investigate international shipping requirements when implementing.

---

## Phase 6: Security & Polish

### Objective
Harden security and add monitoring for production readiness.

### Deliverables

1. **Rate Limiting**
   - Checkout endpoints: 5 attempts/minute per user
   - Webhook protection

2. **Stripe Security**
   - Stripe Radar custom rules
   - 3D Secure for high-value purchases
   - Webhook signature verification (required)

3. **Idempotency**
   - Prevent duplicate credit additions
   - Prevent duplicate order processing

4. **Monitoring**
   - Sentry spans for checkout flows
   - Sentry metrics: `credits_purchased`, `payment_failed`, `vault_orders`
   - PostHog events: `checkout_started`, `purchase_completed`, `subscription_started`

5. **Error Handling**
   - User-friendly error messages
   - Retry logic for transient failures
   - Failed payment notification emails

### Dependencies
- Phases 3-5 complete

---

## Migration Strategy

All database changes follow the dual-environment workflow:

1. Write migration SQL
2. Apply to **gamma** (`oeqgpubjdeomnfunezot`) via MCP `apply_migration`
3. Run `npm run types:generate:gamma`
4. Test thoroughly in gamma
5. Apply same SQL to **production** (`syoxdgxffdvvpguzvcxo`)
6. Run `npm run types:generate`
7. Update `supabase/MIGRATION_LOG.md`
8. Deploy code

### Stripe Environment Strategy
- Use Stripe **test mode** keys in gamma
- Use Stripe **live mode** keys in production
- Separate webhook endpoints per environment

---

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Sidebar | [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) |
| Credits Context | [src/contexts/CreditsContext.tsx](src/contexts/CreditsContext.tsx) |
| Credits Utils | [src/utils/credits.ts](src/utils/credits.ts) |
| Auth Server | [src/lib/auth-server.ts](src/lib/auth-server.ts) |
| Supabase Server | [src/lib/supabase-server.ts](src/lib/supabase-server.ts) |
| PostHog Events | [src/lib/posthog/events.ts](src/lib/posthog/events.ts) |
| Database Types | [src/models/database.ts](src/models/database.ts) |
| Migration Log | [supabase/MIGRATION_LOG.md](supabase/MIGRATION_LOG.md) |

---

## Decisions Made

| Decision | Choice |
|----------|--------|
| Cookie consent storage | Database + PostHog (GDPR compliant audit trail) |
| Credit pricing | $4.99/5, $8.99/10, $19.99/25 |
| Shipping | US only initially |
| Subscription | $5/month with 10 credits (revisit during implementation) |

---

## Next Steps

When ready to implement, create detailed sub-plans for each phase:

1. `implementationPlanPhase1_AccountPage.md`
2. `implementationPlanPhase2_StripeFoundation.md`
3. `implementationPlanPhase3_CreditPurchases.md`
4. `implementationPlanPhase4_Subscription.md`
5. `implementationPlanPhase5_VaultStore.md`
6. `implementationPlanPhase6_Security.md`

Each sub-plan should include:
- Detailed file changes with code snippets
- Migration SQL ready to execute
- Test cases
- Verification steps
