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
- **Card Hedger API**: https://api.cardhedger.com/docs
- **PokemonPricePracker API**: https://www.pokemonpricetracker.com/docs

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

## Visual Development

### Design Principles

- Comprehensive design checklist in `/context/design-principles.md`
- Brand style guide in `/context/style-guide.md` if available
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance
