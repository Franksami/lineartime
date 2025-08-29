'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { EnhancedSignInForm } from './EnhancedSignInForm';
import { EnhancedSignUpForm } from './EnhancedSignUpForm';

interface EnhancedAuthLayoutProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export function EnhancedAuthLayout({ mode, onModeChange }: EnhancedAuthLayoutProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { utils, isClient } = useUnifiedTheme();

  // Rotate featured benefits
  const features = [
    {
      icon: Calendar,
      title: 'AI-Powered Scheduling',
      description: 'Smart suggestions for optimal time management',
      stat: '40% time saved',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Deep insights into productivity patterns',
      stat: '95% accuracy',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Seamless coordination across teams',
      stat: '10K+ teams',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security for your data',
      stat: '99.9% uptime',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-muted rounded" />
              <div className="h-4 bg-muted/60 rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const stats = [
    { title: 'Active Users', value: '50K+', icon: Users },
    { title: 'Time Saved', value: '2M hrs', icon: Clock },
    { title: 'Satisfaction', value: '98%', icon: Target },
    { title: 'Integrations', value: '100+', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, var(--primary) 0%, transparent 50%)`,
            opacity: 0.1,
          }}
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
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
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -20, null],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-screen">
          {/* Left side - Marketing content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 order-2 lg:order-1"
          >
            {/* Hero section */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge variant="secondary" className="mb-4">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Calendar
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Life is bigger
                  </span>
                  <br />
                  than a week
                </h1>
                <p className="text-xl text-muted-foreground mt-4 leading-relaxed">
                  Transform how you manage time with our revolutionary year-at-a-glance calendar.
                  Powered by AI for smarter scheduling and deeper insights.
                </p>
              </motion.div>

              {/* Stats grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Card className="p-4 text-center hover:shadow-md transition-all duration-300">
                      <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{stat.title}</p>
                        <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Rotating features */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <Card className="p-6 border-l-4 border-l-primary">
                  <div className="flex items-start space-x-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className={`p-3 rounded-lg bg-gradient-to-r ${features[currentFeature].color}`}
                    >
                      {React.createElement(features[currentFeature].icon, {
                        className: 'w-6 h-6 text-white',
                      })}
                    </motion.div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-foreground">
                          {features[currentFeature].title}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {features[currentFeature].stat}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {features[currentFeature].description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">Trusted by teams at:</p>
              <div className="flex flex-wrap gap-6">
                {['Google', 'Microsoft', 'Spotify', 'Netflix', 'Uber'].map((company) => (
                  <motion.div
                    key={company}
                    whileHover={{ scale: 1.05 }}
                    className="text-muted-foreground font-medium text-sm opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {company}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Feature indicators */}
            <div className="flex space-x-2">
              {features.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentFeature ? 'bg-primary w-8' : 'bg-muted'
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Right side - Authentication form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center order-1 lg:order-2"
          >
            <div className="w-full max-w-md">
              <AnimatePresence mode="wait">
                {mode === 'signin' ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -90 }}
                    transition={{ duration: 0.5 }}
                  >
                    <EnhancedSignInForm onModeSwitch={() => onModeChange('signup')} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -90 }}
                    transition={{ duration: 0.5 }}
                  >
                    <EnhancedSignUpForm onModeSwitch={() => onModeChange('signin')} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
