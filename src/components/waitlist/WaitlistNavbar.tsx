import Link from 'next/link'
import Image from 'next/image'

/**
 * WaitlistNavbar Component
 *
 * Simplified navigation bar for the waitlist page.
 * Shows only the brand logo — no login button, no navigation links.
 * This ensures no app functionality is exposed in waitlist mode.
 */
export default function WaitlistNavbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-grey-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Slab Advisor Logo"
              width={200}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
      </div>
    </nav>
  )
}
