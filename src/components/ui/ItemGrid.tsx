import { ReactNode } from 'react'

interface ItemGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  emptyStateComponent?: ReactNode
  columns?: {
    base?: number
    'min-480'?: number  // Custom breakpoint for 480px
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: 2 | 3 | 4 | 5 | 6 | 8
  className?: string
}

/**
 * Generic grid component for displaying items in a responsive grid layout
 * 
 * @param items - Array of items to display
 * @param renderItem - Function to render each item
 * @param emptyStateComponent - Component to show when items array is empty
 * @param columns - Responsive column configuration (defaults to card grid)
 * @param gap - Tailwind gap size (default: 4)
 * @param className - Additional CSS classes
 * 
 * Tailwind classes used: grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6
 * sm:grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 sm:grid-cols-4 sm:grid-cols-5 sm:grid-cols-6
 * md:grid-cols-1 md:grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:grid-cols-5 md:grid-cols-6
 * lg:grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 lg:grid-cols-5 lg:grid-cols-6
 * xl:grid-cols-1 xl:grid-cols-2 xl:grid-cols-3 xl:grid-cols-4 xl:grid-cols-5 xl:grid-cols-6
 * 2xl:grid-cols-1 2xl:grid-cols-2 2xl:grid-cols-3 2xl:grid-cols-4 2xl:grid-cols-5 2xl:grid-cols-6
 * gap-2 gap-3 gap-4 gap-5 gap-6 gap-8
 */
export default function ItemGrid<T>({
  items,
  renderItem,
  emptyStateComponent,
  columns = {
    base: 1,
    'min-480': 2,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  },
  gap = 4,
  className = ''
}: ItemGridProps<T>) {
  if (items.length === 0 && emptyStateComponent) {
    return <div>{emptyStateComponent}</div>
  }

  // Map column numbers to Tailwind classes (must be complete strings for Tailwind to detect)
  const getColClass = (cols?: number, prefix?: string) => {
    if (!cols) return ''
    const p = prefix ? `${prefix}:` : ''
    if (cols === 1) return `${p}grid-cols-1`
    if (cols === 2) return `${p}grid-cols-2`
    if (cols === 3) return `${p}grid-cols-3`
    if (cols === 4) return `${p}grid-cols-4`
    if (cols === 5) return `${p}grid-cols-5`
    if (cols === 6) return `${p}grid-cols-6`
    return `${p}grid-cols-4` // fallback
  }

  const getGapClass = () => {
    if (gap === 2) return 'gap-2'
    if (gap === 3) return 'gap-3'
    if (gap === 4) return 'gap-4'
    if (gap === 5) return 'gap-5'
    if (gap === 6) return 'gap-6'
    if (gap === 8) return 'gap-8'
    return 'gap-4'
  }

  // Build responsive grid classes
  const gridClasses = [
    'grid',
    getGapClass(),
    getColClass(columns.base),
    columns['min-480'] ? getColClass(columns['min-480'], 'min-[480px]') : '',
    getColClass(columns.sm, 'sm'),
    getColClass(columns.md, 'md'),
    getColClass(columns.lg, 'lg'),
    getColClass(columns.xl, 'xl'),
    getColClass(columns['2xl'], '2xl'),
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  )
}