'use client'

import React, { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Zap, 
  ArrowRight, 
  Play,
  Star,
  Sparkles,
  Clock,
  Target,
  BarChart3,
  CheckCircle
} from 'lucide-react'
import { Group, Text as MantineText, Avatar, Rating } from '@mantine/core'
import { HStack, VStack, Text as ChakraText } from '@chakra-ui/react'
import { Space, Statistic, Rate } from 'antd'
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme'
import Link from 'next/link'

interface HeroSectionProps {
  onGetStarted?: () => void
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [currentWord, setCurrentWord] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollY } = useScroll()
  const { utils, isClient } = useUnifiedTheme()

  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  const heroWords = ['organize', 'plan', 'visualize', 'master']
  const stats = [
    { title: 'Active Users', value: '50K+', icon: Users },
    { title: 'Time Saved', value: '2M hrs', icon: Clock },
    { title: 'Satisfaction', value: '98%', icon: Target },
    { title: 'Productivity', value: '+40%', icon: BarChart3 },
  ]

  const features = [
    'Year-at-a-glance view',
    'AI-powered suggestions',
    'Team collaboration',
    'Smart integrations'
  ]

  // Rotate hero words
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord(prev => (prev + 1) % heroWords.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [heroWords.length])

  // Track mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center animate-pulse">
          <div className="h-12 bg-muted rounded w-96 mx-auto" />
          <div className="h-6 bg-muted/60 rounded w-64 mx-auto" />
          <div className="h-10 bg-muted/40 rounded w-32 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated Background */}
      <motion.div 
        className="absolute inset-0 -z-10"
        style={{ y }}
      >
        {/* Gradient Background */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, var(--primary) 0%, transparent 50%)`,
            opacity: 0.1,
          }}
        />

        {/* Floating Elements */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
        />

        {/* Floating Particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -20, null],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>

      <div className="container mx-auto px-6 py-20">
        <motion.div
          style={{ opacity }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen"
        >
          {/* Left Side - Hero Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Calendar Revolution
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="block text-foreground">Life is bigger</span>
                <span className="block text-foreground">than a </span>
                <motion.span
                  key={currentWord}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                >
                  {heroWords[currentWord]}
                </motion.span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl">
                Transform how you manage time with our revolutionary year-at-a-glance calendar. 
                Powered by AI for smarter scheduling and deeper insights.
              </p>
            </motion.div>

            {/* Feature List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={onGetStarted}
                asChild
              >
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-2 hover:bg-accent/10 transition-all duration-300"
                asChild
              >
                <Link href="/demo">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Link>
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center lg:justify-start space-x-1">
                <Rate disabled defaultValue={5} className="text-sm" />
                <MantineText size="sm" c="dimmed" className="ml-2 text-muted-foreground">
                  5.0 from 10,000+ users
                </MantineText>
              </div>
              
              <HStack spacing={6} className="justify-center lg:justify-start flex-wrap">
                <MantineText size="sm" c="dimmed" className="text-muted-foreground">
                  Trusted by:
                </MantineText>
                {['Google', 'Microsoft', 'Spotify', 'Netflix'].map((company) => (
                  <motion.span
                    key={company}
                    whileHover={{ scale: 1.05 }}
                    className="text-muted-foreground font-medium text-sm opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {company}
                  </motion.span>
                ))}
              </HStack>
            </motion.div>
          </div>

          {/* Right Side - Stats & Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 border-border/50">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <Statistic
                      title={<span className="text-sm text-muted-foreground">{stat.title}</span>}
                      value={stat.value}
                      valueStyle={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--foreground)' }}
                    />
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Interactive Demo Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <Card className="p-8 bg-gradient-to-br from-card to-accent/5 border-border/50 shadow-lg hover:shadow-xl transition-all duration-500">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center"
                  >
                    <Calendar className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground">
                    See Your Entire Year
                  </h3>
                  <p className="text-muted-foreground">
                    Revolutionary horizontal layout shows all 12 months at once
                  </p>
                  <Button variant="ghost" className="text-primary hover:text-primary/80">
                    Explore Layout →
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Testimonial Snippet */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Card className="p-6 bg-muted/30 border-border/50">
                <div className="flex items-start space-x-4">
                  <Avatar
                    size="md"
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=happy"
                  />
                  <div>
                    <ChakraText fontSize="sm" className="text-foreground italic">
                      "LinearTime completely changed how our team manages projects. 
                      The year view is a game-changer!"
                    </ChakraText>
                    <ChakraText fontSize="xs" className="text-muted-foreground mt-2">
                      Sarah Chen, Product Manager at TechCorp
                    </ChakraText>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors"
        >
          <div className="flex flex-col items-center space-y-2">
            <span>Scroll to explore</span>
            <div className="w-1 h-8 bg-border rounded-full">
              <motion.div
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-4 bg-primary rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}