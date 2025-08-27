import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

// Initialize next-intl plugin
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Configure external packages for server components
  serverExternalPackages: ['@toast-ui/calendar', '@toast-ui/react-calendar'],
  
  // Configure Turbopack
  turbopack: {
    root: '/Users/goodfranklin/lineartime'
  },

  // Experimental optimizations
  experimental: {
    // Memory optimizations for better build performance
    webpackMemoryOptimizations: true,
    
    // Optimize package imports for better bundle size
    optimizePackageImports: [
      // UI libraries that benefit from tree-shaking
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@tabler/icons-react',
      'framer-motion',
      'react-dnd',
      'tui-calendar',
      'tui-time-picker',
      'react-syntax-highlighter',
      'react-window'
    ],
  },
  
  // Temporarily ignore TypeScript errors during testing phase
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Also ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure image domains for external images
  images: {
    domains: ['images.unsplash.com'],
  },

  // Improve webpack configuration for better SSR support
  webpack: (config, { isServer }) => {
    // Handle Toast UI Calendar SSR issues
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    // Ensure proper handling of external modules
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push('@toast-ui/calendar', '@toast-ui/react-calendar')
    }

    return config
  },

  // Configure headers for better static file serving
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default withNextIntl(withBundleAnalyzer(nextConfig));
