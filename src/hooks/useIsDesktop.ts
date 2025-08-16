import { useState, useEffect } from 'react'

/**
 * Custom hook to detect if the viewport is desktop size
 * @param breakpoint - The minimum width in pixels to consider as desktop (default: 1024px for lg breakpoint)
 * @returns boolean indicating if viewport is desktop size
 */
export function useIsDesktop(breakpoint: number = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= breakpoint)
    }
    
    // Check initial state
    checkIsDesktop()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsDesktop)
    
    // Cleanup: remove event listener on unmount
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [breakpoint])

  return isDesktop
}

/**
 * Custom hook to detect viewport size against Tailwind breakpoints
 * @returns object with boolean flags for each breakpoint
 */
export function useBreakpoint() {
  const [breakpoints, setBreakpoints] = useState({
    sm: false,  // 640px
    md: false,  // 768px
    lg: false,  // 1024px
    xl: false,  // 1280px
    '2xl': false // 1536px
  })

  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth
      setBreakpoints({
        sm: width >= 640,
        md: width >= 768,
        lg: width >= 1024,
        xl: width >= 1280,
        '2xl': width >= 1536
      })
    }
    
    // Check initial state
    checkBreakpoints()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkBreakpoints)
    
    // Cleanup: remove event listener on unmount
    return () => window.removeEventListener('resize', checkBreakpoints)
  }, [])

  return breakpoints
}

/**
 * Custom hook to get current viewport size
 * @returns object with width and height
 */
export function useViewportSize() {
  const [size, setSize] = useState({
    width: 0,
    height: 0
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    // Set initial size
    handleResize()
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}