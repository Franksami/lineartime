'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notify } from '@/components/ui/notify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronRight,
  Cloud,
  CloudOff,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

type Provider = 'google' | 'microsoft' | 'apple' | 'caldav' | 'notion' | 'obsidian';

interface ProviderConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  authType: 'oauth' | 'basic' | 'api';
  description: string;
  setupInstructions?: string[];
}

const providerConfigs: Record<Provider, ProviderConfig> = {
  google: {
    name: 'Google Calendar',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    color: 'bg-primary',
    authType: 'oauth',
    description: 'Sync with Google Calendar for seamless integration with your Google Workspace',
    setupInstructions: [
      'Click "Connect" to authorize Command Center Calendar',
      'Select the calendars you want to sync',
      'Events will sync automatically in real-time',
    ],
  },
  microsoft: {
    name: 'Microsoft Outlook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.4 11.4H2.6V2.6h8.8v8.8zm10 0h-8.8V2.6h8.8v8.8zm-10 10H2.6v-8.8h8.8v8.8zm10 0h-8.8v-8.8h8.8v8.8z" />
      </svg>
    ),
    color: 'bg-blue-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
    authType: 'oauth',
    description: 'Connect with Outlook and Microsoft 365 calendars',
    setupInstructions: [
      'Click "Connect" to sign in with Microsoft',
      'Grant calendar permissions',
      'Your Outlook events will sync automatically',
    ],
  },
  apple: {
    name: 'Apple iCloud',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09v-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
    color: 'bg-gray-800 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
    authType: 'basic',
    description: 'Sync with iCloud Calendar using app-specific passwords',
    setupInstructions: [
      'Generate an app-specific password at appleid.apple.com',
      'Enter your Apple ID and app-specific password',
      'Select calendars to sync',
    ],
  },
  caldav: {
    name: 'CalDAV Server',
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-green-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
    authType: 'basic',
    description: 'Connect to any CalDAV-compatible calendar server',
    setupInstructions: [
      'Enter your CalDAV server URL',
      'Provide your username and password',
      'Test connection and select calendars',
    ],
  },
  notion: {
    name: 'Notion Calendar',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
      </svg>
    ),
    color: 'bg-gray-700 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
    authType: 'api',
    description: 'Sync calendar databases from Notion',
    setupInstructions: [
      'Create an integration at notion.so/my-integrations',
      'Share your calendar database with the integration',
      'Enter your integration token',
    ],
  },
  obsidian: {
    name: 'Obsidian',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.645 6.143L15.858 2.61a3.475 3.475 0 00-1.19-.863L8.379.018a.415.415 0 00-.49.324L6.16 8.097 3.2 14.625l-1.666 3.318a.776.776 0 00.045.785l3.92 5.896c.177.267.572.306.806.087l7.306-6.847 6.69-6.047a1.816 1.816 0 00.393-2.387l-2.05-3.287zm-2.468 4.785l-3.52 3.194c-.115.104-.186.257-.195.416l-.264 4.453-3.268 3.066-2.264-3.4a.596.596 0 00-.185-.197l-2.89-1.927 1.03-2.062 3.095-5.625.867-1.565 3.143.987c.145.046.263.144.33.274l1.66 3.195a.57.57 0 01-.076.608l-1.318 1.58 2.242 1.492c.297.198.363.607.153.901l-.74.96z" />
      </svg>
    ),
    color: 'bg-purple-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
    authType: 'api',
    description: 'Sync events from Obsidian Daily Notes',
    setupInstructions: [
      'Install the Obsidian Calendar plugin',
      'Enable the API in plugin settings',
      'Enter your vault path and API key',
    ],
  },
};

