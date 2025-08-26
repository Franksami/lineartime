'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  BarChart3,
  Brain,
  Palette,
  Settings,
  CreditCard,
  Users,
  Zap,
  Globe,
  Smartphone,
  Sparkles,
  ChevronRight,
  Home
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string
  isNew?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Calendar',
    href: '/dashboard',
    icon: Calendar,
    description: 'Your year-at-a-glance timeline',
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Productivity insights and metrics',
  },
  {
    name: 'AI Assistant',
    href: '/dashboard/ai',
    icon: Brain,
    description: 'Smart scheduling and suggestions',
    badge: 'Pro',
  },
  {
    name: 'Themes',
    href: '/dashboard/themes',
    icon: Palette,
    description: 'Customize your calendar appearance',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'App preferences and integrations',
  },
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    description: 'Manage your subscription',
  },
]

const featureItems: NavigationItem[] = [
  {
    name: 'PWA Features',
    href: '/test-pwa',
    icon: Smartphone,
    description: 'Progressive web app capabilities',
    isNew: true,
  },
  {
    name: 'Team Collaboration',
    href: '/dashboard/team',
    icon: Users,
    description: 'Share and collaborate on calendars',
    badge: 'Coming Soon',
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-card border-r border-border overflow-y-auto">
        {/* Header */}
        <div className="flex items-center flex-shrink-0 px-4 py-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">LinearTime</h1>
              <p className="text-xs text-muted-foreground">Life is bigger than a week</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* User Info */}
        <div className="flex items-center px-4 py-3 space-x-3">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10"
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.fullName || user?.firstName || 'User'}
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                Free Plan
              </Badge>
              <Badge variant="outline" className="text-xs">
                100/100 events
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex-1 px-2 py-4 space-y-2">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-12 px-3',
                    isActive(item.href) && 'bg-secondary text-secondary-foreground font-medium'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.badge && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {item.badge}
                    </Badge>
                  )}
                  {item.isNew && (
                    <Badge className="text-xs ml-2 bg-primary">
                      New
                    </Badge>
                  )}
                  {isActive(item.href) && (
                    <ChevronRight className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </Link>
            ))}
          </div>

          <Separator />

          {/* Features Section */}
          <div className="pt-4">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Features
              </h3>
            </div>
            <div className="space-y-1">
              {featureItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-12 px-3',
                      isActive(item.href) && 'bg-secondary text-secondary-foreground font-medium'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {item.badge && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {item.badge}
                      </Badge>
                    )}
                    {item.isNew && (
                      <Badge className="text-xs ml-2 bg-primary">
                        New
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Bottom Actions */}
        <div className="flex-shrink-0 px-4 py-4 space-y-2">
          {/* Upgrade Prompt */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Unlock AI scheduling, unlimited events, and advanced analytics.
            </p>
            <Button size="sm" className="w-full" asChild>
              <Link href="/dashboard/billing">
                Upgrade Now
              </Link>
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/landing">
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="mailto:support@lineartime.com">
                Help
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}