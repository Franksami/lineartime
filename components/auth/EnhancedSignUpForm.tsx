'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignUp } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, GalleryVerticalEnd, Star, TrendingUp, Calendar, Users, Zap, Shield } from 'lucide-react'
import Link from 'next/link'
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EnhancedSignUpFormProps {
  onModeSwitch?: () => void
}

export function EnhancedSignUpForm({ onModeSwitch }: EnhancedSignUpFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [completionProgress, setCompletionProgress] = useState(0)
  const [showWelcome, setShowWelcome] = useState(false)
  const { utils, isClient } = useUnifiedTheme()

  // Simulate progress tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setCompletionProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 10, 100)
        if (newProgress === 100) {
          setTimeout(() => setShowWelcome(true), 500)
        }
        return newProgress
      })
    }, 500)

    return () => clearInterval(timer)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted/50 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const features = [
    { icon: Calendar, text: 'AI Calendar', color: 'bg-blue-500' },
    { icon: TrendingUp, text: 'Analytics', color: 'bg-green-500' },
    { icon: Users, text: 'Team Sync', color: 'bg-purple-500' },
    { icon: Shield, text: 'Secure', color: 'bg-orange-500' },
  ]

  const benefits = [
    { title: 'Intelligent Scheduling', description: 'AI-powered time management' },
    { title: 'Team Collaboration', description: 'Seamless team coordination' },
    { title: 'Advanced Analytics', description: 'Deep insights into your productivity' },
    { title: 'Calendar Integration', description: 'Sync with Google, Outlook, and more' },
  ]

  const testimonials = [
    { text: "LinearTime revolutionized how we manage our team's schedule", author: "Sarah Chen, Product Manager" },
    { text: "The AI suggestions saved me hours every week", author: "David Rodriguez, CEO" },
    { text: "Best calendar app I've ever used", author: "Emma Thompson, Designer" },
  ]

  return (
    <div className="w-full max-w-md space-y-6">
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-4"
          >
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Welcome to LinearTime!</strong> Your account is ready. Let's get started!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg">
                <GalleryVerticalEnd className="w-6 h-6 text-primary-foreground" />
              </div>
            </motion.div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Join LinearTime
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Get started with your free account
              </CardDescription>
            </div>

            {/* Feature showcase with animations */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-2"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Badge variant="secondary" className="w-full text-xs px-3 py-2">
                    <feature.icon className="w-3 h-3 mr-1" />
                    {feature.text}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center space-x-2"
            >
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Rated 5/5 by 10,000+ users
              </span>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Account Setup Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(completionProgress)}%
                </span>
              </div>
              <Progress value={completionProgress} className="h-2" />
            </motion.div>

            {/* Clerk Integration */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    formButtonPrimary: `
                      bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 
                      text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300
                      hover:scale-[1.02] active:scale-[0.98]
                    `,
                    formFieldInput: `
                      bg-background border-input transition-all duration-200
                      focus:border-ring focus:ring-2 focus:ring-ring/20
                      hover:border-accent/50
                    `,
                    footerActionLink: "text-primary hover:text-primary/80 transition-colors",
                    dividerLine: "bg-gradient-to-r from-transparent via-border to-transparent",
                    dividerText: "text-muted-foreground text-sm bg-background px-2",
                    socialButtonsBlockButton: `
                      bg-card hover:bg-accent border-border shadow-sm 
                      hover:shadow-md transition-all duration-200
                      hover:scale-[1.02] active:scale-[0.98]
                      hover:border-accent/50
                    `,
                    socialButtonsBlockButtonText: "font-medium",
                    identityPreviewEditButton: "text-primary hover:text-primary/80",
                    formFieldLabel: "text-foreground font-medium",
                    formFieldAction: "text-primary hover:text-primary/80",
                    alertText: "text-destructive-foreground",
                    formResendCodeLink: "text-primary hover:text-primary/80",
                    otpCodeFieldInput: `
                      bg-background border-input transition-colors duration-200
                      focus:border-ring focus:ring-2 focus:ring-ring/20
                    `,
                  },
                  layout: {
                    socialButtonsPlacement: "top",
                    socialButtonsVariant: "blockButton",
                  },
                }}
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
              />
            </motion.div>

            {/* Multi-library component showcase */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="space-y-4"
            >
              <Separator className="my-4" />
              
              {/* Benefits timeline */}
              <div className="space-y-3">
                <h5 className="text-base font-semibold text-center text-foreground mb-3">
                  What you'll get:
                </h5>
                
                <div className="grid grid-cols-1 gap-2">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/10 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {benefit.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Social proof carousel */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-center space-y-2"
              >
                <p className="text-xs text-muted-foreground">
                  Trusted by professionals worldwide
                </p>
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Sign in link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  href="/sign-in" 
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-card p-6 rounded-lg shadow-xl border border-border"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                    style={{ 
                      clipPath: `circle(50% at 50% 50%)`,
                      transform: `rotate(${completionProgress * 3.6}deg)` 
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                    {Math.round(completionProgress)}%
                  </div>
                </div>
                <span className="text-foreground">Setting up your account...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}