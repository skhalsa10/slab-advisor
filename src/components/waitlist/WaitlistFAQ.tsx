'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    question: "When will the app launch?",
    answer: "We are currently in private beta and actively onboarding founding members. By joining the waitlist, you'll secure your spot and be notified as soon as we open the next wave of invitations."
  },
  {
    question: "What is MSRP access?",
    answer: "As a founding member, you'll get exclusive access to our members-only store where we secure allocation of new sealed product cases, passing them directly to our community at or near MSRP. No scalper pricing, ever."
  },
  {
    question: "Is it really free to join?",
    answer: "Yes, joining the waitlist to become a foundational member is 100% free, and managing your card portfolio will always remain free. However, core features will require a membership. You will need a membership for exclusive access to our members-only, scalper-free store. Other features like AI grading will also require a membership, though we are currently finalizing the complete pricing structure."
  },
  {
    question: "How does the AI grading work?",
    answer: "You simply take a clear photo of your raw card. Our computer vision model analyzes centering, corners, edges, and surface conditions against millions of previously graded cards to estimate what grade it would receive from PSA."
  }
]

export default function WaitlistFAQ() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FDF8F6]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-grey-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-grey-600">Everything you need to know about Slab Advisor.</p>
        </div>
        
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white border border-grey-200 rounded-2xl overflow-hidden hover:border-orange-200 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="text-lg font-semibold text-grey-900 pr-8">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-grey-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 text-grey-600 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
