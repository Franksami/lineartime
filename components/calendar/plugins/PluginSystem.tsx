'use client';

import { notify } from '@/components/ui/notify';
import type { Event } from '@/types/calendar';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Plugin Interface Definition
export interface CalendarPlugin {
  name: string;
  version: string;
  description: string;
  author: string;

  // Lifecycle hooks
  install?: (api: PluginAPI) => void;
  uninstall?: () => void;
  activate?: () => void;
  deactivate?: () => void;

  // Event hooks
  onEventCreate?: (event: Event) => Event | undefined;
  onEventUpdate?: (event: Event, oldEvent: Event) => Event | undefined;
  onEventDelete?: (event: Event) => boolean | undefined; // return false to prevent deletion
  onDateSelect?: (date: Date) => void;

  // UI hooks
  renderEventActions?: (event: Event) => React.ReactNode;
  renderCalendarHeader?: () => React.ReactNode;
  renderSidebar?: () => React.ReactNode;

  // Settings
  settings?: Record<string, any>;
  configurable?: boolean;
}

// Plugin API for interacting with the calendar
export interface PluginAPI {
  // Event management
  createEvent: (event: Partial<Event>) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  getEvents: () => Event[];
  getEvent: (eventId: string) => Event | undefined;

  // Navigation
  goToDate: (date: Date) => void;
  goToToday: () => void;

  // Notifications
  notify: typeof notify;

  // Settings
  getSetting: (key: string) => any;
  setSetting: (key: string, value: any) => void;

  // UI state
  openEventPopup: (event: Event) => void;
  closeEventPopup: () => void;

  // Custom actions
  registerAction: (name: string, action: (...args: any[]) => any) => void;
  executeAction: (name: string, ...args: any[]) => any;
}

// Plugin Manager Context
interface PluginManagerState {
  installedPlugins: Map<string, CalendarPlugin>;
  activePlugins: Set<string>;
  pluginAPI: PluginAPI;
}

interface PluginManagerContextType extends PluginManagerState {
  installPlugin: (plugin: CalendarPlugin) => void;
  uninstallPlugin: (pluginName: string) => void;
  activatePlugin: (pluginName: string) => void;
  deactivatePlugin: (pluginName: string) => void;
  getPlugin: (pluginName: string) => CalendarPlugin | undefined;
  isPluginActive: (pluginName: string) => boolean;
}

const PluginManagerContext = createContext<PluginManagerContextType | null>(null);

// Plugin Manager Provider
interface PluginManagerProviderProps {
  children: React.ReactNode;
  events: Event[];
  onEventCreate: (event: Partial<Event>) => void;
  onEventUpdate: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
  onDateSelect?: (date: Date) => void;
}

