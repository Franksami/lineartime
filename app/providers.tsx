'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { ReactNode } from 'react';
import { LiveRegionProvider } from '@/components/accessibility/LiveRegion';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
// import { UnifiedThemeProvider } from '@/components/providers/UnifiedThemeProvider';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { Toaster } from '@/components/ui/sonner';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'https://gentle-seagull-346.convex.cloud')

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <PWAProvider>
          <SettingsProvider>
            <ThemeProvider>
              {/* <UnifiedThemeProvider> */}
                <LiveRegionProvider>
                  {children}
                  <Toaster />
                </LiveRegionProvider>
              {/* </UnifiedThemeProvider> */}
            </ThemeProvider>
          </SettingsProvider>
        </PWAProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}