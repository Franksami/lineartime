'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useAutoAnimate, useAutoAnimateModal } from '@/hooks/useAutoAnimate';
import { Settings, X } from 'lucide-react';
import * as React from 'react';
import { AppearanceSettings } from './sections/AppearanceSettings';
import { BillingSettings } from './sections/BillingSettings';
import { CalendarSettings } from './sections/CalendarSettings';
import { NotificationSettings } from './sections/NotificationSettings';
import { PrivacySettings } from './sections/PrivacySettings';
import { ShortcutSettings } from './sections/ShortcutSettings';
import { TimeSettings } from './sections/TimeSettings';

interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function SettingsDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: SettingsDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const { resetSettings, exportSettings, importSettings } = useSettingsContext();

  // AutoAnimate refs for smooth transitions
  const [modalContentRef] = useAutoAnimateModal();
  const [tabsContentRef] = useAutoAnimate({ duration: 300, easing: 'ease-in-out' });

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const success = await importSettings(file);
        if (success) {
          alert('Settings imported successfully!');
        } else {
          alert('Failed to import settings. Please check the file format.');
        }
      }
    };
    input.click();
  };

  return (
    <>
      {trigger || (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(true)}
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          ref={modalContentRef}
          className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Customize your LinearTime experience</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="appearance" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <div ref={tabsContentRef} className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="appearance" className="space-y-4">
                <AppearanceSettings />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <CalendarSettings />
              </TabsContent>

              <TabsContent value="time" className="space-y-4">
                <TimeSettings />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <NotificationSettings />
              </TabsContent>

              <TabsContent value="shortcuts" className="space-y-4">
                <ShortcutSettings />
              </TabsContent>

              <TabsContent value="privacy" className="space-y-4">
                <PrivacySettings />
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                <BillingSettings />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleImport}>
                Import Settings
              </Button>
              <Button variant="outline" size="sm" onClick={exportSettings}>
                Export Settings
              </Button>
            </div>
            <div className="space-x-2">
              <Button variant="destructive" size="sm" onClick={resetSettings}>
                Reset All
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
