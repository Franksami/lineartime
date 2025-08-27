'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  type PWACapabilities,
  type PWAMetrics,
  enhancedPWAManager,
} from '@/lib/pwa/EnhancedPWAManager';
import { Bell, Clock, Download, Monitor, Smartphone, Star, Wifi, X, Zap } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface EnhancedInstallPromptProps {
  variant?: 'banner' | 'card' | 'modal';
  position?: 'top' | 'bottom' | 'center';
  showMetrics?: boolean;
  autoShow?: boolean;
}

export function EnhancedInstallPrompt({
  variant = 'banner',
  position = 'bottom',
  showMetrics = false,
  autoShow = true,
}: EnhancedInstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [capabilities, setCapabilities] = useState<PWACapabilities>(
    enhancedPWAManager.getCapabilities()
  );
  const [metrics, setMetrics] = useState<PWAMetrics>(enhancedPWAManager.getMetrics());
  const [userEngagement, setUserEngagement] = useState(0);
  const [dismissedPermanently, setDismissedPermanently] = useState(false);

  useEffect(() => {
    // Load dismissal state
    const dismissed = localStorage.getItem('pwa-install-dismissed-permanently');
    if (dismissed) {
      setDismissedPermanently(true);
      return;
    }

    // Update capabilities and metrics
    const updateState = () => {
      setCapabilities(enhancedPWAManager.getCapabilities());
      setMetrics(enhancedPWAManager.getMetrics());
    };

    // Listen for PWA events
    const handleInstallable = () => {
      updateState();
      if (autoShow && !dismissedPermanently) {
        setIsVisible(true);
      }
    };

    const handleInstalled = () => {
      updateState();
      setIsVisible(false);
    };

    enhancedPWAManager.on('installable', handleInstallable);
    enhancedPWAManager.on('installed', handleInstalled);

    // Track user engagement
    const engagementEvents = ['click', 'scroll', 'keypress'];
    const trackEngagement = () => {
      setUserEngagement((prev) => prev + 1);
    };

    engagementEvents.forEach((event) => {
      document.addEventListener(event, trackEngagement, { passive: true });
    });

    // Check initial state
    updateState();
    if (capabilities.installable && !capabilities.installed && autoShow && !dismissedPermanently) {
      // Delay initial prompt based on engagement
      setTimeout(() => {
        if (userEngagement >= 3) {
          setIsVisible(true);
        }
      }, 10000); // 10 seconds
    }

    return () => {
      enhancedPWAManager.off('installable', handleInstallable);
      enhancedPWAManager.off('installed', handleInstalled);
      engagementEvents.forEach((event) => {
        document.removeEventListener(event, trackEngagement);
      });
    };
  }, [
    autoShow,
    dismissedPermanently,
    capabilities.installable,
    capabilities.installed,
    userEngagement,
  ]);

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      const success = await enhancedPWAManager.showInstallPrompt();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleDismissPermanently = () => {
    localStorage.setItem('pwa-install-dismissed-permanently', 'true');
    setDismissedPermanently(true);
    setIsVisible(false);
  };

  // Don't show if already installed, not installable, or dismissed permanently
  if (!isVisible || capabilities.installed || !capabilities.installable || dismissedPermanently) {
    return null;
  }

  const getEngagementLevel = () => {
    if (userEngagement >= 20) return 'high';
    if (userEngagement >= 10) return 'medium';
    return 'low';
  };

  const getEngagementMessage = () => {
    const level = getEngagementLevel();
    switch (level) {
      case 'high':
        return "You're actively using LinearTime! Install it for the best experience.";
      case 'medium':
        return 'Enjoying LinearTime? Install it to access it quickly anytime.';
      default:
        return 'Get the full LinearTime experience with our desktop app.';
    }
  };

  const getBenefits = () => [
    {
      icon: Zap,
      title: 'Faster Performance',
      description: 'Lightning-fast loading and smooth interactions',
    },
    {
      icon: Wifi,
      title: 'Works Offline',
      description: 'Access your calendar even without internet',
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Never miss important events and reminders',
    },
    {
      icon: Smartphone,
      title: 'Native Experience',
      description: 'Feels like a real desktop application',
    },
  ];

  const renderBanner = () => (
    <div
      className={`fixed left-4 right-4 z-50 ${position === 'top' ? 'top-4' : 'bottom-4'} md:left-auto md:right-4 md:w-96`}
    >
      <Card className="shadow-lg border border-border bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Install LinearTime</h3>
              <p className="text-xs text-muted-foreground mb-3">{getEngagementMessage()}</p>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Smartphone className="w-3 h-3" />
                  <span>Works offline</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Monitor className="w-3 h-3" />
                  <span>Desktop app</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  <span>Faster</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1"
                >
                  {isInstalling ? (
                    <>
                      <Download className="w-3 h-3 mr-1 animate-pulse" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      Install
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDismiss} className="px-3">
                  Later
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissPermanently}
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCard = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Download className="w-8 h-8 text-primary" />
        </div>
        <CardTitle>Install LinearTime</CardTitle>
        <CardDescription>{getEngagementMessage()}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Engagement indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Your engagement</span>
            <Badge variant={getEngagementLevel() === 'high' ? 'default' : 'secondary'}>
              {getEngagementLevel()}
            </Badge>
          </div>
          <Progress value={(userEngagement / 25) * 100} className="h-2" />
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-2 gap-3">
          {getBenefits().map((benefit, index) => (
            <div key={index} className="text-center p-3 bg-muted/50 rounded-lg">
              <benefit.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <h4 className="font-medium text-xs mb-1">{benefit.title}</h4>
              <p className="text-xs text-muted-foreground leading-tight">{benefit.description}</p>
            </div>
          ))}
        </div>

        {showMetrics && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Usage Stats</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>{metrics.pageViews} visits</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-muted-foreground" />
                <span>{metrics.engagementEvents} interactions</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleInstall} disabled={isInstalling} className="flex-1">
            {isInstalling ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-pulse" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Install App
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
        </div>

        <button
          onClick={handleDismissPermanently}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Don't show this again
        </button>
      </CardContent>
    </Card>
  );

  const renderModal = () => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="relative">{renderCard()}</div>
    </div>
  );

  switch (variant) {
    case 'card':
      return renderCard();
    case 'modal':
      return renderModal();
    default:
      return renderBanner();
  }
}

export default EnhancedInstallPrompt;
