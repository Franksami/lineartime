'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Star,
  Zap,
  Globe,
  Shield,
  Palette,
  Play,
  Sparkles,
  User,
  Clock,
  Target,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

/**
 * Onboarding Flow Playground - 4-step progressive onboarding experience
 * Phase 3 of UI/UX transformation with Motion Calendar inspiration
 */

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
  optional?: boolean
}

interface OnboardingStepProps {
  onNext: () => void
  onPrev: () => void
  onSkip?: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepProgress: number
}

interface CalendarProvider {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  features: string[]
  popular?: boolean
  setup: 'oauth' | 'caldav' | 'credentials'
}

interface UserPreference {
  id: string
  category: string
  title: string
  description: string
  type: 'toggle' | 'select' | 'slider'
  defaultValue: any
  options?: Array<{ value: any; label: string }>
}

// Calendar providers data
const providers: CalendarProvider[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    icon: Globe,
    description: 'Most popular choice for personal and business calendars',
    features: ['Real-time sync', 'Smart notifications', 'Meeting links', 'Recurring events'],
    popular: true,
    setup: 'oauth'
  },
  {
    id: 'microsoft',
    name: 'Microsoft Outlook',
    icon: Shield,
    description: 'Enterprise-grade with Teams integration',
    features: ['Enterprise security', 'Teams integration', 'Advanced scheduling', 'Global availability'],
    popular: true,
    setup: 'oauth'
  },
  {
    id: 'apple',
    name: 'Apple iCloud',
    icon: Star,
    description: 'Native Apple ecosystem integration',
    features: ['iCloud sync', 'Siri integration', 'Apple device sync', 'Privacy focused'],
    setup: 'caldav'
  },
  {
    id: 'caldav',
    name: 'Generic CalDAV',
    icon: Zap,
    description: 'Universal support for any CalDAV server',
    features: ['Universal compatibility', 'Self-hosted support', 'Open standards', 'Custom servers'],
    setup: 'caldav'
  }
]

// User preferences data
const preferences: UserPreference[] = [
  {
    id: 'theme',
    category: 'Appearance',
    title: 'Theme Preference',
    description: 'Choose your preferred color scheme',
    type: 'select',
    defaultValue: 'system',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' }
    ]
  },
  {
    id: 'weekStart',
    category: 'Calendar',
    title: 'Week Start',
    description: 'First day of the week',
    type: 'select',
    defaultValue: 0,
    options: [
      { value: 0, label: 'Sunday' },
      { value: 1, label: 'Monday' }
    ]
  },
  {
    id: 'timeFormat',
    category: 'Calendar',
    title: '24-Hour Format',
    description: 'Use 24-hour time format',
    type: 'toggle',
    defaultValue: false
  },
  {
    id: 'notifications',
    category: 'Notifications',
    title: 'Smart Notifications',
    description: 'AI-powered notification optimization',
    type: 'toggle',
    defaultValue: true
  },
  {
    id: 'focusMode',
    category: 'Productivity',
    title: 'Focus Time Protection',
    description: 'Block distractions during focus sessions',
    type: 'toggle',
    defaultValue: true
  },
  {
    id: 'aiSuggestions',
    category: 'AI Assistant',
    title: 'AI Scheduling',
    description: 'Intelligent scheduling suggestions',
    type: 'toggle',
    defaultValue: true
  }
]

