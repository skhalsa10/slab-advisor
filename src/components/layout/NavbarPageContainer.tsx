interface NavbarPageContainerProps {
  children: React.ReactNode
}

/**
 * Page container for public layouts with top navbar
 * 
 * Provides:
 * - Standard content width constraints (max-w-7xl)
 * - Responsive horizontal padding
 * - Vertical padding for content spacing
 * - No sidebar offset (full width content)
 */
export default function NavbarPageContainer({ children }: NavbarPageContainerProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      {children}
    </div>
  )
}