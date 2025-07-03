# Slab Advisor Code Structure Guide

## 🏗️ Project Structure Overview

```
slab-advisor/
├── src/                    # All your source code
│   ├── app/               # Next.js App Router (pages & API)
│   ├── components/        # Reusable React components  
│   └── lib/              # Utility functions & configs
├── public/               # Static files (images, icons)
├── .env.local           # Environment variables (secrets)
└── package.json         # Project dependencies
```

## 📁 Key Directories Explained

### 1. `/src/app/` - Pages & Routing
Next.js uses **file-based routing**. Each folder = a route:

```
src/app/
├── page.tsx              # Home page (/)
├── layout.tsx            # Root layout (wraps all pages)
├── auth/
│   └── callback/
│       └── page.tsx      # OAuth callback (/auth/callback)
└── api/
    └── analyze-card/
        └── route.ts      # API endpoint (/api/analyze-card)
```

### 2. `/src/components/` - React Components
Reusable UI pieces organized by feature:

```
src/components/
├── auth/
│   └── AuthForm.tsx      # Login/signup form
├── layout/
│   └── Header.tsx        # Navigation header
└── upload/
    └── CardUpload.tsx    # Card upload interface
```

### 3. `/src/lib/` - Business Logic
Core functionality separated from UI:

```
src/lib/
├── supabase.ts          # Database connection & types
└── auth.ts              # Authentication functions
```

## 🔍 How React Components Work

### Basic Component Structure
```tsx
// Every component is a function that returns JSX (HTML-like syntax)
export default function ComponentName() {
  // 1. State (data that can change)
  const [count, setCount] = useState(0)
  
  // 2. Effects (side effects like API calls)
  useEffect(() => {
    // Runs when component loads
  }, [])
  
  // 3. Event handlers
  const handleClick = () => {
    setCount(count + 1)
  }
  
  // 4. Return JSX (what to display)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Click me</button>
    </div>
  )
}
```

## 🔄 Data Flow in Your App

1. **User visits site** → `src/app/page.tsx` loads
2. **Check authentication** → `getCurrentUser()` from `lib/auth.ts`
3. **Not logged in?** → Show `<AuthForm>` component
4. **Logged in?** → Show `<Header>` + main content
5. **Upload card** → `<CardUpload>` → API route → Ximilar

## 🎯 Key Concepts

### 1. Client vs Server Components
```tsx
'use client'  // Runs in browser (interactive)
// vs
// No directive = Server component (faster, SEO-friendly)
```

### 2. State Management
```tsx
const [user, setUser] = useState(null)  // Local state
// When setUser is called, component re-renders
```

### 3. Props (Passing Data)
```tsx
// Parent component
<Header onSignOut={handleSignOut} />

// Child component receives props
function Header({ onSignOut }) {
  // Can use onSignOut here
}
```

### 4. Hooks (React Features)
- `useState` - Manage component state
- `useEffect` - Side effects (API calls, subscriptions)
- `useRouter` - Navigation

## 📝 Common Patterns in Your Code

### 1. Loading States
```tsx
const [loading, setLoading] = useState(true)
// Show spinner while loading
if (loading) return <Spinner />
```

### 2. Error Handling
```tsx
try {
  const result = await someAsyncFunction()
} catch (error) {
  setError(error.message)
}
```

### 3. Conditional Rendering
```tsx
{user ? (
  <Dashboard />   // Show if user exists
) : (
  <LoginForm />   // Show if no user
)}
```

## 🛠️ Making Changes

### To add a new page:
1. Create folder in `src/app/your-page/`
2. Add `page.tsx` file
3. Visit `/your-page` in browser

### To add a new component:
1. Create file in `src/components/`
2. Export a function that returns JSX
3. Import and use in any page

### To add API endpoint:
1. Create folder in `src/app/api/your-endpoint/`
2. Add `route.ts` with GET/POST functions
3. Call from frontend with `fetch('/api/your-endpoint')`

## 🚀 Development Commands

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Check for code issues
```

## 💡 Tips for Beginners

1. **Start small** - Modify existing components before creating new ones
2. **Use console.log** - Debug by logging data
3. **Check browser DevTools** - Network tab shows API calls
4. **Read error messages** - They usually point to the exact problem
5. **Hot reload** - Save files and see changes instantly

## 📚 Your Current Features

1. **Authentication Flow**
   - `AuthForm.tsx` → `auth.ts` → Supabase → Database

2. **Card Upload Flow**
   - `CardUpload.tsx` → Upload images → Call API → Get grade

3. **Credit System**
   - Database tracks credits
   - Server-side deduction only
   - Display in header

Feel free to ask about any specific file or concept!