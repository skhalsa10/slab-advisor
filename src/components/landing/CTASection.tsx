/**
 * CTASection Component
 * 
 * Bottom call-to-action section of the landing page designed to convert visitors.
 * Features a prominent headline, value proposition, and free trial incentives.
 * Styled with an orange gradient background to draw attention.
 */

interface CTASectionProps {
  onGetStarted: () => void
}

export default function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="bg-gradient-to-r from-orange-600 to-orange-700 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to Transform Your Card Collection?
        </h2>
        
        <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
          Join thousands of collectors who trust Slab Advisor for accurate card analysis, 
          pricing insights, and comprehensive collection management.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={onGetStarted}
            className="bg-white hover:bg-grey-50 text-orange-600 font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Start Your Free Analysis
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-orange-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>2 Free Analyses</span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>No Credit Card Required</span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Instant Setup</span>
          </div>
        </div>
      </div>
    </section>
  )
}