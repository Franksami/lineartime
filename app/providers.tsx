'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';
import { LiveRegionProvider } from '@/components/accessibility/LiveRegion';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'https://gentle-seagull-346.convex.cloud');

export function Providers({ children }: { children: ReactNode }) {
  // Temporarily disable ClerkProvider for development
  // Uncomment when you have valid Clerk keys
  return (
    // <ClerkProvider>
      <ConvexProvider client={convex}>
        <LiveRegionProvider>
          {children}
        </LiveRegionProvider>
      </ConvexProvider>
    // </ClerkProvider>
  );
}