'use client';

import { LiveRegionProvider } from '@/components/accessibility/LiveRegion';
// import { UnifiedThemeProvider } from '@/components/providers/UnifiedThemeProvider';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { Toaster } from '@/components/ui/sonner';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import type { ReactNode } from 'react';

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || 'https://gentle-seagull-346.convex.cloud'
);

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
  );
}
