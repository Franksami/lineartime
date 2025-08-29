'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export function LandingNavigation() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Command Center Calendar</span>
            <Badge variant="secondary" className="hidden sm:inline-flex ml-2">
              Beta
            </Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
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
