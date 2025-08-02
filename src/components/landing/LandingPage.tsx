import HeroSection from './HeroSection'
import FeaturesSection from './FeaturesSection'
import CTASection from './CTASection'

interface LandingPageProps {
  onGetStarted: () => void
  onLogin: () => void
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      <HeroSection onGetStarted={onGetStarted} onLogin={onLogin} />
      <FeaturesSection />
      <CTASection onGetStarted={onGetStarted} />
    </div>
  )
}