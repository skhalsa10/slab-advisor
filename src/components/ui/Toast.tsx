'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
  duration?: number // default: 3000ms for success/info, 5000ms for error
}

export default function Toast({ type, message, onClose, duration }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Calculate duration based on type if not provided
  const effectiveDuration = duration ?? (type === 'error' ? 5000 : 3000)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // Auto-dismiss
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        onClose()
      }, 200)
    }, effectiveDuration)

    return () => clearTimeout(timer)
  }, [effectiveDuration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    // Wait for exit animation to complete
    setTimeout(() => {
      onClose()
    }, 200)
  }

  // Style configurations per type
  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      text: 'text-red-800'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-800'
    }
  }

  const styles = typeStyles[type]

  // Icons per type
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-3
        px-4 py-3
        rounded-lg border shadow-lg
        transition-all duration-200 ease-out
        ${styles.bg}
        ${isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
        }
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${styles.icon}`}>
        {icons[type]}
      </div>

      {/* Message */}
      <p className={`text-sm font-medium ${styles.text}`}>
        {message}
      </p>

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`
          flex-shrink-0 ml-2 p-1 rounded-full
          hover:bg-black/5 transition-colors
          ${styles.text}
        `}
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
