// context/ScreenSizeContext.tsx
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Breakpoints = {
  is2xl: boolean // 1536px+
  isXl: boolean  // 1280px+
  isLg: boolean  // 1024px+
  isMd: boolean  // 768px+
  isSm: boolean  // 640px+
  isXs: boolean  // <640px
  currentWidth: number
}

const ScreenSizeContext = createContext<Breakpoints | undefined>(undefined)

export function ScreenSizeProvider({ children }: { children: ReactNode }) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    // Debounce function to limit how often we handle resize events
    const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms: number) => {
      let timer: NodeJS.Timeout
      return (...args: T) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), ms)
      }
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Debounced version runs 100ms after last resize event
    const debouncedHandleResize = debounce(handleResize, 100)

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener('resize', debouncedHandleResize)

    // Clean up
    return () => window.removeEventListener('resize', debouncedHandleResize)
  }, [])

  const breakpoints: Breakpoints = {
    is2xl: windowSize.width >= 1536,
    isXl: windowSize.width >= 1280,
    isLg: windowSize.width >= 1024,
    isMd: windowSize.width >= 768,
    isSm: windowSize.width >= 640,
    isXs: windowSize.width < 640,
    currentWidth: windowSize.width
  }

  return (
    <ScreenSizeContext.Provider value={breakpoints}>
      {children}
    </ScreenSizeContext.Provider>
  )
}

export function useScreenSize() {
  const context = useContext(ScreenSizeContext)
  if (context === undefined) {
    throw new Error('useScreenSize must be used within a ScreenSizeProvider')
  }
  return context
}