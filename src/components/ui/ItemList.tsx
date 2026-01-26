import { ReactNode } from 'react'

interface ItemListProps<T> {
  items: T[]
  renderHeader: () => ReactNode
  renderRow: (item: T, index: number) => ReactNode
  emptyStateComponent?: ReactNode
  className?: string
}

/**
 * Generic list/table component for displaying items in a spreadsheet-like view
 * 
 * @param items - Array of items to display
 * @param renderHeader - Function to render table headers
 * @param renderRow - Function to render each table row
 * @param emptyStateComponent - Component to show when items array is empty
 * @param className - Additional CSS classes for the container
 */
export default function ItemList<T>({
  items,
  renderHeader,
  renderRow,
  emptyStateComponent,
  className = ''
}: ItemListProps<T>) {
  if (items.length === 0 && emptyStateComponent) {
    return <div>{emptyStateComponent}</div>
  }

  return (
    <div className={`bg-white shadow-md rounded-lg overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-grey-200">
        <thead className="bg-grey-50 sticky top-0">
          {renderHeader()}
        </thead>
        <tbody className="bg-white divide-y divide-grey-200">
          {items.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  )
}