# Slab Advisor — Last Mile Implementation Plan

**As of:** March 14, 2026
**Overall Progress:** ~93%

This is a focused list of remaining work extracted from the full `implementationPlan.md`.

---

## 1. Collection Polish

- [ ] Search by card name within collection
- [ ] Filter by category, grade, price range
- [ ] Sort by date, grade, value, alphabetical
- [ ] Saved filter presets
- [ ] Bulk privacy toggle
- [ ] Bulk export (CSV/PDF)

## 2. Dashboard — Remaining Widgets

- [ ] Cards by category breakdown (Pokemon, One Piece, Sports, Other TCG)
- [ ] Followers/following counts (blocked by social features)
- [ ] Additional widgets TBD

## 3. Card Detail Page — Final 5%

- [ ] Grading information display (show AI grade + breakdown when available)
- [ ] Pre-grading ROI recommendations on card detail
- [ ] Similar cards suggestions (same set/same Pokemon)
- [ ] Set completion progress widget

## 4. Explore & Browse — Remaining Items

- [ ] Owned-card visual indicator (badge/icon/border overlay) on browse grid
- [ ] "Owned" / "Not Owned" filter dropdown (members only)
- [ ] Ownership filter persistence in URL params
- [ ] Ownership widget: flip animation for rarity breakdown
- [ ] Ownership widget: variant breakdown + value of owned vs total set
- [ ] Variant count display bug — investigate "2 variants" vs "3 variants" discrepancy

## 5. Add Card Flow — Final 5%

- [ ] Manual entry form (fallback when scan fails)
- [ ] Market price integration in add flow

## 6. Social Features (Not Started)

- [ ] `follows` table + indexes
- [ ] Profile settings page (`/settings/profile`)
- [ ] Public profile pages (`/u/[username]`)
- [ ] Collection visibility toggle (public/private)
- [ ] Share collection (shareable URLs, Open Graph meta, QR code)
- [ ] Social preview cards for link sharing

## 7. AI Collection Advisor (Not Started)

- [ ] Claude Agent SDK integration
- [ ] Custom tools for collection/grading/market queries
- [ ] Chat UI with streaming responses
- [ ] Conversation history storage (`ai_conversations` table)
- [ ] Usage tracking and cost limits (`ai_usage_logs` table)
- [ ] Premium subscription tier gating

## 8. Payment System — Stripe (Not Started)

- [ ] Stripe account setup + API keys
- [ ] Subscription products/prices (Free / Premium / Pro tiers)
- [ ] Subscription checkout flow
- [ ] Credit pack one-time purchase flow
- [ ] Webhook handler for subscription events
- [ ] Customer Portal integration
- [ ] `subscriptions` + `credit_purchases` tables
- [ ] Subscription status checking middleware
- [ ] Free tier limits enforcement

## 9. Store / Marketplace (Not Started)

- [ ] Store page with product listings
- [ ] Product detail pages
- [ ] Shopping cart (client-side state)
- [ ] Checkout flow with Stripe
- [ ] Inventory management + anti-scalper limits
- [ ] Order creation, tracking, confirmation emails
- [ ] `store_products`, `orders`, `order_items` tables

## 10. Anti-Scalper Systems (Not Started)

- [ ] Easter Egg Hunt system (hidden products, claim flow)
- [ ] Lucky User system (random login offers, time-limited)
- [ ] Bot detection (honeypot, timing analysis, CAPTCHA)

## 11. Testing Infrastructure (Not Started)

- [ ] Unit tests — price utils, variant parsing, credit system, ROI calcs
- [ ] Integration tests — API routes (collection CRUD, grading, webhooks)
- [ ] E2E tests — signup/login, add card, grading, purchase flows (Playwright)
- [ ] Pipeline tests — data sync validation, price update verification
- [ ] Coverage reporting + CI integration

## 12. Legal & Business (Not Started)

- [ ] Business license (LLC)
- [ ] Reseller license for Pokemon products
- [ ] Terms of Service, Privacy Policy, Cookie Policy
- [ ] Refund & Shipping policies
- [ ] Legal pages in app + consent checkboxes

## 13. Tech Debt & Cleanup

- [ ] TypeScript type refactor post-price-migration (remove `any` types, create proper `CardPriceData`/`ProductPriceData`/`PriceHistoryEntry` interfaces)
- [ ] Replace in-memory rate limiting with Redis/Vercel KV before horizontal scaling
- [ ] Vercel cron jobs for price updates + portfolio snapshots

## 14. Performance & Accessibility

- [ ] Lazy loading / pagination for large collections
- [ ] Request caching strategy
- [ ] Bundle size audit
- [ ] Keyboard navigation
- [ ] Screen reader optimization
- [ ] Color contrast audit (especially with new dark mode)
- [ ] Focus indicators
- [ ] Touch-optimized controls

## 15. Error Handling & Resilience

- [ ] Error recovery suggestions
- [ ] Retry mechanisms for transient failures
- [ ] Offline detection + graceful degradation
