import Link from 'next/link'
import Image from 'next/image'
import { Twitter, Instagram, MessageCircle } from 'lucide-react'

export default function WaitlistFooter() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-white border-t border-grey-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/secondary_logo_light.png"
                alt="Slab Advisor Logo"
                width={196}
                height={84}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-grey-600 max-w-md text-sm leading-relaxed">
              The ultimate sanctuary for card collectors. AI pre-grading, portfolio tracking, and MSRP sealed product drops for all members.
            </p>
            <div className="flex space-x-5 pt-2">
              <a href="https://twitter.com/slabadvisor" target="_blank" rel="noopener noreferrer" className="text-grey-400 hover:text-orange-600 transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/slabadvisor" target="_blank" rel="noopener noreferrer" className="text-grey-400 hover:text-orange-600 transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://discord.gg/slabadvisor" target="_blank" rel="noopener noreferrer" className="text-grey-400 hover:text-orange-600 transition-colors">
                <span className="sr-only">Discord</span>
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-grey-900 uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm text-grey-600 hover:text-orange-600 transition-colors">
                  Join Waitlist
                </button>
              </li>
              <li>
                <span className="text-sm text-grey-400">Features (Coming Soon)</span>
              </li>
              <li>
                <span className="text-sm text-grey-400">Pricing (Coming Soon)</span>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold text-grey-900 uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-grey-600 hover:text-orange-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-grey-600 hover:text-orange-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="mailto:hello@slabadvisor.com" className="text-sm text-grey-600 hover:text-orange-600 transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-grey-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-grey-500">
            &copy; {currentYear} Slab Advisor LLC. All rights reserved.
          </p>
          <p className="text-sm text-grey-400 font-medium">
            The era of the scalper is over.
          </p>
        </div>
      </div>
    </footer>
  )
}
