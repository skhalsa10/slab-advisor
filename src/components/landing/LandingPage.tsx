import Navbar from '@/components/layout/Navbar'
import HeroSection from './HeroSection'
import FeaturesSection from './FeaturesSection'
import CTASection from './CTASection'

/**
 * Props for the LandingPage component
 * @property onGetStarted - Callback function triggered when user clicks "Get Started"
 * @property onLogin - Callback function triggered when user clicks "Login"
 */
interface LandingPageProps {
  onGetStarted: () => void
  onLogin: () => void
}

/**
 * LandingPage Component
 * 
 * Main landing page layout component that orchestrates the display of:
 * - Hero section (main value proposition with CTA buttons)
 * - Features section (showcases key product features)
 * - CTA section (bottom call-to-action for conversion)
 * 
 * This component acts as a container and passes navigation callbacks
 * down to child components that contain actual CTAs.
 * 
 * @param props - Contains navigation callbacks for authentication flow
 */
export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      {/* Top navigation bar */}
      <Navbar onLogin={onLogin} />
      
      {/* Main hero section with primary messaging and navigation */}
      <HeroSection onGetStarted={onGetStarted} />
      
      {/* Product features showcase */}
      <FeaturesSection />
      
      {/* Bottom conversion section with secondary CTA */}
      <CTASection onGetStarted={onGetStarted} />
    </div>
  )
}