# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.4 application using TypeScript, React 19, and Tailwind CSS v4. The project was bootstrapped with create-next-app and uses the App Router architecture.

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

Note: No test command is currently configured. If tests are added, update this file.

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

### Important Configuration
- TypeScript path alias: `@/*` maps to `./src/*`
- Turbopack is enabled for faster development builds
- Using Geist and Geist Mono fonts from Google Fonts