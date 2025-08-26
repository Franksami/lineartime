/**
 * Client-side only utilities for handling SSR issues
 * Use these utilities to safely access browser APIs without server-side errors
 */

/**
 * Safely access localStorage with fallback for SSR
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null
    }
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('localStorage.getItem failed:', error)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false
    }
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn('localStorage.setItem failed:', error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false
    }
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error)
      return false
    }
  }
}

/**
 * Safely access sessionStorage with fallback for SSR
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return null
    }
    try {
      return sessionStorage.getItem(key)
    } catch (error) {
      console.warn('sessionStorage.getItem failed:', error)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return false
    }
    try {
      sessionStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn('sessionStorage.setItem failed:', error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return false
    }
    try {
      sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('sessionStorage.removeItem failed:', error)
      return false
    }
  }
}

/**
 * Check if code is running on client-side
 */
export const isClient = (): boolean => {
  return typeof window !== 'undefined'
}

/**
 * Check if code is running on server-side
 */
export const isServer = (): boolean => {
  return typeof window === 'undefined'
}

/**
 * Safely access window object with fallback for SSR
 */
export const safeWindow = (): Window | null => {
  return typeof window !== 'undefined' ? window : null
}

/**
 * Safely access document object with fallback for SSR
 */
export const safeDocument = (): Document | null => {
  return typeof document !== 'undefined' ? document : null
}

/**
 * Hook to check if component has mounted on client-side
 */
export const useIsClient = () => {
  const [isClientSide, setIsClientSide] = React.useState(false)

  React.useEffect(() => {
    setIsClientSide(true)
  }, [])

  return isClientSide
}

// We need to import React for the hook
import * as React from 'react'