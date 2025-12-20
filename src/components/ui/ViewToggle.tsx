'use client'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  className?: string
}

export default function ViewToggle({ viewMode, onViewModeChange, className = '' }: ViewToggleProps) {
  const toggleView = () => {
    onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')
  }

  return (
    <button
      onClick={toggleView}
      className={`p-2 rounded-lg bg-grey-100 text-grey-600 hover:text-grey-900 hover:bg-grey-200 transition-colors ${className}`}
      aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
      title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
    >
      {viewMode === 'grid' ? (
        // Show list icon when in grid mode (click to switch to list)
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      ) : (
        // Show grid icon when in list mode (click to switch to grid)
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      )}
    </button>
  )
}