'use client'

interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
  ariaLabel?: string
  /**
   * When true, stretches to full width on mobile and auto-width on desktop.
   * Use for primary navigation controls like Cards/Sealed switcher.
   */
  fullWidthMobile?: boolean
}

/**
 * Segmented control component for toggling between options
 *
 * A pill-style toggle component similar to iOS segmented controls.
 * Useful for filtering or switching between mutually exclusive options.
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'owned', label: 'Owned' },
 *     { value: 'missing', label: 'Missing' }
 *   ]}
 *   value={filter}
 *   onChange={setFilter}
 *   size="sm"
 * />
 * ```
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  ariaLabel = 'Filter options',
  fullWidthMobile = false
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  }

  const containerPadding = {
    sm: 'p-0.5',
    md: 'p-1'
  }

  const widthClasses = fullWidthMobile
    ? 'flex w-full md:w-auto md:inline-flex'
    : 'inline-flex'

  return (
    <div
      className={`${widthClasses} bg-muted rounded-lg ${containerPadding[size]} ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              ${sizeClasses[size]}
              ${fullWidthMobile ? 'flex-1 text-center' : ''}
              rounded-md font-medium transition-all duration-150
              ${isActive
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
            role="radio"
            aria-checked={isActive}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
