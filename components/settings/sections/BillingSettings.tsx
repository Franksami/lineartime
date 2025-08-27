'use client';

// BillingSettings component integrated with Clerk Billing
// Subscription data comes from Clerk via Convex webhook events
// User subscription management is handled by Clerk's PricingTable component

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  Users,
  Zap,
} from 'lucide-react';
import * as React from 'react';

export function BillingSettings() {
  const { user, isLoaded } = useUser();
  const subscriptionStatus = useQuery(api.billing.getSubscriptionStatus);
  const usageAnalytics = useQuery(api.billing.getUserUsageAnalytics);
  const planPermissions = useQuery(
    api.billing.getPlanPermissions,
    subscriptionStatus?.subscription
      ? { planType: subscriptionStatus.subscription.planType }
      : 'skip'
  );

  const initializeSubscription = useMutation(api.billing.initializeUserSubscription);
  const [isInitializing, setIsInitializing] = React.useState(false);

  // Initialize subscription for new users
  React.useEffect(() => {
    if (user && subscriptionStatus === null && !isInitializing) {
      setIsInitializing(true);
      initializeSubscription({
        clerkUserId: user.id,
        stripeCustomerId: '', // Will be set when user subscribes
      }).finally(() => setIsInitializing(false));
    }
  }, [user, subscriptionStatus, initializeSubscription, isInitializing]);

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 mx-auto text-secondary mb-2" />
          <p className="text-sm text-muted-foreground">Please sign in to manage billing</p>
        </div>
      </div>
    );
  }

  const subscription = subscriptionStatus?.subscription;
  const permissions = planPermissions;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-secondary text-secondary-foreground';
      case 'trialing':
        return 'bg-accent text-accent-foreground';
      case 'past_due':
        return 'bg-muted text-muted-foreground';
      case 'canceled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'pro':
        return <Crown className="h-4 w-4" />;
      case 'enterprise':
        return <Users className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const calculateUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const handleManageBilling = () => {
    // With Clerk billing, users manage subscriptions through Clerk's built-in UI
    // The billing portal is handled directly by Clerk's PricingTable component
    window.location.href = '/pricing';
  };

  const handleUpgrade = () => {
    // Navigate to pricing page with Clerk's PricingTable component
    window.location.href = '/pricing';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Billing & Subscription</h3>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getPlanIcon(subscription?.planName || 'Free')}
                <CardTitle>{subscription?.planName || 'Free'} Plan</CardTitle>
              </div>
              <Badge className={getStatusColor(subscription?.status || 'free')}>
                {subscription?.status || 'Free'}
              </Badge>
            </div>
            <CardDescription>
              {subscription?.status === 'active' && subscription?.currentPeriodEnd && (
                <>Next billing: {formatDate(subscription.currentPeriodEnd)}</>
              )}
              {subscription?.status === 'trialing' && subscription?.trialEnd && (
                <>Trial ends: {formatDate(subscription.trialEnd)}</>
              )}
              {subscription?.status === 'canceled' && subscription?.canceledAt && (
                <>Canceled: {formatDate(subscription.canceledAt)}</>
              )}
              {!subscription?.status && 'Get more features with a paid plan'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              {subscription?.planName !== 'Enterprise' && (
                <Button onClick={handleUpgrade}>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
              {subscription && (
                <Button variant="outline" onClick={handleManageBilling}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
              {subscription?.status === 'canceled' && (
                <Button variant="outline" onClick={handleUpgrade}>
                  Reactivate Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits */}
        {permissions && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
              <CardDescription>
                Current usage for the {subscription?.planName || 'Free'} plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Events Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Events</span>
                  <span>
                    {subscription?.usage?.currentEvents || 0} /{' '}
                    {permissions.features.maxEvents === -1 ? '∞' : permissions.features.maxEvents}
                  </span>
                </div>
                <Progress
                  value={calculateUsagePercentage(
                    subscription?.usage?.currentEvents || 0,
                    permissions.features.maxEvents
                  )}
                  className="h-2"
                />
              </div>

              {/* Calendars Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Calendars</span>
                  <span>
                    {subscription?.usage?.currentCalendars || 0} /{' '}
                    {permissions.features.maxCalendars}
                  </span>
                </div>
                <Progress
                  value={calculateUsagePercentage(
                    subscription?.usage?.currentCalendars || 0,
                    permissions.features.maxCalendars
                  )}
                  className="h-2"
                />
              </div>

              {/* AI Requests Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>AI Scheduling (this month)</span>
                  <span>
                    {subscription?.usage?.aiRequestsThisMonth || 0} /{' '}
                    {permissions.features.aiScheduling ? '∞' : '0'}
                  </span>
                </div>
                <Progress value={permissions.features.aiScheduling ? 0 : 100} className="h-2" />
              </div>

              {/* Calendar Sync Providers */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Calendar Sync Providers</span>
                  <span>
                    {subscription?.usage?.currentProviders || 0} /{' '}
                    {permissions.features.maxProviders}
                  </span>
                </div>
                <Progress
                  value={calculateUsagePercentage(
                    subscription?.usage?.currentProviders || 0,
                    permissions.features.maxProviders
                  )}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {permissions && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>Available features with your current plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  {permissions.features.aiScheduling ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">AI Scheduling</span>
                </div>

                <div className="flex items-center space-x-2">
                  {permissions.features.calendarSync ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Calendar Sync</span>
                </div>

                <div className="flex items-center space-x-2">
                  {permissions.features.analytics ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Analytics</span>
                </div>

                <div className="flex items-center space-x-2">
                  {permissions.features.prioritySupport ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Priority Support</span>
                </div>

                <div className="flex items-center space-x-2">
                  {permissions.features.customThemes ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Custom Themes</span>
                </div>

                <div className="flex items-center space-x-2">
                  {permissions.features.exportData ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Data Export</span>
                </div>

                <div className="flex items-center space-x-2">
                  {permissions.features.teamSharing ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Team Sharing</span>
                </div>

                <div className="flex items-center space-x-2">
                  {permissions.features.apiAccess ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">API Access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        {usageAnalytics && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>Historical usage data</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Events Created This Month</span>
                  <span>{usageAnalytics.currentPeriod?.eventsCreated || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>AI Scheduling Requests</span>
                  <span>{usageAnalytics.currentPeriod?.aiSchedulingRequests || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Calendar Sync Operations</span>
                  <span>{usageAnalytics.currentPeriod?.calendarSyncOperations || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Storage Used</span>
                  <span>{(usageAnalytics.currentPeriod?.storageUsedMB || 0).toFixed(1)} MB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
