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

  // Build responsive grid classes
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    columns.base ? `grid-cols-${columns.base}` : 'grid-cols-1',
    columns['min-480'] ? `min-[480px]:grid-cols-${columns['min-480']}` : '',
    columns.sm ? `sm:grid-cols-${columns.sm}` : '',
    columns.md ? `md:grid-cols-${columns.md}` : '',
    columns.lg ? `lg:grid-cols-${columns.lg}` : '',
    columns.xl ? `xl:grid-cols-${columns.xl}` : '',
    columns['2xl'] ? `2xl:grid-cols-${columns['2xl']}` : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  )
}