export function PluginManagerProvider({
  children,
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateSelect,
}: PluginManagerProviderProps) {
  const [installedPlugins] = useState<Map<string, CalendarPlugin>>(new Map());
  const [activePlugins, setActivePlugins] = useState<Set<string>>(new Set());
  const [customActions] = useState<Map<string, (...args: any[]) => any>>(new Map());
  const [settings] = useState<Map<string, any>>(new Map());

  // Create Plugin API
  const pluginAPI: PluginAPI = {
    createEvent: onEventCreate,
    updateEvent: (eventId: string, updates: Partial<Event>) => {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        onEventUpdate({ ...event, ...updates });
      }
    },
    deleteEvent: onEventDelete,
    getEvents: () => events,
    getEvent: (eventId: string) => events.find((e) => e.id === eventId),
    goToDate: (date: Date) => {
      // Implementation would depend on calendar state management
      notify.info(`Navigating to ${date.toDateString()}`);
    },
    goToToday: () => {
      // Implementation would depend on calendar state management
      notify.info('Navigating to today');
    },
    notify,
    getSetting: (key: string) => settings.get(key),
    setSetting: (key: string, value: any) => settings.set(key, value),
    openEventPopup: (event: Event) => {
      // Implementation would depend on popup state management
      notify.info(`Opening popup for ${event.title}`);
    },
    closeEventPopup: () => {
      // Implementation would depend on popup state management
      notify.info('Closing event popup');
    },
    registerAction: (name: string, action: (...args: any[]) => any) => {
      customActions.set(name, action);
    },
    executeAction: (name: string, ...args: any[]) => {
      const action = customActions.get(name);
      if (action) {
        return action(...args);
      }
      notify.error(`Action "${name}" not found`);
    },
  };

  const installPlugin = useCallback(
    (plugin: CalendarPlugin) => {
      if (installedPlugins.has(plugin.name)) {
        notify.warning(`Plugin "${plugin.name}" is already installed`);
        return;
      }

      try {
        // Install the plugin
        if (plugin.install) {
          plugin.install(pluginAPI);
        }

        installedPlugins.set(plugin.name, plugin);
        notify.success(`Plugin "${plugin.name}" installed successfully`);
      } catch (error) {
        notify.error(`Failed to install plugin "${plugin.name}": ${error}`);
      }
    },
    [installedPlugins, pluginAPI]
  );

  const uninstallPlugin = useCallback(
    (pluginName: string) => {
      const plugin = installedPlugins.get(pluginName);
      if (!plugin) {
        notify.warning(`Plugin "${pluginName}" is not installed`);
        return;
      }

      try {
        // Deactivate if active
        if (activePlugins.has(pluginName)) {
          deactivatePlugin(pluginName);
        }

        // Uninstall
        if (plugin.uninstall) {
          plugin.uninstall();
        }

        installedPlugins.delete(pluginName);
        notify.success(`Plugin "${pluginName}" uninstalled successfully`);
      } catch (error) {
        notify.error(`Failed to uninstall plugin "${pluginName}": ${error}`);
      }
    },
    [installedPlugins, activePlugins]
  );

  const activatePlugin = useCallback(
    (pluginName: string) => {
      const plugin = installedPlugins.get(pluginName);
      if (!plugin) {
        notify.warning(`Plugin "${pluginName}" is not installed`);
        return;
      }

      if (activePlugins.has(pluginName)) {
        notify.warning(`Plugin "${pluginName}" is already active`);
        return;
      }

      try {
        if (plugin.activate) {
          plugin.activate();
        }

        setActivePlugins((prev) => new Set([...prev, pluginName]));
        notify.success(`Plugin "${pluginName}" activated successfully`);
      } catch (error) {
        notify.error(`Failed to activate plugin "${pluginName}": ${error}`);
      }
    },
    [installedPlugins, activePlugins]
  );

  const deactivatePlugin = useCallback(
    (pluginName: string) => {
      const plugin = installedPlugins.get(pluginName);
      if (!plugin) {
        notify.warning(`Plugin "${pluginName}" is not installed`);
        return;
      }

      if (!activePlugins.has(pluginName)) {
        notify.warning(`Plugin "${pluginName}" is not active`);
        return;
      }

      try {
        if (plugin.deactivate) {
          plugin.deactivate();
        }

        setActivePlugins((prev) => {
          const next = new Set(prev);
          next.delete(pluginName);
          return next;
        });
        notify.success(`Plugin "${pluginName}" deactivated successfully`);
      } catch (error) {
        notify.error(`Failed to deactivate plugin "${pluginName}": ${error}`);
      }
    },
    [installedPlugins, activePlugins]
  );

  const getPlugin = useCallback(
    (pluginName: string) => {
      return installedPlugins.get(pluginName);
    },
    [installedPlugins]
  );

  const isPluginActive = useCallback(
    (pluginName: string) => {
      return activePlugins.has(pluginName);
    },
    [activePlugins]
  );

  const contextValue: PluginManagerContextType = {
    installedPlugins,
    activePlugins,
    pluginAPI,
    installPlugin,
    uninstallPlugin,
    activatePlugin,
    deactivatePlugin,
    getPlugin,
    isPluginActive,
  };

  return (
    <PluginManagerContext.Provider value={contextValue}>{children}</PluginManagerContext.Provider>
  );
}