// Step 1: Welcome Screen
function WelcomeStep({ onNext, isFirstStep, isLastStep, stepProgress }: OnboardingStepProps) {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-4"
      >
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
          <Calendar className="w-12 h-12 text-primary-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to LinearTime
          </h1>
          <p className="text-xl text-muted-foreground">
            Life is bigger than a week
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-3 text-left">
          {[
            {
              icon: Globe,
              title: '4 Calendar Providers',
              description: 'Google, Microsoft, Apple, and CalDAV support'
            },
            {
              icon: Zap,
              title: 'AI-Powered Scheduling',
              description: 'Intelligent suggestions and conflict resolution'
            },
            {
              icon: Star,
              title: '12-Month Timeline',
              description: 'Horizontal linear view of your entire year'
            }
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full">
                  <CardContent className="p-4 space-y-3">
                    <Icon className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Let's get you set up in just a few steps. This will take about 2 minutes.
          </p>
          <Button onClick={onNext} size="lg" className="px-8">
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// Step 2: Provider Setup
function ProviderStep({ onNext, onPrev, onSkip, isFirstStep, isLastStep, stepProgress }: OnboardingStepProps) {
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['google'])
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  
  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    )
  }

  const handleConnect = async (providerId: string) => {
    setConnectingProvider(providerId)
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500))
    setConnectingProvider(null)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Connect Your Calendars</h2>
        <p className="text-muted-foreground">
          Choose which calendar providers to sync with LinearTime
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => {
          const Icon = provider.icon
          const isSelected = selectedProviders.includes(provider.id)
          const isConnecting = connectingProvider === provider.id
          
          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected && "ring-2 ring-primary shadow-md"
                )}
                onClick={() => handleProviderToggle(provider.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-base">{provider.name}</CardTitle>
                        {provider.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 border-2 rounded-full transition-colors",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && (
                        <Check className="w-3 h-3 text-primary-foreground m-auto" />
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {provider.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <ul className="space-y-1">
                      {provider.features.map((feature) => (
                        <li key={feature} className="text-xs text-muted-foreground flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConnect(provider.id)
                          }}
                          disabled={isConnecting}
                          size="sm"
                          className="w-full"
                          variant={provider.setup === 'oauth' ? 'default' : 'outline'}
                        >
                          {isConnecting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              Connect {provider.name}
                              <ChevronRight className="ml-2 w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Selected {selectedProviders.length} of {providers.length} providers. 
          You can add more later in Settings.
        </p>
        
        <div className="flex gap-3 justify-center">
          <Button onClick={onSkip} variant="outline">
            Skip for Now
          </Button>
          <Button 
            onClick={onNext}
            disabled={selectedProviders.length === 0}
          >
            Continue
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Step 3: Preferences
function PreferencesStep({ onNext, onPrev, isFirstStep, isLastStep, stepProgress }: OnboardingStepProps) {
  const [userPrefs, setUserPrefs] = useState<Record<string, any>>(
    preferences.reduce((acc, pref) => {
      acc[pref.id] = pref.defaultValue
      return acc
    }, {} as Record<string, any>)
  )

  const updatePreference = (id: string, value: any) => {
    setUserPrefs(prev => ({ ...prev, [id]: value }))
  }

  const groupedPreferences = useMemo(() => {
    return preferences.reduce((acc, pref) => {
      if (!acc[pref.category]) {
        acc[pref.category] = []
      }
      acc[pref.category].push(pref)
      return acc
    }, {} as Record<string, UserPreference[]>)
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Customize Your Experience</h2>
        <p className="text-muted-foreground">
          Set up your preferences. You can change these anytime in Settings.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedPreferences).map(([category, prefs]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {prefs.map((pref) => (
                  <div key={pref.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{pref.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pref.description}
                        </p>
                      </div>
                      
                      <div className="min-w-0 flex-shrink-0 ml-4">
                        {pref.type === 'toggle' && (
                          <Switch
                            checked={userPrefs[pref.id]}
                            onCheckedChange={(checked) => updatePreference(pref.id, checked)}
                          />
                        )}
                        
                        {pref.type === 'select' && pref.options && (
                          <select
                            value={userPrefs[pref.id]}
                            onChange={(e) => updatePreference(pref.id, 
                              pref.id === 'weekStart' ? parseInt(e.target.value) : e.target.value
                            )}
                            className="px-3 py-1 border rounded-md bg-background"
                          >
                            {pref.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                    {pref !== prefs[prefs.length - 1] && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Button onClick={onPrev} variant="outline">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 4: Tutorial/Complete
function TutorialStep({ onNext, onPrev, isFirstStep, isLastStep, stepProgress }: OnboardingStepProps) {
  const [tutorialStarted, setTutorialStarted] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const tutorialSteps = [
    {
      id: 'calendar-view',
      title: 'Linear Calendar View',
      description: 'Navigate your 12-month horizontal timeline',
      icon: Calendar,
      duration: '30s'
    },
    {
      id: 'event-creation',
      title: 'Create Events',
      description: 'Click and drag to create events anywhere',
      icon: Target,
      duration: '45s'
    },
    {
      id: 'ai-assistant',
      title: 'AI Scheduling',
      description: 'Let AI help optimize your schedule',
      icon: Sparkles,
      duration: '60s'
    },
    {
      id: 'command-palette',
      title: 'Command Palette',
      description: 'Use Cmd+K for quick actions',
      icon: Zap,
      duration: '30s'
    }
  ]

  const handleStartTutorial = () => {
    setTutorialStarted(true)
    // Simulate tutorial steps
    tutorialSteps.forEach((step, index) => {
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, step.id])
      }, (index + 1) * 1000)
    })
  }

  const isComplete = completedSteps.length === tutorialSteps.length

  if (!tutorialStarted) {
    return (
      <div className="text-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Play className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Ready to Explore!</h2>
            <p className="text-muted-foreground">
              Take a quick tour to learn the key features
            </p>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {tutorialSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Card className="text-left">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                      <div className="space-y-1">
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {step.duration}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Interactive tutorial • About 3 minutes
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onNext} variant="outline">
              Skip Tutorial
            </Button>
            <Button onClick={handleStartTutorial} size="lg">
              <Play className="mr-2 w-4 h-4" />
              Start Tutorial
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Interactive Tutorial</h2>
        <Progress 
          value={(completedSteps.length / tutorialSteps.length) * 100} 
          className="w-full max-w-md mx-auto"
        />
        <p className="text-sm text-muted-foreground">
          {completedSteps.length} of {tutorialSteps.length} steps completed
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tutorialSteps.map((step) => {
          const Icon = step.icon
          const isCompleted = completedSteps.includes(step.id)
          const isActive = !isCompleted && completedSteps.length === tutorialSteps.findIndex(s => s.id === step.id)
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0.5 }}
              animate={{ 
                opacity: isCompleted ? 1 : isActive ? 0.8 : 0.5,
                scale: isActive ? 1.02 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <Card className={cn(
                "relative transition-all duration-300",
                isCompleted && "border-green-500 bg-green-50 dark:bg-green-950/20",
                isActive && "border-primary shadow-md"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      isCompleted && "bg-green-500 text-white",
                      isActive && "bg-primary text-primary-foreground",
                      !isCompleted && !isActive && "bg-muted"
                    )}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : isActive ? (
                        <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Tutorial Complete!</h3>
            <p className="text-muted-foreground">
              You're all set to start using LinearTime
            </p>
          </div>
          <Button onClick={onNext} size="lg">
            <Sparkles className="mr-2 w-4 h-4" />
            Enter LinearTime
          </Button>
        </motion.div>
      )}
    </div>
  )
}

// Main Onboarding Component
const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Introduction to LinearTime',
    component: WelcomeStep
  },
  {
    id: 'providers',
    title: 'Connect Calendars',
    description: 'Set up calendar providers',
    component: ProviderStep,
    optional: true
  },
  {
    id: 'preferences',
    title: 'Customize',
    description: 'Set your preferences',
    component: PreferencesStep,
    optional: true
  },
  {
    id: 'tutorial',
    title: 'Learn',
    description: 'Interactive tutorial',
    component: TutorialStep,
    optional: true
  }
]

export default function OnboardingPlayground() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  const currentStep = onboardingSteps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / onboardingSteps.length) * 100

  const handleNext = useCallback(() => {
    if (currentStepIndex < onboardingSteps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStep.id])
      setCurrentStepIndex(prev => prev + 1)
    } else {
      setCompletedSteps(prev => [...prev, currentStep.id])
      setOnboardingComplete(true)
    }
  }, [currentStepIndex, currentStep.id])

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
      setCompletedSteps(prev => prev.filter(id => id !== currentStep.id))
    }
  }, [currentStepIndex, currentStep.id])

  const handleSkip = useCallback(() => {
    handleNext()
  }, [handleNext])

  if (onboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 max-w-md"
        >
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary-foreground" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Welcome to LinearTime!</h1>
            <p className="text-muted-foreground">
              Your calendar is ready. Start exploring your 12-month linear timeline.
            </p>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Completed {completedSteps.length} of {onboardingSteps.length} setup steps
              </div>
              <Progress value={100} className="w-full" />
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              Open Calendar
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  const StepComponent = currentStep.component

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">LinearTime Setup</span>
              </div>
              
              <div className="hidden md:flex items-center gap-2">
                {onboardingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center",
                      index < onboardingSteps.length - 1 && "after:w-8 after:h-px after:bg-border after:ml-2"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all",
                      completedSteps.includes(step.id) && "bg-primary border-primary text-primary-foreground",
                      index === currentStepIndex && "border-primary text-primary",
                      index > currentStepIndex && "border-muted text-muted-foreground"
                    )}>
                      {completedSteps.includes(step.id) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {onboardingSteps.length}
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="py-8"
            >
              <StepComponent
                onNext={handleNext}
                onPrev={handlePrev}
                onSkip={handleSkip}
                isFirstStep={currentStepIndex === 0}
                isLastStep={currentStepIndex === onboardingSteps.length - 1}
                stepProgress={progress}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}