# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.4 application using TypeScript, React 19, and Tailwind CSS v4. The project was bootstrapped with create-next-app and uses the App Router architecture.

The name of this application is Slab Advisor. The goal of the app is to provide a way for customers and users to manage their TCG card collection or sports card collection as well as pregrade and price the cards. when a user signs up/login they will be greated with their dashboards showing an overview of how many cards they have in their collection the estimated value of their collection. and how many followers they have or how many people they are following. there should be an add card to collection page which allows them to add a card to the colelction manually, analyze/identify card and price to automatically identify and price it, grade the card or do both automatically identify/price and grade card. there should be a collection page to view their current collection in a list view(like an excel preadsheet) or a card view by just seeing the image of a card and the name. there will be a card details page that contains all information of the card. there will also be a store page where members and non memer can go to buy card products. there will also be an account page where users can manage their account and buy more credits or change their subscription if applicable.

## Common Development Commands

### Development

```bash
npm run dev        # Start development server with Turbopack
```

### Build & Production

```bash
npm run build      # Build for production
npm run start      # Start production server
```

### Code Quality

```bash
npm run lint       # Run ESLint
```

### Testing

```bash
npm run test       # Run tests in watch mode
npm run test:run   # Run tests once
npm run test:coverage # Run tests with coverage report
```

## Architecture & Structure

### Directory Layout

