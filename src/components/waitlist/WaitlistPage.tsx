'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Sparkles, BookOpen, Shield, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import WaitlistNavbar from './WaitlistNavbar'
import { getFeaturedCardData, type FeaturedCardData } from '@/actions/waitlist-featured-card'

/**
 * WaitlistPage Component
 *
 * High-conversion landing page with "Apple-meets-Pokemon" aesthetic.
 * Features:
 * - Split-screen hero with email capture and floating card mockup
 * - Real-time pricing data from database showing PSA 10 value potential
 * - Bento grid feature section with animated cards
 * - Easter egg footer teaser for founding members
 * - Texture, depth, and studio lighting effects
 */

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

// Mega Charizard X ex - Special Illustration Rare from Phantasmal Flames
const FEATURED_CARD_IMAGE = 'https://assets.tcgdex.net/en/me/me02/125/high.jpg'

// Fallback values if API fails (based on recent DB data)
const FALLBACK_DATA: FeaturedCardData = {
  cardId: 'me02-125',
  cardName: 'Mega Charizard X ex',
  setCode: 'ME02',
  rarity: 'Special illustration rare',
  rawPrice: 637,
  psa10Price: 1998,
  gainAmount: 1361,
  gainPercent: 214,
  lastUpdated: new Date().toISOString()
}

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cardData, setCardData] = useState<FeaturedCardData>(FALLBACK_DATA)

  // Fetch real pricing data on mount
  useEffect(() => {
    async function fetchCardData() {
      const data = await getFeaturedCardData()
      if (data) {
        setCardData(data)
      }
    }
    fetchCardData()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF8F6]">
      <WaitlistNavbar />

      {/* Hero Section - Radial gradient atmosphere */}
      <section className="flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100/50 via-[#FDF8F6] to-[#FDF8F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          {status === 'success' ? (
            <SuccessState />
          ) : (
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Text + Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-grey-900 tracking-tight leading-tight">
                  The Sanctuary for
                  <span className="text-orange-600 block">Card Collectors</span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-grey-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Manage your portfolio, predict grades with AI, and access sealed product at MSRP.{' '}
                  <span className="font-medium text-grey-700">The era of the scalper is over.</span>
                </p>

                {/* Email Form - Fused Command Bar Style */}
                <form onSubmit={handleSubmit} className="mt-10 max-w-md mx-auto lg:mx-0">
                  {/* Unified Command Bar Container */}
                  <div className="bg-white p-1.5 rounded-full shadow-lg border border-gray-100 flex items-center">
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      disabled={status === 'submitting'}
                      className="flex-1 h-10 px-4 bg-transparent border-none text-grey-900 placeholder-grey-400 focus:outline-none disabled:opacity-50 text-base"
                    />
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="h-10 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {status === 'submitting' ? '...' : 'Join & Secure Status'}
                    </button>
                  </div>

                  {status === 'error' && (
                    <p className="mt-3 text-sm text-red-600" role="alert">
                      {errorMessage}
                    </p>
                  )}
                </form>

                <p className="mt-4 text-sm text-grey-500">
                  Join early and be a founding member. No spam, ever.
                </p>
              </motion.div>

              {/* Right: Dashboard Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <DashboardMockup cardData={cardData} />
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Card Preview (shown below hero on mobile) */}
      {status !== 'success' && (
        <div className="lg:hidden px-4 pb-12 bg-gradient-to-b from-[#FDF8F6] to-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-xs mx-auto"
          >
            <MobileCardPreview cardData={cardData} />
          </motion.div>
        </div>
      )}

      {/* Feature Grid (Bento Box) */}
      <FeatureGrid />

      {/* Easter Egg Footer - Styled as Pill Badge */}
      <footer className="bg-[#FDF8F6] py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center bg-orange-50 text-orange-800 px-4 py-2 rounded-full text-sm font-medium border border-orange-100">
            ✨ Founding Members get early store access and an exclusive portfolio badge.
          </span>
        </motion.div>
      </footer>
    </div>
  )
}

/**
 * Success State - Shown after successful email submission
 */
function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-8">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold text-grey-900 mb-4">
        You&apos;re on the list!
      </h2>
      <p className="text-lg text-grey-600 max-w-md mx-auto">
        We&apos;ll notify you when Slab Advisor is ready. Check your inbox for a welcome message.
      </p>
    </motion.div>
  )
}

interface DashboardMockupProps {
  cardData: FeaturedCardData
}

/**
 * Dashboard Mockup - Floating card display with grade prediction badge
 * Shows real PSA 10 pricing data with gain indicator
 */