export function CalendarIntegrations() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [_showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [_currentProviderId, setCurrentProviderId] = useState<Id<'calendarProviders'> | null>(null);

  // CalDAV specific state
  const [caldavForm, setCaldavForm] = useState({
    serverUrl: '',
    username: '',
    password: '',
    providerName: 'CalDAV',
  });

  // Apple specific state
  const [appleForm, setAppleForm] = useState({
    email: '',
    password: '',
  });

  // Convex queries
  const providers = useQuery(api.calendar.providers.getConnectedProviders);
  const syncQueue = useQuery(api.calendar.sync.getSyncQueueStatus);

  // Convex mutations
  const disconnectProvider = useMutation(api.calendar.providers.disconnectProvider);
  const _updateProviderSettings = useMutation(api.calendar.providers.updateProviderSettings);
  const scheduleSync = useMutation(api.calendar.sync.scheduleSync);
  const clearCompletedSyncItems = useMutation(api.calendar.sync.clearCompletedSyncItems);
  const retryFailedSyncItems = useMutation(api.calendar.sync.retryFailedSyncItems);

  const handleConnect = async (provider: Provider) => {
    setIsConnecting(true);

    try {
      switch (provider) {
        case 'google':
          // Redirect to Google OAuth
          window.location.href = '/api/auth/google';
          break;

        case 'microsoft':
          // Redirect to Microsoft OAuth
          window.location.href = '/api/auth/microsoft';
          break;

        case 'apple':
          // Show Apple credentials dialog
          setSelectedProvider('apple');
          setShowConnectDialog(true);
          setIsConnecting(false);
          break;

        case 'caldav':
          // Show CalDAV credentials dialog
          setSelectedProvider('caldav');
          setShowConnectDialog(true);
          setIsConnecting(false);
          break;

        case 'notion':
        case 'obsidian':
          notify.info(`${providerConfigs[provider].name} integration coming soon!`);
          setIsConnecting(false);
          break;
      }
    } catch (error) {
      console.error('Connection error:', error);
      notify.error('Failed to connect provider');
      setIsConnecting(false);
    }
  };

  const handleAppleConnect = async () => {
    setIsConnecting(true);

    try {
      const response = await fetch('/api/auth/caldav/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appleForm),
      });

      const data = await response.json();

      if (response.ok) {
        notify.success('Apple iCloud calendar connected!');
        setShowConnectDialog(false);
        setAppleForm({ email: '', password: '' });
      } else {
        notify.error(data.error || 'Failed to connect Apple calendar');
      }
    } catch (error) {
      console.error('Apple connection error:', error);
      notify.error('Failed to connect Apple calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCalDAVConnect = async () => {
    setIsConnecting(true);

    try {
      const response = await fetch('/api/auth/caldav/generic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caldavForm),
      });

      const data = await response.json();

      if (response.ok) {
        notify.success(`${caldavForm.providerName} connected!`);
        setShowConnectDialog(false);
        setCaldavForm({ serverUrl: '', username: '', password: '', providerName: 'CalDAV' });
      } else {
        notify.error(data.error || 'Failed to connect CalDAV server');
      }
    } catch (error) {
      console.error('CalDAV connection error:', error);
      notify.error('Failed to connect CalDAV server');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (provider: Provider) => {
    try {
      await disconnectProvider({ provider });
      notify.success(`${providerConfigs[provider].name} disconnected`);
    } catch (error) {
      console.error('Disconnect error:', error);
      notify.error('Failed to disconnect provider');
    }
  };

  const handleSync = async (provider: Provider) => {
    try {
      await scheduleSync({
        provider,
        operation: 'incremental_sync',
        priority: 5,
      });
      notify.info(`Syncing ${providerConfigs[provider].name}...`);
    } catch (error) {
      console.error('Sync error:', error);
      notify.error('Failed to start sync');
    }
  };

  const handleClearCompleted = async () => {
    try {
      const count = await clearCompletedSyncItems();
      notify.success(`Cleared ${count} completed sync items`);
    } catch (error) {
      console.error('Clear error:', error);
      notify.error('Failed to clear sync items');
    }
  };

  const handleRetryFailed = async () => {
    try {
      const count = await retryFailedSyncItems();
      notify.success(`Retrying ${count} failed sync items`);
    } catch (error) {
      console.error('Retry error:', error);
      notify.error('Failed to retry sync items');
    }
  };

  const connectedProviders = providers || [];
  const isProviderConnected = (provider: Provider) =>
    connectedProviders.some((p) => p.provider === provider);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calendar Integrations</h2>
        <p className="text-muted-foreground">
          Connect your calendars to sync events across all your platforms
        </p>
      </div>

      {/* Sync Status Overview */}
      {syncQueue && (syncQueue.pending > 0 || syncQueue.processing > 0 || syncQueue.failed > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                {syncQueue.processing > 0 && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">{syncQueue.processing} syncing</span>
                  </div>
                )}
                {syncQueue.pending > 0 && (
                  <Badge variant="secondary">{syncQueue.pending} pending</Badge>
                )}
                {syncQueue.completed > 0 && (
                  <Badge variant="outline">{syncQueue.completed} completed</Badge>
                )}
                {syncQueue.failed > 0 && (
                  <Badge variant="destructive">{syncQueue.failed} failed</Badge>
                )}
              </div>
              <div className="flex gap-2">
                {syncQueue.failed > 0 && (
                  <Button size="sm" variant="outline" onClick={handleRetryFailed}>
                    Retry Failed
                  </Button>
                )}
                {syncQueue.completed > 0 && (
                  <Button size="sm" variant="ghost" onClick={handleClearCompleted}>
                    Clear Completed
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Providers */}
      {connectedProviders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connected Calendars</h3>
          <div className="grid gap-4">
            {connectedProviders.map((provider) => {
              const config = providerConfigs[provider.provider as Provider];
              return (
                <Card key={provider._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color} text-white`}>
                          {config.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base">{config.name}</CardTitle>
                          <CardDescription>
                            Connected{' '}
                            {provider.lastSyncAt
                              ? format(new Date(provider.lastSyncAt), 'MMM d, h:mm a')
                              : 'Never synced'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSync(provider.provider as Provider)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCurrentProviderId(provider._id);
                            setShowSettingsDialog(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDisconnect(provider.provider as Provider)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {provider.settings?.calendars && (
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Synced Calendars:</p>
                        <div className="flex flex-wrap gap-2">
                          {provider.settings.calendars.map((cal: any) => (
                            <Badge key={cal.id} variant={cal.syncEnabled ? 'default' : 'outline'}>
                              {cal.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Providers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Integrations</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(providerConfigs).map(([key, config]) => {
            const provider = key as Provider;
            const connected = isProviderConnected(provider);

            return (
              <Card key={provider} className={connected ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color} text-white`}>{config.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{config.name}</CardTitle>
                      <CardDescription className="text-xs">{config.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={connected ? 'secondary' : 'default'}
                    disabled={connected || isConnecting}
                    onClick={() => handleConnect(provider)}
                  >
                    {connected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Connected
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connect Dialog for Basic Auth Providers */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Connect {selectedProvider && providerConfigs[selectedProvider].name}
            </DialogTitle>
            <DialogDescription>Enter your credentials to connect your calendar</DialogDescription>
          </DialogHeader>

          {selectedProvider === 'apple' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apple-id">Apple ID</Label>
                <Input
                  id="apple-id"
                  type="email"
                  placeholder="your@icloud.com"
                  value={appleForm.email}
                  onChange={(e) => setAppleForm({ ...appleForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-password">App-Specific Password</Label>
                <Input
                  id="app-password"
                  type="password"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  value={appleForm.password}
                  onChange={(e) => setAppleForm({ ...appleForm, password: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Generate an app-specific password at{' '}
                  <a
                    href="https://appleid.apple.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    appleid.apple.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {selectedProvider === 'caldav' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-url">Server URL</Label>
                <Input
                  id="server-url"
                  type="url"
                  placeholder="https://caldav.example.com"
                  value={caldavForm.serverUrl}
                  onChange={(e) => setCaldavForm({ ...caldavForm, serverUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={caldavForm.username}
                  onChange={(e) => setCaldavForm({ ...caldavForm, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={caldavForm.password}
                  onChange={(e) => setCaldavForm({ ...caldavForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-name">Provider Name (Optional)</Label>
                <Input
                  id="provider-name"
                  type="text"
                  placeholder="My CalDAV Server"
                  value={caldavForm.providerName}
                  onChange={(e) => setCaldavForm({ ...caldavForm, providerName: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={selectedProvider === 'apple' ? handleAppleConnect : handleCalDAVConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