- `/src/app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with Geist fonts and global styles
  - `page.tsx` - Home page component
  - `globals.css` - Global Tailwind CSS styles
- `/public/` - Static assets (images, SVGs)

### Key Technologies

- **Next.js 15.3.4** with App Router
- **React 19** with Server Components
- **TypeScript** with strict mode enabled
- **Tailwind CSS v4** with PostCSS
- **ESLint** with Next.js recommended config
- **Vitest** for unit tests

### Important Configuration

- TypeScript path alias: `@/*` maps to `./src/*`
- Turbopack is enabled for faster development builds
- Using Geist and Geist Mono fonts from Google Fonts

## Framework Documentation

- **Next.js 15**: https://nextjs.org/docs
- **React 19**: https://react.dev/reference/react
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Supabase**: https://supabase.com/docs
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Vercel Deployment**: https://vercel.com/docs
- **Ximilar API**: https://docs.ximilar.com/
- **Vitest**: https://vitest.dev/guide/
- **TCGDEX**: https://tcgdex.dev/
- **PokemonPricePracker API**: https://www.pokemonpricetracker.com/docs
- **Posthog**: https://posthog.com/docs
- **Posthog MCP**: https://posthog.com/docs/model-context-protocol
- **Sentry**: https://docs.sentry.io/

## Development Process Requirements

### IMPORTANT: Ask Before Implementing

Before writing any code, you MUST:

1. Ask clarifying questions about the implementation approach
2. Confirm the exact requirements and edge cases
3. Propose a solution and wait for approval
4. Only proceed with implementation when you have 99% confidence

Example questions to ask:

- "Should this component be client or server-side?"
- "What should happen when [edge case]?"
- "Should I update existing components or create new ones?"
- "What error states should be handled?"
- "Should this be accessible on mobile?"
- "What happens if the user has no credits?"
- "Should we show a loading state here?"
- "Is there a specific design pattern to follow?"

### Testing Requirements

After implementing any new feature or modifying existing code:

1. Automatically create unit tests for all new functions
2. Update existing tests if behavior changes
3. Create integration tests for API routes
4. Test both happy path and error cases
5. Test edge cases and error scenarios
6. Ensure proper TypeScript types are tested
7. Use Vitest for unit tests
8. Test accessibility requirements

## Code Style Guidelines

### Component Structure

- Use functional components with TypeScript
- Keep components small and focused (< 200 lines) if possible
- Extract reusable logic into custom hooks or utility functions
- Use descriptive variable and function names
- Always define proper TypeScript interfaces/types ask questions if unclear and do not make assumptions
- Place interfaces at the top of files
- Use const for function declarations

### State Management

- Use React hooks for local state
- Use Context for cross-component state
- Document complex state logic
- Avoid prop drilling beyond 2 levels
- Consider using reducers for complex state

### Error Handling

- Always handle loading and error states
- Provide user-friendly error messages
- Log errors for debugging (but not sensitive data)
- Never expose sensitive information in errors
- Show actionable error messages to users
- Implement retry mechanisms where appropriate

## Security Best Practices

- Never expose API keys in client code
- Always validate user input on both client and server
- Use parameterized queries (Supabase handles this)
- Implement proper authentication checks on all API routes
- Sanitize data before displaying
- Check user ownership before allowing updates/deletes
- Use HTTPS for all external API calls
- Implement rate limiting on sensitive endpoints
- Never trust client-side data
- We should never update database tables from client side coude we should always do it securely from the server side

## Performance Guidelines

- Use React.memo for expensive components if possible. and have a conversation to understand implications of this case
- Implement proper loading states
- Optimize images with Next.js Image component
- Use dynamic imports for large components
- Monitor bundle size
- Implement pagination for large lists
- Use debouncing for search/filter inputs
- Cache API responses where appropriate talk with me to udnerstand implications of these changes.
- Minimize re-renders with proper dependency arrays

## Slab Advisor Specific Guidelines

### Credit System

- Always verify credits before operations
- Handle credit deduction failures gracefully
- Show clear credit costs to users
- Never allow credit manipulation from client
- Implement credit checks on server-side only
- Show remaining credits in UI

### Image Handling

- Validate image size and format before upload
- Maximum file size: 10MB
- Accepted formats: JPG, JPEG, PNG, WEBP, HEIC, BMP, TIFF, JFIF
- Implement proper error messages for failed uploads
- Consider compression for long-term storage
- Always check image accessibility before processing

### Database Operations

- Use Row Level Security (RLS) policies
- Always check user ownership before operations
- Handle database errors gracefully
- Use transactions for multi-step operations
- Implement soft deletes where appropriate
- Log important operations for audit trail

### Card Analysis

- Show clear loading states during analysis
- Handle Ximilar API errors gracefully
- Provide fallback for failed identifications
- Allow manual entry as backup option
- Cache analysis results

## Git Commit Guidelines

- Use conventional commit format: `type(scope): message`
- Types: feat, fix, docs, style, refactor, test, chore
- Write clear, descriptive commit messages
- One feature/fix per commit
- Examples:
  - `feat(auth): add username to signup flow`
  - `fix(cards): handle upload errors properly`
  - `docs: update API documentation`

## Code Review Checklist

Before considering code complete, ensure:

- [ ] All TypeScript errors resolved
- [ ] Tests written and passing
- [ ] No console.logs in production code
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Accessibility considered (ARIA labels, keyboard nav)
- [ ] Mobile responsive design tested
- [ ] Security best practices followed
- [ ] Performance optimizations applied
- [ ] Documentation updated if needed
- [ ] Proper error messages for users
- [ ] API rate limiting considered

## Communication Style

- Be concise but thorough in explanations
- Explain complex implementations clearly
- Highlight any security concerns immediately
- Suggest improvements when noticed
- Always explain tradeoffs of different approaches
- Ask for clarification rather than assuming
- Provide code examples when explaining concepts
- Mention performance implications of choices

## API Design Guidelines

- Use RESTful conventions
- Return consistent response formats
- Include proper HTTP status codes
- Validate all inputs
- Document expected request/response formats
- Implement proper error responses
- Use consistent naming conventions

## Database Schema Considerations

- Maintain referential integrity
- Add appropriate indexes for queries
- Document schema changes
- Consider future scalability
- Use proper data types
- Implement audit fields (created_at, updated_at)

## Database Change Management

### Dual-Environment Setup

This project uses two Supabase environments:

| Environment         | Project ID             | Purpose                                                 |
| ------------------- | ---------------------- | ------------------------------------------------------- |
| **Gamma** (staging) | `oeqgpubjdeomnfunezot` | Development and testing. `.env.local` points here.      |
| **Production**      | `syoxdgxffdvvpguzvcxo` | Live user data. Vercel Production deployment uses this. |

- Local development (`npm run dev`) always targets **gamma**
- Vercel Preview deployments (from `gamma` branch) target **gamma**
- Vercel Production deployments (from `main` branch) target **production**

### Migration Workflow

All database schema changes MUST follow this workflow:

1. **Write the migration SQL** and review it
2. **Apply to gamma first** using the Supabase MCP `apply_migration` tool:
   ```
   apply_migration(project_id="oeqgpubjdeomnfunezot", name="descriptive_snake_case_name", query="SQL here")
   ```
3. **Test thoroughly** in gamma (local dev + Vercel preview)
4. **Apply the SAME SQL to production** when verified:
   ```
   apply_migration(project_id="syoxdgxffdvvpguzvcxo", name="same_name", query="same SQL")
   ```
5. **Update the migration log** at `supabase/MIGRATION_LOG.md`
6. **Commit** the migration file and log update to git

For emergencies (hotfix directly to production), apply the same SQL to gamma afterward to keep them in sync, and note the reverse order in the log.

### Important Notes About Migrations

- The `supabase/migrations/` folder is **passive** - it does NOT automatically trigger anything in Supabase. Unlike edge functions, migrations only run when explicitly called via `apply_migration` through the MCP tool. The folder is purely a git-tracked history of schema changes.
- The `apply_migration` MCP tool both executes the SQL AND creates a timestamped file in `supabase/migrations/`
- The baseline schema is documented in `supabase/migrations/00000000000000_baseline_schema.sql` (reference only, not re-runnable)
- The `supabase/MIGRATION_LOG.md` tracks which migrations have been applied where

### Checking Migration Sync

To verify both environments have the same migrations:

```sql
-- Run on both gamma and production via execute_sql MCP tool
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
```

Compare the results to identify any drift between environments.

### Type Generation

After schema changes, regenerate TypeScript types:

```bash
npm run types:generate        # From production
npm run types:generate:gamma  # From gamma (use during development)
```

## Visual Development

### Design Principles

- Comprehensive design checklist in `/context/design-principles.md`
- Brand style guide in `/context/style-guide.md` if available
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance

## Sentry Error Tracking

### Configuration Files

In Next.js, Sentry initialization happens in specific files:

- **Client-side**: `instrumentation-client.ts`
- **Server-side**: `sentry.server.config.ts`
- **Edge runtime**: `sentry.edge.config.ts`

Initialization does not need to be repeated in other files. Use `import * as Sentry from "@sentry/nextjs"` to reference Sentry functionality.

### Exception Catching

Use `Sentry.captureException(error)` to capture exceptions in try-catch blocks or areas where exceptions are expected.

### Tracing and Spans

Spans should be created for meaningful actions: button clicks, API calls, and function calls.

#### Component Actions

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        span.setAttribute("config", "some config");
        span.setAttribute("metric", "some metric");
        doSomething();
      },
    );
  };

  return <button onClick={handleTestButtonClick}>Test</button>;
}
```

#### API Calls

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
  );
}
```

### Logging

Enable logging in Sentry init with `enableLogs: true`. Use the logger for structured logs:

```javascript
const { logger } = Sentry;

logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached", { endpoint: "/api/results/" });
logger.error("Failed to process payment", { orderId: "order_123" });
logger.fatal("Database connection pool exhausted", { activeConnections: 100 });
```

Use `logger.fmt` template literal function to bring variables into structured logs.

### Console Logging Integration

Console logs are automatically captured via `consoleLoggingIntegration`:

```javascript
Sentry.init({
  dsn: "...",
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
});
```

### Metrics

Use Sentry Metrics to track business metrics like operation counts and latencies:

```javascript
import * as Sentry from "@sentry/nextjs";

// Count operations with attributes
Sentry.metrics.count("cards_graded", 1, {
  attributes: { status: "success" },
});

// Track latency distributions
Sentry.metrics.distribution("card_grading_latency", Date.now() - startTime, {
  unit: "millisecond",
});
```

**Current Metrics:**

- `cards_graded` / `cards_identified` - Operation counts with status
- `credits_consumed` - Credit usage tracking
- `collection_cards_added` - Collection activity
- `pokemon_searches` - Search volume
- `*_latency` distributions - Performance tracking

## PostHog Event Tracking

### Configuration

PostHog is initialized in `instrumentation-client.ts` with GDPR-compliant consent handling via `cookieless_mode: 'on_reject'`.

### Event Tracking Helpers

Use the typed helpers from `src/lib/posthog/events.ts`:

```typescript
import {
  trackSignIn,
  trackCardAdded,
  trackCardGraded,
  trackSearch,
  trackError,
} from "@/lib/posthog/events";

// Auth events
trackSignIn({ method: "email" });
trackSignUp({ method: "google" });
trackSignOut();

// Card events
trackCardAdded({ source: "manual", category: "pokemon", cardId: "123" });
trackCardRemoved({ cardId: "123" });
trackCardGraded({
  grade: 9.5,
  creditsUsed: 1,
  durationMs: 12000,
  cardId: "123",
});
trackCardDetailsViewed({ cardId: "123", category: "pokemon" });

// Collection events
trackCollectionViewed({ viewMode: "grid", cardCount: 50 });

// Search events
trackSearch({ query: "pikachu", resultsCount: 25 });

// Credit events
trackCreditsUsed({ amount: 1, action: "grade" });

// Error events
trackError({
  errorType: "ApiError",
  message: "Failed to fetch",
  componentStack: "...",
});
```

### User Identification

User identification happens automatically in `AuthProvider.tsx`:

```typescript
import { identifyUser, resetUser } from "@/lib/posthog/utils";

// On login
identifyUser(user.id, { email: user.email, created_at: user.created_at });

// On logout
resetUser();
```

### Adding New Events

1. Add the event type to `src/lib/posthog/events.ts`
2. Create a typed helper function
3. Call the helper where the action occurs
4. Never include PII beyond user ID and email
