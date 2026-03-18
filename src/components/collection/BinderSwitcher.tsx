'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react'
import type { Binder } from '@/types/database'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface BinderSwitcherProps {
  binders: Binder[]
  activeBinder: Binder
  onBinderChange: (binder: Binder) => void
  onCreateBinder: () => void
  onRenameBinder: () => void
  onDeleteBinder: () => void
}

export default function BinderSwitcher({
  binders,
  activeBinder,
  onBinderChange,
  onCreateBinder,
  onRenameBinder,
  onDeleteBinder
}: BinderSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const defaultBinder = binders.find((b) => b.is_default)
  const customBinders = binders.filter((b) => !b.is_default)

  const handleSelect = (binder: Binder) => {
    onBinderChange(binder)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Binder switcher dropdown */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 text-2xl font-bold text-foreground',
              'hover:bg-accent rounded-lg px-2 py-1 -ml-2',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
            )}
            aria-label="Switch binder"
          >
            {activeBinder.name}
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Binders</DropdownMenuLabel>

          {/* Default "All Cards" binder */}
          {defaultBinder && (
            <DropdownMenuItem
              onClick={() => handleSelect(defaultBinder)}
              className={cn(
                activeBinder.id === defaultBinder.id &&
                  'bg-orange-50 text-orange-700'
              )}
            >
              {defaultBinder.name}
            </DropdownMenuItem>
          )}

          {/* Custom binders */}
          {customBinders.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {customBinders.map((binder) => (
                <DropdownMenuItem
                  key={binder.id}
                  onClick={() => handleSelect(binder)}
                  className={cn(
                    activeBinder.id === binder.id &&
                      'bg-orange-50 text-orange-700'
                  )}
                >
                  {binder.name}
                </DropdownMenuItem>
              ))}
            </>
          )}

          {/* Create new binder */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreateBinder}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Binder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings dropdown - only show for non-default binders */}
      {!activeBinder.is_default && (
        <DropdownMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label={`Settings for ${activeBinder.name}`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                setSettingsOpen(false)
                onRenameBinder()
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setSettingsOpen(false)
                onDeleteBinder()
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
