interface SidebarPageContainerProps {
  children: React.ReactNode
}

/**
 * Page container for authenticated layouts with sidebar
 * 
 * Provides:
 * - Left padding offset for fixed sidebar (pl-64 on desktop)
 * - Scrollable main content area
 * - Responsive padding and max-width constraints
 * - Mobile-responsive top padding for mobile nav
 */
export default function SidebarPageContainer({ children }: SidebarPageContainerProps) {
  return (
    <div className="flex flex-col h-full md:pl-64">
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}