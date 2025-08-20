import Link from 'next/link'
import { GlassButton } from '@/components/glass'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="text-center space-y-8 p-8 relative z-10">
        <div className="glass rounded-glass p-12 max-w-2xl mx-auto backdrop-blur-xl border border-glass-border shadow-2xl">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LinearTime
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Experience time as a continuous flow, not fragmented blocks.
            The world&apos;s first true linear calendar.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-in">
              <GlassButton size="lg" variant="primary">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </GlassButton>
            </Link>
            <Link href="/dashboard">
              <GlassButton size="lg" variant="secondary">
                View Demo
              </GlassButton>
            </Link>
          </div>
        </div>
        <div className="glass rounded-glass p-6 max-w-md mx-auto">
          <p className="text-sm text-oklch-gray-400">
            🚧 Linear timeline implementation in progress
          </p>
        </div>
      </div>
    </div>
  )
}