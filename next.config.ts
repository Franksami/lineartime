import type { NextConfig } from "next";

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

const nextConfig: NextConfig = {
  // Configure external packages for server components
  serverExternalPackages: ['@toast-ui/calendar', '@toast-ui/react-calendar'],
  
  // Configure Turbopack (updated path for organized structure)
  turbopack: {
    root: '/Users/goodfranklin/Development/Active-Projects/lineartime'
  },

  // Experimental optimizations
  experimental: {
    // Memory optimizations for better build performance
    webpackMemoryOptimizations: true,
    
    // CSS optimization (requires additional setup)
    optimizeCss: true,
    
    // Scroll restoration
    scrollRestoration: true,
    
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
  
  // Production optimizations
  compress: true, // Enable gzip compression
  productionBrowserSourceMaps: false, // Disable source maps in production
  // swcMinify removed - deprecated in Next.js 15.5.0 (SWC minification is now default)
  
  // Temporarily ignore TypeScript errors during testing phase
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Also ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure image optimization
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'], // Modern image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Responsive sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon sizes
    minimumCacheTTL: 31536000, // 1 year cache
  },

  // Improve webpack configuration for better SSR support
  webpack: (config, { isServer, dev }) => {
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

    // Add performance budgets for production builds
    if (!dev && !isServer) {
      config.performance = {
        hints: process.env.CI ? 'error' : 'warning', // Error in CI, warning in local
        maxAssetSize: 250000, // 250KB per asset
        maxEntrypointSize: 400000, // 400KB per entry point
        assetFilter: (assetFilename: string) => {
          // Only check JS and CSS files, ignore source maps and licenses
          return !/\.(map|LICENSE|txt)/.test(assetFilename) && /\.(js|css)$/.test(assetFilename);
        }
      };
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

export default withBundleAnalyzer(nextConfig);