function DashboardMockup({ cardData }: DashboardMockupProps) {
  return (
    <div className="relative">
      {/* Floating animation container */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        {/* Dashboard frame - Dark mode with studio lighting */}
        <div className="bg-gray-900 rounded-3xl p-6 shadow-[0_20px_50px_-12px_rgba(249,115,22,0.3)] border border-white/10 border-t-white/20">
          {/* Card display area */}
          <div className="relative aspect-[3/4] max-w-[280px] mx-auto">
            <Image
              src={FEATURED_CARD_IMAGE}
              alt="Mega Charizard X ex - Special Illustration Rare"
              fill
              className="object-contain rounded-xl"
              priority
              sizes="280px"
            />

            {/* Grade Prediction Badge - PSA 10 */}
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl shadow-lg">
              <div className="text-xs font-medium opacity-90">Grade Prediction</div>
              <div className="text-2xl font-bold tracking-tight">10</div>
            </div>
          </div>

          {/* Stats bar with real pricing data */}
          <div className="mt-8 flex justify-between text-center">
            <div>
              <div className="text-xs text-gray-400">PSA 10 Value</div>
              <div className="text-lg font-semibold text-white">
                ${cardData.psa10Price.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Raw → Graded</div>
              <div className="text-lg font-semibold text-green-400 flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +{cardData.gainPercent}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Rarity</div>
              <div className="text-lg font-semibold text-orange-400">SIR</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Background decorative elements - Enhanced glow */}
      <div className="absolute -z-10 top-8 -right-8 w-72 h-72 bg-orange-300 rounded-full opacity-25 blur-3xl" />
      <div className="absolute -z-10 -bottom-8 -left-8 w-56 h-56 bg-orange-400 rounded-full opacity-20 blur-3xl" />
    </div>
  )
}

interface MobileCardPreviewProps {
  cardData: FeaturedCardData
}

/**
 * Mobile Card Preview - Simplified card display for mobile devices
 * Shows PSA 10 grade and gain percentage
 */
function MobileCardPreview({ cardData }: MobileCardPreviewProps) {
  return (
    <div className="relative">
      <div className="bg-gray-900 rounded-2xl p-4 shadow-[0_15px_40px_-10px_rgba(249,115,22,0.25)] border border-white/10 border-t-white/20">
        <div className="relative aspect-[3/4] max-w-[200px] mx-auto">
          <Image
            src={FEATURED_CARD_IMAGE}
            alt="Mega Charizard X ex - Special Illustration Rare"
            fill
            className="object-contain rounded-lg"
            priority
            sizes="200px"
          />
        </div>
        {/* Grade Badge with gain */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="text-center">
            <span className="text-xs text-gray-400 block">PSA 10</span>
            <span className="bg-orange-600 text-white font-bold px-3 py-1 rounded-full text-sm">
              ${cardData.psa10Price.toLocaleString()}
            </span>
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-400 block">Gain</span>
            <span className="text-green-400 font-bold text-sm flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +{cardData.gainPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Feature Grid - Bento box style feature cards
 */
function FeatureGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const features = [
    {
      icon: Sparkles,
      title: 'Grade & Track',
      description: 'Instant AI pre-grading estimates and real-time portfolio valuation.',
      accent: false,
    },
    {
      icon: BookOpen,
      title: 'Curate & Share',
      description: 'Build digital binders and share your collection with the world.',
      accent: false,
    },
    {
      icon: Shield,
      title: 'The Members Vault',
      description: 'Anti-scalper protection. Exclusive access to sealed product drops at MSRP.',
      accent: true,
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{
                duration: 0.5,
                delay: index * 0.15,
                ease: 'easeOut',
              }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  accent: boolean
}

/**
 * Feature Card - Individual bento box card
 * Vault card has soft orange wash with softer border
 */
function FeatureCard({ icon: Icon, title, description, accent }: FeatureCardProps) {
  return (
    <div
      className={`
        relative rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-full
        ${accent
          ? 'bg-orange-50/80 border-2 border-orange-200'
          : 'bg-white border border-grey-100'
        }
      `}
    >
      {/* Members Only Badge - Only on accent card */}
      {accent && (
        <div className="absolute -top-3 right-4">
          <span className="bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md">
            Members Only
          </span>
        </div>
      )}

      {/* Icon with rounded-square background */}
      <div
        className={`
          inline-flex items-center justify-center p-3 rounded-xl mb-6
          ${accent ? 'bg-orange-100 text-orange-600' : 'bg-grey-100 text-grey-700'}
        `}
      >
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-xl font-bold text-grey-900 mb-3">{title}</h3>
      <p className="text-grey-600 leading-relaxed">{description}</p>
    </div>
  )
}
