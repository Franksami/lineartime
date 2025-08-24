'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sparkles, TrendingUp, Tag, Palette, Smartphone, Brain, Zap, Calendar, BarChart3, Settings, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TestAllFeaturesPage() {
  const router = useRouter()

  const features = [
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Comprehensive calendar insights with productivity metrics, event breakdowns, and AI-powered recommendations.',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      link: '/analytics',
      status: 'Live',
      highlights: [
        'Event category breakdowns',
        'Monthly productivity tracking',
        'AI-powered insights',
        'Export functionality'
      ]
    },
    {
      id: 'categories',
      title: 'Enhanced Categories & Tags',
      description: 'Advanced event organization with 7 category types, priority levels, and smart tagging system.',
      icon: Tag,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      link: '/test-category-tags',
      status: 'Live',
      highlights: [
        '7 category types with colors',
        '5 priority levels',
        'Custom tag creation',
        'Visual organization'
      ]
    },
    {
      id: 'themes',
      title: 'Advanced Theme System',
      description: 'Custom theme creator with live preview, preset themes, and accessibility-focused design options.',
      icon: Palette,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      link: '/themes',
      status: 'Live',
      highlights: [
        'Custom theme creator',
        'Live preview',
        'Accessibility themes',
        'Persistent storage'
      ]
    },
    {
      id: 'pwa',
      title: 'PWA Features',
      description: 'Progressive Web App capabilities with offline support, push notifications, and native app experience.',
      icon: Smartphone,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      link: '/test-pwa',
      status: 'Live',
      highlights: [
        'Offline functionality',
        'Install prompts',
        'Push notifications',
        'Background sync'
      ]
    },
    {
      id: 'ai-scheduling',
      title: 'AI Scheduling Engine',
      description: 'Intelligent event placement with conflict resolution, focus time protection, and smart suggestions.',
      icon: Brain,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      link: '/test-ai-scheduling',
      status: 'Live',
      highlights: [
        'Smart time slot finding',
        'Conflict resolution',
        'Focus time protection',
        'Group availability'
      ]
    },
    {
      id: 'enhanced-calendar',
      title: 'Enhanced Calendar',
      description: 'Performance monitoring, AI-enhanced drag & drop, and advanced calendar interactions.',
      icon: Calendar,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
      link: '/test-enhanced-calendar',
      status: 'Live',
      highlights: [
        'Performance monitoring',
        'AI drag & drop',
        'Real-time metrics',
        'Enhanced interactions'
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Live': return 'bg-green-100 text-green-800'
      case 'Beta': return 'bg-yellow-100 text-yellow-800'
      case 'Coming Soon': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">All Enhanced Features</h1>
                  <p className="text-muted-foreground">Experience the complete LinearTime enhancement suite</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Zap className="w-3 h-3 mr-1" />
                45 New Components
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">45</div>
              <div className="text-sm text-muted-foreground">New Components</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">6</div>
              <div className="text-sm text-muted-foreground">Major Features</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-muted-foreground">Implementation</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features.map((feature) => {
            const IconComponent = feature.icon
            return (
              <Card key={feature.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <Badge className={getStatusColor(feature.status)}>
                      {feature.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {feature.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-60" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                  
                  <Link href={feature.link}>
                    <Button className="w-full group-hover:bg-primary/90 transition-colors">
                      <IconComponent className="w-4 h-4 mr-2" />
                      Try {feature.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quick Analytics
              </CardTitle>
              <CardDescription>
                Jump straight to calendar insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Calendar Analytics
                </Button>
              </Link>
              <Link href="/test-category-tags">
                <Button variant="outline" className="w-full justify-start">
                  <Tag className="w-4 h-4 mr-2" />
                  Test Category System
                </Button>
              </Link>
              <Link href="/themes">
                <Button variant="outline" className="w-full justify-start">
                  <Palette className="w-4 h-4 mr-2" />
                  Customize Themes
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Features
              </CardTitle>
              <CardDescription>
                Explore cutting-edge capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/test-pwa">
                <Button variant="outline" className="w-full justify-start">
                  <Smartphone className="w-4 h-4 mr-2" />
                  PWA Features
                </Button>
              </Link>
              <Link href="/test-ai-scheduling">
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Scheduling
                </Button>
              </Link>
              <Link href="/test-enhanced-calendar">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Enhanced Calendar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              What We've Built
            </CardTitle>
            <CardDescription>
              Complete feature implementation summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-600">📊 Analytics & Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Calendar analytics dashboard</li>
                  <li>• Event category breakdowns</li>
                  <li>• Monthly productivity metrics</li>
                  <li>• AI-powered insights</li>
                  <li>• Export functionality</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-600">🏷️ Organization</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 7 enhanced categories</li>
                  <li>• 5 priority levels</li>
                  <li>• Custom tag system</li>
                  <li>• Visual color coding</li>
                  <li>• Smart organization</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-pink-600">🎨 Customization</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Custom theme creator</li>
                  <li>• Live preview</li>
                  <li>• Accessibility themes</li>
                  <li>• Persistent storage</li>
                  <li>• Export/import themes</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-green-600">📱 PWA Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Offline functionality</li>
                  <li>• Install prompts</li>
                  <li>• Push notifications</li>
                  <li>• Background sync</li>
                  <li>• Native app experience</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-600">🤖 AI Capabilities</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Smart scheduling engine</li>
                  <li>• Conflict resolution</li>
                  <li>• Focus time protection</li>
                  <li>• Group availability</li>
                  <li>• Natural language parsing</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-cyan-600">⚡ Performance</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time monitoring</li>
                  <li>• Memory optimization</li>
                  <li>• Render performance</li>
                  <li>• Object pooling</li>
                  <li>• FPS tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center py-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold">Ready to Experience LinearTime Enhanced?</h2>
            <p className="text-muted-foreground">
              All features are live and ready to use. Start exploring the enhanced calendar experience with 45 new components and AI-powered capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Calendar className="w-5 h-5 mr-2" />
                  Open Main Calendar
                </Button>
              </Link>
              <Link href="/analytics">
                <Button size="lg" variant="outline">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
