/**
 * FeaturesSection Component
 * 
 * Showcase section highlighting the six core features of Slab Advisor.
 * Displays features in a responsive grid layout with icons and descriptions
 * to communicate the platform's value propositions.
 */

export default function FeaturesSection() {
  const features = [
    {
      icon: "🤖",
      title: "AI Card Analysis",
      description: "Upload a photo and get instant card identification, condition assessment, and grading predictions using advanced computer vision."
    },
    {
      icon: "💰",
      title: "Real-Time Pricing",
      description: "Access up-to-date market values, price trends, and historical data to make informed buying and selling decisions."
    },
    {
      icon: "📊",
      title: "Collection Management",
      description: "Organize your entire collection with list and card views, track total value, and monitor your portfolio's growth over time."
    },
    {
      icon: "🏆",
      title: "Professional Grading",
      description: "Get professional-quality card grading assessments that help you understand your cards' true condition and value."
    },
    {
      icon: "👥",
      title: "Social Features",
      description: "Connect with other collectors, follow collections you admire, and share your most prized cards with the community."
    },
    {
      icon: "🛒",
      title: "Marketplace Access",
      description: "Browse and purchase card products from trusted sellers, with detailed information and competitive pricing."
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Card Collecting
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From AI-powered analysis to comprehensive collection management, 
            Slab Advisor gives you professional tools at your fingertips.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-background rounded-xl p-6 hover:bg-secondary transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}