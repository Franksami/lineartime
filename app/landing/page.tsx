"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { 
  Calendar, 
  Sparkles, 
  Users, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  ChevronLeft,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  Clock,
  Zap,
  Shield,
  Brain,
  Globe
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Hero Section Component
function HeroSection() {
  return (
    <section className="bg-background text-foreground py-12 sm:py-24 md:py-32 px-4 overflow-hidden pb-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          <Badge variant="outline" className="gap-2">
            <span className="text-muted-foreground">New Feature</span>
            <Link href="#ai-scheduling" className="flex items-center gap-1 text-primary hover:underline">
              AI Scheduling
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Badge>

          <h1 className="relative z-10 inline-block bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-4xl font-semibold leading-tight text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            Life is bigger than a week
          </h1>

          <p className="text-md relative z-10 max-w-[550px] font-medium text-muted-foreground sm:text-xl">
            Experience time differently with LinearTime Calendar. Our revolutionary horizontal 12-month timeline view helps you see the bigger picture and plan beyond traditional weekly constraints.
          </p>

          <div className="relative z-10 flex justify-center gap-4">
            <SignedOut>
              <Button size="lg" asChild>
                <SignUpButton mode="modal">
                  <span className="flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </SignUpButton>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#demo" className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  View Demo
                </Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button size="lg" asChild>
                <Link href="/" className="flex items-center gap-2">
                  Open Calendar
                  <Calendar className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </SignedIn>
          </div>

          <div className="relative pt-12">
            <div className="bg-accent/5 flex relative z-10 overflow-hidden rounded-2xl p-2">
              <div className="flex relative z-10 overflow-hidden shadow-2xl border border-border/5 border-t-border/15 rounded-md">
                <div className="w-full h-[400px] bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center rounded-md">
                  <div className="text-center space-y-4">
                    <Calendar className="w-24 h-24 mx-auto text-primary" />
                    <p className="text-2xl font-semibold">LinearTime Calendar Interface</p>
                    <p className="text-muted-foreground">Horizontal 12-month timeline view</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute w-full top-0">
              <div className="absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/.3)_10%,_transparent_60%)] sm:h-[512px]" />
              <div className="absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-[2] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/.2)_10%,_transparent_60%)] sm:h-[256px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Feature Showcase Component
function FeatureShowcase() {
  const features = [
    {
      icon: <Calendar className="w-6 h-6 text-primary" />,
      title: "Horizontal Timeline",
      description: "See your entire year at a glance with our unique horizontal 12-month layout that breaks free from traditional calendar constraints.",
    },
    {
      icon: <Brain className="w-6 h-6 text-primary" />,
      title: "AI Scheduling",
      description: "Let our intelligent AI find the perfect time slots for your meetings, considering preferences, time zones, and availability.",
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Team Collaboration",
      description: "Share calendars, coordinate schedules, and plan projects together with powerful collaboration tools built for teams.",
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Natural Language",
      description: "Create events naturally by typing 'Meeting with Sarah tomorrow at 2pm' - our AI understands your intent.",
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "Performance Optimized",
      description: "Handle thousands of events smoothly with our optimized rendering engine and virtual scrolling technology.",
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security, encryption, and privacy controls you can trust.",
    },
  ];

  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Powerful Features for Modern Planning
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage time more effectively
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonial Carousel Component
function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const testimonials = [
    {
      name: "Sarah Chen",
      title: "Product Manager at TechCorp",
      description: "LinearTime Calendar has revolutionized how our team manages projects. The horizontal timeline view gives us unprecedented clarity into our roadmap.",
      imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=600&q=80",
      githubUrl: "#",
      twitterUrl: "#",
      linkedinUrl: "#"
    },
    {
      name: "Michael Rodriguez",
      title: "CEO at StartupXYZ",
      description: "The AI scheduling feature is a game-changer. It automatically finds the perfect time slots for our team meetings across different time zones.",
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
      githubUrl: "#",
      twitterUrl: "#",
      linkedinUrl: "#"
    },
    {
      name: "Emily Johnson",
      title: "Design Lead at CreativeStudio",
      description: "Finally, a calendar that thinks beyond weeks. The 12-month view helps us plan campaigns and see the bigger picture of our creative projects.",
      imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
      githubUrl: "#",
      twitterUrl: "#",
      linkedinUrl: "#"
    }
  ];

  const handleNext = () => setCurrentIndex((index) => (index + 1) % testimonials.length);
  const handlePrevious = () => setCurrentIndex((index) => (index - 1 + testimonials.length) % testimonials.length);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">What Our Users Say</h2>
          <p className="text-lg text-muted-foreground">Trusted by teams worldwide</p>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-8 shadow-2xl">
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-muted">
                    <Image
                      src={currentTestimonial.imageUrl}
                      alt={currentTestimonial.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <blockquote className="text-lg leading-relaxed">
                    &ldquo;{currentTestimonial.description}&rdquo;
                  </blockquote>
                  <div>
                    <h3 className="text-xl font-bold">{currentTestimonial.name}</h3>
                    <p className="text-muted-foreground">{currentTestimonial.title}</p>
                  </div>
                  <div className="flex justify-center space-x-4">
                    {[
                      { icon: Github, url: currentTestimonial.githubUrl, label: "GitHub" },
                      { icon: Twitter, url: currentTestimonial.twitterUrl, label: "Twitter" },
                      { icon: Linkedin, url: currentTestimonial.linkedinUrl, label: "LinkedIn" }
                    ].map(({ icon: IconComponent, url, label }) => (
                      <Link
                        key={label}
                        href={url || "#"}
                        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center transition-colors hover:bg-primary/80"
                      >
                        <IconComponent className="w-4 h-4 text-primary-foreground" />
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="flex justify-center items-center gap-6 mt-8">
            <button
              onClick={handlePrevious}
              className="w-12 h-12 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-12 h-12 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Pricing Preview Component
function PricingPreview() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-muted-foreground mb-12">
          Choose the plan that fits your needs
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { name: 'Personal', price: '$9', features: ['Horizontal timeline', 'Basic AI scheduling', 'Up to 3 calendars'] },
            { name: 'Professional', price: '$19', features: ['Everything in Personal', 'Advanced AI scheduling', 'Team collaboration'], popular: true },
            { name: 'Enterprise', price: '$49', features: ['Everything in Professional', 'Advanced analytics', 'SSO & security'] }
          ].map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/pricing">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link href="/pricing">View Detailed Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Sign Up CTA Component
function SignUpCTA() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl text-center">
        <Card className="p-12 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Ready to Transform Your Calendar?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users who have already discovered the power of thinking beyond the week. 
              Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <Button size="lg" asChild>
                  <SignUpButton mode="modal">
                    <span className="flex items-center gap-2">
                      Start Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </SignUpButton>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <SignInButton mode="modal">
                    <span>Sign In</span>
                  </SignInButton>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button size="lg" asChild>
                  <Link href="/" className="flex items-center gap-2">
                    Open Calendar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/pricing">Upgrade Plan</Link>
                </Button>
              </SignedIn>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Navigation Component
function LandingNavigation() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">LinearTime</span>
            <Badge variant="secondary" className="hidden sm:inline-flex ml-2">
              Beta
            </Badge>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </nav>
          
          <div className="flex items-center gap-2">
            <SignedOut>
              <Button variant="ghost" size="sm" asChild>
                <SignInButton mode="modal">
                  <span>Sign In</span>
                </SignInButton>
              </Button>
              <Button size="sm" asChild>
                <SignUpButton mode="modal">
                  <span>Get Started</span>
                </SignUpButton>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/pricing">Upgrade</Link>
              </Button>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation />
      <HeroSection />
      <div id="features">
        <FeatureShowcase />
      </div>
      <div id="testimonials">
        <TestimonialCarousel />
      </div>
      <PricingPreview />
      <SignUpCTA />
    </div>
  );
}