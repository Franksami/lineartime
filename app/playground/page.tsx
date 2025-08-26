'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Playground - Zero-risk testing environment for UI/UX components
 * Phase 0 foundation setup for component validation
 */

const playgroundRoutes = [
  {
    path: '/playground/shell',
    title: 'Shell Navigation',
    description: 'shadcn Sidebar with AppShell architecture',
    status: 'ready',
    features: ['Collapsible sidebar', 'Mobile sheet fallback', 'Keyboard shortcuts']
  },
  {
    path: '/playground/command',
    title: 'Command Palette',
    description: 'KBar integration with command registry',
    status: 'ready', 
    features: ['Action-based API', 'Keyboard shortcuts', 'Search functionality']
  },
  {
    path: '/playground/contexts',
    title: 'SuperContext System',
    description: '5-context architecture validation',
    status: 'ready',
    features: ['UI Context', 'Events Context', 'AI Context', 'Notifications Context', 'Calendar Context']
  },
  {
    path: '/playground/onboarding',
    title: 'Onboarding Flow',
    description: '4-step progressive onboarding experience',
    status: 'ready',
    features: ['Welcome screen', 'Provider setup', 'Preferences', 'Interactive tutorial']
  },
  {
    path: '/playground/ai',
    title: 'AI Integration',
    description: 'Vercel AI SDK v5 features',
    status: 'pending',
    features: ['Natural language parsing', 'Smart suggestions', 'AI assistant']
  }
]

const performanceMetrics = {
  bundleSize: '3.2MB target',
  loadTime: '<2s goal',
  memoryUsage: '<100MB limit',
  accessibility: 'WCAG 2.1 AA'
}

export default function PlaygroundPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          UI/UX Playground
        </h1>
        <p className="text-muted-foreground">
          Zero-risk testing environment for LinearTime UI/UX transformation components
        </p>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Performance Targets
          </CardTitle>
          <CardDescription>
            Success metrics for UI/UX transformation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(performanceMetrics).map(([key, value]) => (
              <div key={key} className="text-center p-4 border rounded-lg">
                <div className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-lg font-bold mt-1">{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Playground Routes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {playgroundRoutes.map((route) => (
          <Card key={route.path} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{route.title}</CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ 
                  route.status === 'ready' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {route.status}
                </span>
              </div>
              <CardDescription>{route.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Features:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {route.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {route.status === 'ready' ? (
                <Link href={route.path}>
                  <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Test Component
                  </button>
                </Link>
              ) : (
                <button 
                  disabled 
                  className="w-full bg-muted text-muted-foreground px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                >
                  Coming Soon
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Strategy</CardTitle>
          <CardDescription>
            Best-of-breed approach with zero-risk validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Component Selection</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• KBar: 16.5% better than cmdk</li>
                <li>• shadcn Sidebar: Best mobile support</li>
                <li>• Framer Motion: Onboarding animations</li>
                <li>• 5-Context SuperContext: State management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Validation Process</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Playground spike testing</li>
                <li>• Performance benchmarking</li>
                <li>• Accessibility validation</li>
                <li>• Cross-browser compatibility</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Migration Strategy</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Phase 0: Playground
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Phase 1: Context
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                Phase 2: Navigation
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Phase 3: Onboarding
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                Phase 4: AI Integration
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back to Dashboard */}
      <div className="flex justify-center pt-6">
        <Link href="/dashboard">
          <button className="px-6 py-2 border border-border hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors">
            ← Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  )
}