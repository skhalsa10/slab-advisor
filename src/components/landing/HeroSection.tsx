/**
 * HeroSection Component
 * 
 * Primary landing page hero section with main value proposition.
 * Features the headline, subheadline, CTA buttons, and key benefits showcase.
 * Serves as the main entry point for user conversion.
 */

interface HeroSectionProps {
  onGetStarted: () => void
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-br from-orange-50 to-orange-100 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-grey-900 mb-6">
          AI-Powered Card Grading &
          <span className="text-orange-600 block">Collection Management</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-grey-600 mb-8 max-w-3xl mx-auto">
          Get professional-grade card analysis, accurate pricing, and comprehensive collection tracking 
          for your TCG and sports cards—all powered by advanced AI.
        </p>
        
        <div className="flex justify-center items-center mb-12">
          <button
            onClick={onGetStarted}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </button>
        </div>
        
        <p className="text-grey-500 text-sm mb-12">
          Start with 2 free card analyses • No credit card required
        </p>
        
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">AI Analysis</div>
              <p className="text-grey-600">Instant card identification and condition assessment</p>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">Real Pricing</div>
              <p className="text-grey-600">Up-to-date market values and price trends</p>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">Collection</div>
              <p className="text-grey-600">Track your entire collection&apos;s value and growth</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}