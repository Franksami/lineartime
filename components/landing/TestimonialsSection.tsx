'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Star,
  Quote,
  ArrowLeft,
  ArrowRight,
  Play,
  Users,
  TrendingUp,
  Award,
  ThumbsUp,
  Heart,
  Zap
} from 'lucide-react'
import { Group, Text as MantineText, Avatar, Rating } from '@mantine/core'
import { HStack, VStack, Text as ChakraText } from '@chakra-ui/react'
import { Space, Rate, Statistic } from 'antd'
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme'

export function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { utils, isClient } = useUnifiedTheme()

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Product Manager',
      company: 'TechCorp',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      content: 'LinearTime completely transformed how our team manages projects. The year-at-a-glance view helped us identify patterns we never saw before. Our productivity increased by 40% in just 3 months.',
      rating: 5,
      highlight: 'Increased productivity by 40%',
      videoThumbnail: true,
      verified: true
    },
    {
      id: 2,
      name: 'Marcus Rodriguez',
      role: 'CEO',
      company: 'StartupXYZ',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      content: 'As a startup founder, time is everything. LinearTime\'s AI suggestions have saved me countless hours on scheduling. The insights dashboard shows exactly where I\'m spending time and how to optimize it.',
      rating: 5,
      highlight: 'Saves 2+ hours per week',
      videoThumbnail: false,
      verified: true
    },
    {
      id: 3,
      name: 'Emily Watson',
      role: 'Design Director',
      company: 'CreativeStudio',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
      content: 'The design is absolutely beautiful, and the user experience is seamless. Our entire design team switched to LinearTime, and we love how it integrates with all our tools. Best calendar app we\'ve ever used.',
      rating: 5,
      highlight: 'Best calendar app ever',
      videoThumbnail: true,
      verified: true
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Engineering Manager',
      company: 'DevCorp',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
      content: 'The performance is incredible. We have thousands of events and it handles everything smoothly. The team collaboration features make coordinating across time zones effortless.',
      rating: 5,
      highlight: 'Handles thousands of events smoothly',
      videoThumbnail: false,
      verified: true
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      role: 'Operations Director',
      company: 'GlobalInc',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
      content: 'LinearTime helped us visualize our quarterly planning like never before. The analytics showed us bottlenecks we didn\'t know existed. It\'s become essential to our operations.',
      rating: 5,
      highlight: 'Essential to operations',
      videoThumbnail: true,
      verified: true
    }
  ]

  const stats = [
    { label: 'Happy Customers', value: '50K+', icon: Users },
    { label: 'Average Rating', value: '4.9', icon: Star },
    { label: 'Time Saved', value: '2M hrs', icon: TrendingUp },
    { label: 'Retention Rate', value: '98%', icon: Award },
  ]

  const companies = [
    { name: 'Google', logo: '🌟' },
    { name: 'Microsoft', logo: '🚀' },
    { name: 'Spotify', logo: '🎵' },
    { name: 'Netflix', logo: '🎬' },
    { name: 'Uber', logo: '🚗' },
    { name: 'Airbnb', logo: '🏠' },
  ]

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPlaying, testimonials.length])

  const nextTestimonial = () => {
    setCurrentTestimonial(prev => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial(prev => prev === 0 ? testimonials.length - 1 : prev - 1)
  }

  if (!isClient) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64 mx-auto" />
            <div className="h-4 bg-muted/60 rounded w-96 mx-auto" />
            <div className="mt-8 h-40 bg-muted rounded" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} className="py-20 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        
        {/* Floating testimonial bubbles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-primary/10 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -30, null],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            <Heart className="w-4 h-4 mr-2 text-red-500" />
            Loved by Thousands
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-foreground">What our customers</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              are saying
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Join thousands of professionals who've transformed their productivity with LinearTime.
            Here's what they have to say about their experience.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 border-border/50">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <Statistic
                  title={<span className="text-sm text-muted-foreground">{stat.label}</span>}
                  value={stat.value}
                  valueStyle={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--foreground)' }}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Testimonial Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <Card className="p-8 bg-gradient-to-br from-card to-accent/5 border-border/50 shadow-xl relative overflow-hidden">
            {/* Quote Icon */}
            <motion.div
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-4 left-4 text-primary/20"
            >
              <Quote className="w-16 h-16" />
            </motion.div>

            {/* Testimonial Content */}
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Rating */}
                  <div className="flex justify-center">
                    <Rate disabled defaultValue={testimonials[currentTestimonial].rating} />
                  </div>

                  {/* Content */}
                  <blockquote className="text-xl lg:text-2xl text-foreground text-center leading-relaxed font-medium italic">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>

                  {/* Highlight Badge */}
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="text-sm px-4 py-2">
                      <Zap className="w-4 h-4 mr-2 text-primary" />
                      {testimonials[currentTestimonial].highlight}
                    </Badge>
                  </div>

                  {/* Author */}
                  <div className="flex items-center justify-center space-x-4">
                    <Avatar
                      size="lg"
                      src={testimonials[currentTestimonial].avatar}
                    />
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <h4 className="font-semibold text-foreground text-lg">
                          {testimonials[currentTestimonial].name}
                        </h4>
                        {testimonials[currentTestimonial].verified && (
                          <Badge variant="outline" className="text-xs">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                      </p>
                    </div>
                    {testimonials[currentTestimonial].videoThumbnail && (
                      <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                        <Play className="w-4 h-4 mr-1" />
                        Watch
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevTestimonial}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {/* Dots Indicator */}
                <div className="flex space-x-2">
                  {testimonials.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial ? 'bg-primary w-8' : 'bg-muted hover:bg-muted-foreground'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextTestimonial}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Auto-play Toggle */}
              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  {isPlaying ? 'Pause' : 'Play'} auto-rotation
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Company Logos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <MantineText size="sm" c="dimmed" className="mb-8 text-muted-foreground">
            Trusted by teams at leading companies
          </MantineText>
          
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {companies.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.1, opacity: 1 }}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <span className="text-2xl">{company.logo}</span>
                <span className="font-medium">{company.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Ready to join thousands of happy customers?
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your free trial today and see why teams love LinearTime
            </p>
            <HStack spacing={4} className="justify-center">
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg">
                See All Reviews
              </Button>
            </HStack>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}