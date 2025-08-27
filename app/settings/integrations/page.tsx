'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Provider configurations
const PROVIDERS = [
  {
    id: 'google',
    name: 'Google Calendar',
    description: 'Sync with Google Calendar for seamless event management',
    icon: '📅',
    color: '#4285F4',
    authUrl: '/api/auth/google',
  },
  {
    id: 'microsoft',
    name: 'Microsoft Outlook',
    description: 'Connect your Outlook calendar and Microsoft 365 events',
    icon: '📊',
    color: '#00BCF2',
    authUrl: '/api/auth/microsoft',
    comingSoon: true,
  },
  {
    id: 'apple',
    name: 'Apple Calendar',
    description: 'Sync with iCloud Calendar using CalDAV',
    icon: '🍎',
    color: '#000000',
    authUrl: '/api/auth/caldav/apple',
    comingSoon: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect your Notion databases as calendars',
    icon: '📝',
    color: '#000000',
    authUrl: '/api/auth/notion',
    comingSoon: true,
  },
];

export default function IntegrationsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Convex queries and mutations
  const connectedProviders = useQuery(api.calendar.providers.getConnectedProviders);
  const disconnectProvider = useMutation(api.calendar.providers.disconnectProvider);
  const updateProviderSettings = useMutation(api.calendar.providers.updateProviderSettings);
  const syncQueueStatus = useQuery(api.calendar.sync.getSyncQueueStatus);
  const scheduleSync = useMutation(api.calendar.sync.scheduleSync);

  // Handle OAuth callback results
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const calendars = searchParams.get('calendars');

    if (success) {
      toast({
        title: 'Connection successful!',
        description:
          success === 'google_connected'
            ? `Connected to Google Calendar${calendars ? ` (${calendars} calendars found)` : ''}`
            : 'Calendar provider connected successfully',
      });
    }

    if (error) {
      toast({
        title: 'Connection failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'access_denied':
        return 'You denied access to your calendar';
      case 'invalid_state':
        return 'Invalid authentication state. Please try again.';
      case 'state_expired':
        return 'Authentication expired. Please try again.';
      case 'unauthorized':
        return 'You must be logged in to connect calendars';
      case 'callback_failed':
        return 'Failed to process callback. Please try again.';
      default:
        return `An error occurred: ${error}`;
    }
  };

  const handleConnect = (providerId: string, authUrl: string) => {
    setIsConnecting(providerId);
    window.location.href = authUrl;
  };

  const handleDisconnect = async (provider: any) => {
    try {
      await disconnectProvider({ provider: provider.provider });
      toast({
        title: 'Disconnected',
        description: `${provider.provider} calendar has been disconnected`,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect provider',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async (provider: any) => {
    try {
      await scheduleSync({
        provider: provider.provider,
        operation: 'incremental_sync',
        priority: 8,
      });
      toast({
        title: 'Sync scheduled',
        description: 'Your calendars will be synced shortly',
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule sync',
        variant: 'destructive',
      });
    }
  };

  const handleCalendarToggle = async (provider: any, calendarId: string, enabled: boolean) => {
    try {
      const updatedCalendars = provider.settings.calendars.map((cal: any) =>
        cal.id === calendarId ? { ...cal, syncEnabled: enabled } : cal
      );

      await updateProviderSettings({
        provider: provider.provider,
        settings: {
          ...provider.settings,
          calendars: updatedCalendars,
        },
      });

      toast({
        title: enabled ? 'Calendar enabled' : 'Calendar disabled',
        description: `Sync ${enabled ? 'enabled' : 'disabled'} for this calendar`,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to update calendar settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Calendar Integrations</h1>
        <p className="text-muted-foreground">
          Connect your calendars to sync events across all your platforms
        </p>
      </div>

      {/* Sync Status */}
      {syncQueueStatus && (syncQueueStatus.pending > 0 || syncQueueStatus.processing > 0) && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  Syncing: {syncQueueStatus.processing} in progress, {syncQueueStatus.pending}{' '}
                  pending
                </span>
              </div>
              <Badge variant="secondary">{syncQueueStatus.completed} completed</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const connected = connectedProviders?.find((p) => p.provider === provider.id);

          return (
            <Card key={provider.id} className="relative">
              {provider.comingSoon && (
                <Badge variant="secondary" className="absolute top-4 right-4">
                  Coming Soon
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{provider.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription className="mt-1">{provider.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleSync(connected)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(connected)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {connected.lastSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {new Date(connected.lastSyncAt).toLocaleString()}
                      </p>
                    )}

                    {/* Calendar List */}
                    {connected.settings.calendars.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        <p className="text-sm font-medium mb-2">Calendars:</p>
                        {connected.settings.calendars.map((calendar: any) => (
                          <div
                            key={calendar.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: calendar.color }}
                              />
                              <span>{calendar.name}</span>
                              {calendar.isPrimary && (
                                <Badge variant="secondary" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <Switch
                              checked={calendar.syncEnabled}
                              onCheckedChange={(checked) =>
                                handleCalendarToggle(connected, calendar.id, checked)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(provider.id, provider.authUrl)}
                    disabled={provider.comingSoon || isConnecting === provider.id}
                  >
                    {isConnecting === provider.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Connect {provider.name}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Learn more about calendar integrations and troubleshooting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a
              href="/docs/integrations"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Integration Guide
            </a>
            <a
              href="/docs/troubleshooting"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <AlertCircle className="h-4 w-4" />
              Troubleshooting
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
