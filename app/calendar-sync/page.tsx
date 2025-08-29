'use client';

import { CommandCenterCalendarWithSync } from '@/components/calendar/LinearCalendarWithSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Info, Settings } from 'lucide-react';
import Link from 'next/link';

export default function CalendarSyncPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Command Center Calendar Calendar</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/settings/integrations">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Calendar Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <Card className="bg-blue-50 /* TODO: Use semantic token */ dark:bg-blue-950 /* TODO: Use semantic token *//20 border-blue-200 /* TODO: Use semantic token */ dark:border-blue-800 /* TODO: Use semantic token */">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 /* TODO: Use semantic token */ dark:text-blue-400 /* TODO: Use semantic token */ mt-0.5" />
              <div>
                <CardTitle className="text-base">Calendar Sync Enabled</CardTitle>
                <CardDescription className="mt-1">
                  Your calendar is syncing with external providers. Events will update
                  automatically. Connect more calendars in{' '}
                  <Link href="/settings/integrations" className="underline">
                    Settings → Integrations
                  </Link>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Calendar Component */}
      <div className="container max-w-7xl mx-auto px-4 pb-8">
        <CommandCenterCalendarWithSync initialYear={new Date().getFullYear()} enableSync={true} />
      </div>

      {/* Features Section */}
      <div className="border-t bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-lg font-semibold mb-4">Calendar Sync Features</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Real-time Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Events sync automatically across all connected calendars
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Conflict Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Smart conflict detection with easy resolution options
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Multiple Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Support for Google, Microsoft, Apple, and CalDAV
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Secure Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  End-to-end encryption for all calendar data
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
