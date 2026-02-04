import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ConditionalQuickAddProvider from "@/components/providers/ConditionalQuickAddProvider";
import EnvironmentBadge from "@/components/ui/EnvironmentBadge";
import "./globals.css";

// Font configurations for the application
// Inter: Primary sans-serif font for body text and UI elements
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Improves performance by swapping fonts when loaded
  variable: "--font-inter", // CSS custom property for use in globals.css
});

// JetBrains Mono: Monospace font for code and technical content
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono", // CSS custom property for use in globals.css
});

// Application metadata for SEO and browser display
export const metadata: Metadata = {
  title: "Slab Advisor - Trading Card Collection & AI Grading",
  description: "Manage your trading card collection and get AI-powered grade estimates before sending to PSA, BGS, or SGC. Track, organize, and analyze your cards with instant grading insights.",
  keywords: ["trading cards", "card grading", "PSA", "BGS", "SGC", "TAG", "pokemon cards", "sports cards", "card collection", "AI grading", "card value", "card condition", "card management", "TCG", "collectibles"],
  authors: [{ name: "Slab Advisor" }],
  creator: "Slab Advisor",
  publisher: "Slab Advisor",
  category: "Entertainment",
  classification: "Trading Card Management & Analysis",
  
  // Open Graph metadata for social sharing
  openGraph: {
    title: "Slab Advisor - Trading Card Collection & AI Grading",
    description: "Manage your trading card collection and get AI-powered grade estimates before sending to PSA, BGS, or SGC. Track, organize, and analyze your cards with instant grading insights.",
    type: "website",
    locale: "en_US",
    siteName: "Slab Advisor",
    images: [{
      url: "/logo-icon.svg",
      width: 512,
      height: 512,
      alt: "Slab Advisor Logo"
    }]
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary",
    title: "Slab Advisor - Trading Card Collection & AI Grading",
    description: "Manage your trading card collection and get AI-powered grade estimates before sending to PSA, BGS, or SGC.",
    images: ["/logo-icon.svg"]
  },
  
  // App-specific metadata
  applicationName: "Slab Advisor",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // TODO: Additional structured data hints
  other: {
    "google-site-verification": "", // Add your Google Search Console verification code here
    "msvalidate.01": "", // Add your Bing Webmaster Tools verification code here
  }
};

/**
 * Root Layout Component
 * 
 * This is the top-level layout that wraps all pages in the application.
 * It provides:
 * - HTML document structure
 * - Font loading and CSS custom properties
 * - Global styles via globals.css
 * - Performance monitoring via Vercel Speed Insights
 * 
 * Note: This layout applies to ALL pages in the app directory
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} antialiased min-w-[320px]`}
      >
        <ConditionalQuickAddProvider>
          {children}
        </ConditionalQuickAddProvider>
        <EnvironmentBadge />
        <SpeedInsights />
      </body>
    </html>
  );
}
