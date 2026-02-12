'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, User, LogOut, Sparkles } from 'lucide-react'

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
  return (
    <div className="flex-shrink-0 border-t border-grey-200 p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-grey-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-orange-700">
                {getInitials(email)}
              </span>
            </div>

            {/* Email */}
            <span className="flex-1 text-sm text-grey-700 truncate text-left">
              {email}
            </span>

            {/* More icon */}
            <MoreHorizontal className="h-4 w-4 text-grey-400 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          className="w-56 bg-white"
        >
          {/* Header with email */}
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-grey-900 truncate">{email}</p>
          </DropdownMenuLabel>

          {/* Credits display (non-clickable) */}
          <DropdownMenuLabel className="flex items-center gap-2 font-normal py-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-grey-600">Credits:</span>
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
              {credits}
            </span>
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
