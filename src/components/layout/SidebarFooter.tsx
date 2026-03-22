'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, User, LogOut, Sparkles, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface SidebarFooterProps {
  email: string
  credits: number
  onSignOut: () => void
  onNavigate?: () => void // Optional callback to close parent drawer on navigation
}

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export default function SidebarFooter({ email, credits, onSignOut, onNavigate }: SidebarFooterProps) {
  const { theme, toggleTheme, isThemeLoading } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex-shrink-0 border-t border-sidebar-border p-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-sidebar">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-orange-700">
                {getInitials(email)}
              </span>
            </div>

            {/* Email */}
            <span className="flex-1 text-sm text-sidebar-foreground truncate text-left">
              {email}
            </span>

            {/* More icon */}
            <MoreHorizontal className="h-4 w-4 text-sidebar-foreground flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          className="w-56 bg-card"
        >
          {/* Header with email */}
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-foreground truncate">{email}</p>
          </DropdownMenuLabel>

          {/* Credits display (non-clickable) */}
          <DropdownMenuLabel className="flex items-center gap-2 font-normal py-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">Credits:</span>
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
              {credits}
            </span>
          </DropdownMenuLabel>

          {/* Theme toggle */}
          <DropdownMenuLabel className="flex items-center justify-between font-normal py-2">
            <div className="flex items-center gap-2">
              {theme === 'DARK' ? (
                <Moon className="h-4 w-4 text-orange-500" />
              ) : (
                <Sun className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {theme === 'DARK' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'DARK'}
              aria-label="Toggle dark mode"
              disabled={isThemeLoading}
              onClick={() => { toggleTheme(); setOpen(false) }}
              className={`
                relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full
                border-2 border-transparent transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${theme === 'DARK' ? 'bg-orange-500' : 'bg-muted'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-4 w-4 transform rounded-full
                  bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${theme === 'DARK' ? 'translate-x-4' : 'translate-x-0'}
                `}
              />
            </button>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Account */}
          <DropdownMenuItem asChild>
            <Link
              href="/account"
              className="flex items-center gap-2 cursor-pointer"
              onClick={onNavigate}
            >
              <User className="h-4 w-4" />
              Account
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem
            onClick={onSignOut}
            variant="destructive"
            className="cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
