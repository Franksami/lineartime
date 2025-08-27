'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import {
  Text as ChakraText,
  CircularProgress,
  CircularProgressLabel,
  HStack,
  VStack,
} from '@chakra-ui/react';
import { Avatar, Group, Text as MantineText, ThemeIcon, Timeline } from '@mantine/core';
import { Rate, Space, Statistic, Steps } from 'antd';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Cloud,
  Play,
  Settings,
  Shield,
  Smartphone,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState, useRef } from 'react';

const { Step } = Steps;

export function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [activeDemo, setActiveDemo] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const { utils, isClient } = useUnifiedTheme();

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const _opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const mainFeatures = [
    {
      icon: Calendar,
      title: 'Year-at-a-Glance View',
      description:
        'See your entire year in one horizontal layout. No more switching between months.',
      benefit: 'See patterns and plan long-term',
      demo: 'Interactive calendar demo',
      color: 'from-blue-500 to-blue-600',
      stats: { label: 'Wider perspective', value: '12x', unit: 'months visible' },
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description:
        'Smart suggestions for optimal scheduling, conflict resolution, and productivity optimization.',
      benefit: 'Save 2+ hours per week',
      demo: 'AI suggestion preview',
      color: 'from-purple-500 to-purple-600',
      stats: { label: 'Time saved', value: '40', unit: '% average' },
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description:
        'Seamless coordination across teams with shared calendars and real-time updates.',
      benefit: 'Perfect team synchronization',
      demo: 'Team sharing demo',
      color: 'from-green-500 to-green-600',
      stats: { label: 'Team adoption', value: '95', unit: '% satisfaction' },
    },
    {
      icon: Zap,
      title: 'Lightning Performance',
      description: 'Handle 10,000+ events smoothly with virtual scrolling and optimized rendering.',
      benefit: 'No lag, even with massive data',
      demo: 'Performance benchmark',
      color: 'from-yellow-500 to-orange-500',
      stats: { label: 'Performance', value: '60', unit: 'fps smooth' },
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with end-to-end encryption and SOC 2 compliance.',
      benefit: 'Your data is always safe',
      demo: 'Security features',
      color: 'from-red-500 to-red-600',
      stats: { label: 'Uptime', value: '99.9', unit: '% guaranteed' },
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Deep insights into your productivity patterns, time allocation, and goal achievement.',
      benefit: 'Data-driven optimization',
      demo: 'Analytics dashboard',
      color: 'from-indigo-500 to-indigo-600',
      stats: { label: 'Insights', value: '50+', unit: 'data points' },
    },
  ];

  const secondaryFeatures = [
    { icon: Smartphone, title: 'Mobile First', description: 'Perfect experience on any device' },
    { icon: Cloud, title: 'Cloud Sync', description: 'Access your calendar anywhere' },
    { icon: Target, title: 'Goal Tracking', description: 'Monitor progress on objectives' },
    { icon: Clock, title: 'Time Blocking', description: 'Focus time protection' },
    {
      icon: TrendingUp,
      title: 'Productivity Metrics',
      description: 'Track improvements over time',
    },
    { icon: Settings, title: 'Deep Customization', description: 'Tailored to your workflow' },
  ];

  if (!isClient) {
    return (
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4 animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                  <div className="h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted/60 rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="py-20 bg-muted/20 relative overflow-hidden">
      {/* Background Elements */}
      <motion.div style={{ y }} className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </motion.div>

      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            <Star className="w-4 h-4 mr-2" />
            Revolutionary Features
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Everything you need
            </span>
            <br />
            <span className="text-foreground">to master your time</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A comprehensive suite of tools designed to transform how you plan, schedule, and
            optimize your time. Built for individuals and teams who demand excellence.
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
              className="group"
            >
              <Card className="h-full p-6 hover:shadow-xl transition-all duration-500 border-border/50 hover:border-primary/20 relative overflow-hidden">
                {/* Hover Effect Background */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredFeature === index ? 0.1 : 0 }}
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color}`}
                />

                <div className="relative z-10 space-y-4">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </motion.div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Benefit Badge */}
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {feature.benefit}
                  </Badge>

                  {/* Stats */}
                  <div className="border-t border-border/50 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Statistic
                          title={
                            <span className="text-xs text-muted-foreground">
                              {feature.stats.label}
                            </span>
                          }
                          value={feature.stats.value}
                          suffix={feature.stats.unit}
                          className="text-sm"
                          valueStyle={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                        />
                      </div>
                      <CircularProgress
                        value={Number.parseInt(feature.stats.value)}
                        size="40px"
                        color="blue.500"
                        trackColor="gray.200"
                      >
                        <CircularProgressLabel className="text-xs font-medium">
                          {feature.stats.value}
                        </CircularProgressLabel>
                      </CircularProgress>
                    </div>
                  </div>

                  {/* Demo Link */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-primary hover:text-primary/80 hover:bg-primary/5 transition-all"
                  >
                    <Play className="w-3 h-3 mr-2" />
                    {feature.demo}
                    <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Secondary Features */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8 text-foreground">
            Plus even more powerful features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="p-4 hover:shadow-md transition-all duration-300 border-border/50">
                  <div className="flex items-center space-x-3">
                    <ThemeIcon size="md" className="bg-primary/10 text-primary">
                      <feature.icon className="w-5 h-5" />
                    </ThemeIcon>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="p-8 bg-gradient-to-br from-card to-accent/5 border-border/50">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                Your Journey to Better Time Management
              </h3>
              <p className="text-muted-foreground">
                See how LinearTime transforms your productivity in just a few steps
              </p>
            </div>

            <Steps
              current={activeDemo}
              onChange={setActiveDemo}
              direction="horizontal"
              className="mb-8"
              items={[
                {
                  title: 'Setup',
                  description: 'Connect your calendars',
                  icon: <Settings className="w-4 h-4" />,
                },
                {
                  title: 'Organize',
                  description: 'See your year-at-a-glance',
                  icon: <Calendar className="w-4 h-4" />,
                },
                {
                  title: 'Optimize',
                  description: 'Get AI insights',
                  icon: <Brain className="w-4 h-4" />,
                },
                {
                  title: 'Achieve',
                  description: 'Reach your goals',
                  icon: <Target className="w-4 h-4" />,
                },
              ]}
            />

            <div className="bg-muted/30 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
              <motion.div
                key={activeDemo}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  {activeDemo === 0 && <Settings className="w-8 h-8 text-primary" />}
                  {activeDemo === 1 && <Calendar className="w-8 h-8 text-primary" />}
                  {activeDemo === 2 && <Brain className="w-8 h-8 text-primary" />}
                  {activeDemo === 3 && <Target className="w-8 h-8 text-primary" />}
                </div>
                <h4 className="font-semibold text-foreground mb-2">
                  {activeDemo === 0 && 'Connect Your Digital Life'}
                  {activeDemo === 1 && 'Visualize Your Time'}
                  {activeDemo === 2 && 'Get Intelligent Insights'}
                  {activeDemo === 3 && 'Achieve Your Goals'}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {activeDemo === 0 &&
                    'Import from Google Calendar, Outlook, and 100+ other tools in minutes.'}
                  {activeDemo === 1 &&
                    'See patterns, plan ahead, and understand your time like never before.'}
                  {activeDemo === 2 &&
                    'AI analyzes your habits and suggests optimizations for maximum productivity.'}
                  {activeDemo === 3 &&
                    'Track progress on goals and celebrate achievements along the way.'}
                </p>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
