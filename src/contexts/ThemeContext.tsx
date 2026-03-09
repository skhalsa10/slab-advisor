'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'LIGHT' | 'DARK'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => Promise<void>
  isThemeLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ 
  children, 
  initialTheme 
}: { 
  children: React.ReactNode
  initialTheme: Theme 
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [isThemeLoading, setIsThemeLoading] = useState(false)

  // Apply or remove the .dark class on the <html> element
  useEffect(() => {
    if (theme === 'DARK') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = async () => {
    const newTheme = theme === 'LIGHT' ? 'DARK' : 'LIGHT'
    const previousTheme = theme

    // Optimistic UI update
    setTheme(newTheme)
    setIsThemeLoading(true)

    try {
      // Calls our server API route which securely executes the update statement
      // in Supabase using the authenticated user's session.
      const response = await fetch('/api/profile/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      })

      if (!response.ok) {
        setTheme(previousTheme) // Revert on failure
      }
    } catch {
      setTheme(previousTheme) // Revert on failure
    } finally {
      setIsThemeLoading(false)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isThemeLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
