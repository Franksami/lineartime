'use client'

/**
 * Unified Theme Hook
 * Provides access to theme utilities for all UI libraries
 */

import { useEffect, useState } from 'react'
import { getCurrentTheme, createMantineTheme, createAntdTheme, createChakraTheme, BaseTheme } from '@/lib/theme/unified-theme'
import { useSettingsContext } from '@/contexts/SettingsContext'

export function useUnifiedTheme() {
  const { settings } = useSettingsContext()
  const [baseTheme, setBaseTheme] = useState<BaseTheme>(() => getCurrentTheme())
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
    setBaseTheme(getCurrentTheme())
  }, [])

  // Update theme when settings change
  useEffect(() => {
    if (isClient) {
      const updateTheme = () => {
        setBaseTheme(getCurrentTheme())
      }

      // Update immediately
      updateTheme()

      // Set up observer for class changes on document element
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'class' &&
            mutation.target === document.documentElement
          ) {
            setTimeout(updateTheme, 0)
          }
        })
      })

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })

      return () => observer.disconnect()
    }
  }, [isClient, settings.appearance.theme, settings.appearance.colorScheme])

  // Memoized theme configurations
  const themeConfigs = {
    mantine: createMantineTheme(baseTheme),
    antd: createAntdTheme(baseTheme),
    chakra: createChakraTheme(baseTheme),
    base: baseTheme,
  }

  // Utility functions
  const utils = {
    // Get current theme mode
    getThemeMode: () => {
      if (!isClient) return 'light'
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    },

    // Check if high contrast mode is enabled
    isHighContrast: () => {
      if (!isClient) return false
      return document.documentElement.classList.contains('high-contrast')
    },

    // Check if reduced motion is preferred
    prefersReducedMotion: () => {
      if (!isClient) return false
      return (
        document.documentElement.classList.contains('reduce-motion') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
    },

    // Get color value from CSS variable
    getColor: (colorVar: keyof BaseTheme['colors']) => {
      return baseTheme.colors[colorVar]
    },

    // Convert theme colors to library-specific formats
    toMantineColor: (colorVar: keyof BaseTheme['colors']) => {
      // Return appropriate Mantine color name or hex
      return baseTheme.colors[colorVar]
    },

    toAntdColor: (colorVar: keyof BaseTheme['colors']) => {
      // Convert to hex format for Ant Design
      const oklch = baseTheme.colors[colorVar]
      if (!oklch.startsWith('oklch(')) return '#1677ff'
      
      // Simple conversion - in production you'd want proper OKLCH to hex
      const match = oklch.match(/oklch\(([0-9.]+)/)
      if (!match) return '#1677ff'
      
      const lightness = parseFloat(match[1])
      const gray = Math.round(lightness * 255)
      return `#${gray.toString(16).padStart(2, '0').repeat(3)}`
    },

    toChakraColor: (colorVar: keyof BaseTheme['colors']) => {
      return baseTheme.colors[colorVar]
    },
  }

  return {
    ...themeConfigs,
    utils,
    isClient,
  }
}

// Helper hook for component-specific theming
export function useComponentTheme(library: 'mantine' | 'antd' | 'chakra' | 'shadcn' = 'shadcn') {
  const { mantine, antd, chakra, base, utils, isClient } = useUnifiedTheme()

  const getTheme = () => {
    switch (library) {
      case 'mantine':
        return mantine
      case 'antd':
        return antd
      case 'chakra':
        return chakra
      default:
        return base
    }
  }

  return {
    theme: getTheme(),
    baseTheme: base,
    utils,
    isClient,
  }
}

export default useUnifiedTheme