'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { SignIn } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  GalleryVerticalEnd,
  Loader2,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';

interface EnhancedSignInFormProps {
  onModeSwitch?: () => void;
}

export function EnhancedSignInForm({ onModeSwitch }: EnhancedSignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [_showPassword, _setShowPassword] = useState(false);
  const [_email, _setEmail] = useState('');
  const [_password, _setPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { utils, isClient } = useUnifiedTheme();

  const _handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
    }, 2000);
  };

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
    );
  }

  const features = [
    {
      icon: Shield,
      text: 'Enterprise Security',
      color: 'bg-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
    },
    { icon: Zap, text: 'Lightning Fast', color: 'bg-primary' },
    {
      icon: Users,
      text: 'Team Collaboration',
      color: 'bg-purple-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
    },
  ];

  return (
    <div className="w-full max-w-md space-y-6">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4"
          >
            <Alert className="border-green-200 /* TODO: Use semantic token */ /* TODO: Use semantic token */ bg-green-50 /* TODO: Use semantic token */ /* TODO: Use semantic token */ text-green-800 /* TODO: Use semantic token */ /* TODO: Use semantic token */">
              <AlertDescription>
                <strong>Success!</strong> Authentication successful! Redirecting...
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <GalleryVerticalEnd className="w-6 h-6 text-primary-foreground" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to your Command Center Calendar account
              </CardDescription>
            </div>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    <feature.icon className="w-3 h-3 mr-1" />
                    {feature.text}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Clerk Integration */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <SignIn
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'bg-transparent shadow-none border-none',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    formButtonPrimary: `
                      bg-primary hover:bg-primary/90 text-primary-foreground 
                      shadow-md hover:shadow-lg transition-all duration-200
                      hover:scale-[1.02] active:scale-[0.98]
                    `,
                    formFieldInput: `
                      bg-background border-input transition-colors duration-200
                      focus:border-ring focus:ring-2 focus:ring-ring/20
                    `,
                    footerActionLink: 'text-primary hover:text-primary/80 transition-colors',
                    dividerLine: 'bg-border',
                    dividerText: 'text-muted-foreground text-sm',
                    socialButtonsBlockButton: `
                      bg-card hover:bg-accent border-border shadow-sm 
                      hover:shadow-md transition-all duration-200
                      hover:scale-[1.02] active:scale-[0.98]
                    `,
                    socialButtonsBlockButtonText: 'font-medium',
                    identityPreviewEditButton: 'text-primary hover:text-primary/80',
                    formFieldLabel: 'text-foreground font-medium',
                    formFieldAction: 'text-primary hover:text-primary/80',
                    alertText: 'text-destructive-foreground',
                    formResendCodeLink: 'text-primary hover:text-primary/80',
                    otpCodeFieldInput: `
                      bg-background border-input transition-colors duration-200
                      focus:border-ring focus:ring-2 focus:ring-ring/20
                    `,
                  },
                  layout: {
                    socialButtonsPlacement: 'top',
                    socialButtonsVariant: 'blockButton',
                  },
                }}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
              />
            </motion.div>

            {/* Multi-library component showcase */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <Separator className="my-4" />

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Powered by enterprise-grade authentication
                </p>

                <div className="flex justify-center items-center flex-wrap gap-2">
                  <Button size="sm" variant="ghost" className="h-auto px-2 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span className="text-xs">AI-Powered</span>
                  </Button>
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Sign up link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  href="/sign-up"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign up for free
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
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-foreground">Signing you in...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