// Hook to use Plugin Manager
export function usePluginManager() {
  const context = useContext(PluginManagerContext);
  if (!context) {
    throw new Error('usePluginManager must be used within a PluginManagerProvider');
  }
  return context;
}

// Hook for plugins to access the API
export function usePluginAPI() {
  const { pluginAPI } = usePluginManager();
  return pluginAPI;
}

// Plugin Event Hooks - for calendar components to call
export function usePluginEventHooks() {
  const { installedPlugins, activePlugins } = usePluginManager();

  const executeEventHook = useCallback(
    (hookName: keyof CalendarPlugin, ...args: any[]) => {
      const results: any[] = [];

      for (const pluginName of activePlugins) {
        const plugin = installedPlugins.get(pluginName);
        if (plugin && typeof plugin[hookName] === 'function') {
          try {
            const result = (plugin[hookName] as any)(...args);
            results.push(result);
          } catch (error) {
            console.error(`Error in plugin "${pluginName}" hook "${hookName}":`, error);
          }
        }
      }

      return results;
    },
    [installedPlugins, activePlugins]
  );

  return {
    onEventCreate: (event: Event) => executeEventHook('onEventCreate', event),
    onEventUpdate: (event: Event, oldEvent: Event) =>
      executeEventHook('onEventUpdate', event, oldEvent),
    onEventDelete: (event: Event) => executeEventHook('onEventDelete', event),
    onDateSelect: (date: Date) => executeEventHook('onDateSelect', date),
  };
}

// Sample Plugin Examples
export const samplePlugins = {
  // Event Statistics Plugin
  eventStatsPlugin: {
    name: 'Event Statistics',
    version: '1.0.0',
    description: 'Provides real-time statistics about events',
    author: 'LinearTime Team',

    install(api: PluginAPI) {
      api.registerAction('getEventStats', () => {
        const events = api.getEvents();
        return {
          total: events.length,
          byCategory: events.reduce(
            (acc, event) => {
              acc[event.category] = (acc[event.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        };
      });

      console.log('Event Statistics plugin installed');
    },

    onEventCreate(event: Event) {
      console.log(`New event created: ${event.title}`);
    },
  } as CalendarPlugin,

  // Quick Actions Plugin
  quickActionsPlugin: {
    name: 'Quick Actions',
    version: '1.0.0',
    description: 'Adds quick action buttons for common tasks',
    author: 'LinearTime Team',

    install(api: PluginAPI) {
      api.registerAction('duplicateEvent', (eventId: string) => {
        const event = api.getEvent(eventId);
        if (event) {
          api.createEvent({
            ...event,
            title: `${event.title} (Copy)`,
            id: undefined, // Let the system generate new ID
          });
          api.notify.success('Event duplicated');
        }
      });
    },

    renderEventActions(event: Event) {
      const api = usePluginAPI();
      return (
        <button
          onClick={() => api.executeAction('duplicateEvent', event.id)}
          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
        >
          Duplicate
        </button>
      );
    },
  } as CalendarPlugin,

  // Auto Backup Plugin
  autoBackupPlugin: {
    name: 'Auto Backup',
    version: '1.0.0',
    description: 'Automatically backs up events to local storage',
    author: 'LinearTime Team',

    settings: {
      backupInterval: 300000, // 5 minutes
      maxBackups: 10,
    },

    install(api: PluginAPI) {
      const backupEvents = () => {
        const events = api.getEvents();
        const backups = JSON.parse(localStorage.getItem('event-backups') || '[]');
        backups.unshift({
          timestamp: new Date().toISOString(),
          events,
        });

        // Keep only the latest backups
        const maxBackups = api.getSetting('maxBackups') || 10;
        backups.splice(maxBackups);

        localStorage.setItem('event-backups', JSON.stringify(backups));
        console.log('Events backed up automatically');
      };

      // Start backup interval
      const interval = setInterval(backupEvents, api.getSetting('backupInterval') || 300000);
      api.setSetting('backupInterval', interval);
    },

    uninstall() {
      const interval = this.settings?.backupInterval;
      if (interval) {
        clearInterval(interval);
      }
    },
  } as CalendarPlugin,
};
