/**
 * AppShell Provider - Command Workspace State Management
 * Research-validated workspace state patterns with Zustand
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * App Shell State Interface
 */
interface AppShellState {
  // Active view management (views/week, views/planner, etc.)
  activeView: string;
  previousView: string;

  // Tab management with persistence
  openTabs: Array<{
    id: string;
    view: string;
    title: string;
    pinned?: boolean;
  }>;
  activeTabId: string;

  // Context dock panel management
  dockPanels: {
    ai: boolean;
    details: boolean;
    conflicts: boolean;
    capacity: boolean;
    backlinks: boolean;
  };
  activeDockPanel: string | null;
  dockSize: number; // Panel width percentage

  // Layout persistence (research-validated from Obsidian)
  savedLayouts: Record<
    string,
    {
      name: string;
      sidebarSize: number;
      dockSize: number;
      dockPanels: typeof AppShellState.prototype.dockPanels;
      openTabs: typeof AppShellState.prototype.openTabs;
      activeView: string;
      createdAt: string;
    }
  >;

  // Workspace preferences
  preferences: {
    sidebarCollapsed: boolean;
    dockCollapsed: boolean;
    compactMode: boolean;
    keyboardShortcutsEnabled: boolean;
  };

  // Performance monitoring
  performance: {
    renderTimes: number[];
    lastRender: number;
    averageRenderTime: number;
  };
}

/**
 * App Shell Actions Interface
 */
interface AppShellActions {
  // View management
  setActiveView: (view: string) => void;
  navigateToView: (view: string, openInNewTab?: boolean) => void;

  // Tab management
  openTab: (view: string, title: string, pinned?: boolean) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;

  // Dock panel management
  toggleDockPanel: (panel: keyof AppShellState['dockPanels']) => void;
  setActiveDockPanel: (panel: string | null) => void;
  setDockSize: (size: number) => void;

  // Layout management (Obsidian patterns)
  saveLayout: (name: string) => void;
  loadLayout: (name: string) => void;
  deleteLayout: (name: string) => void;

  // Preferences
  toggleSidebarCollapsed: () => void;
  toggleDockCollapsed: () => void;
  setCompactMode: (enabled: boolean) => void;

  // Performance tracking
  recordRenderTime: (time: number) => void;
  resetPerformanceMetrics: () => void;

  // Utility actions
  reset: () => void;
}

/**
 * Default state values
 */
const DEFAULT_STATE: AppShellState = {
  activeView: 'week',
  previousView: '',

  openTabs: [{ id: 'week-tab', view: 'week', title: 'Week View', pinned: true }],
  activeTabId: 'week-tab',

  dockPanels: {
    ai: true,
    details: false,
    conflicts: false,
    capacity: false,
    backlinks: false,
  },
  activeDockPanel: 'ai',
  dockSize: 20,

  savedLayouts: {},

  preferences: {
    sidebarCollapsed: false,
    dockCollapsed: false,
    compactMode: false,
    keyboardShortcutsEnabled: true,
  },

  performance: {
    renderTimes: [],
    lastRender: 0,
    averageRenderTime: 0,
  },
};

/**
 * Zustand store with persistence and performance tracking
 */
export const useAppShell = create<AppShellState & AppShellActions>()(
  persist(
    immer((set, get) => ({
      ...DEFAULT_STATE,

      // View management
      setActiveView: (view: string) =>
        set((state) => {
          state.previousView = state.activeView;
          state.activeView = view;
        }),

      navigateToView: (view: string, openInNewTab = false) =>
        set((state) => {
          if (openInNewTab) {
            const tabId = `${view}-${Date.now()}`;
            state.openTabs.push({
              id: tabId,
              view,
              title: view.charAt(0).toUpperCase() + view.slice(1),
              pinned: false,
            });
            state.activeTabId = tabId;
          } else {
            state.previousView = state.activeView;
            state.activeView = view;
          }
        }),

      // Tab management
      openTab: (view: string, title: string, pinned = false) =>
        set((state) => {
          const tabId = `${view}-${Date.now()}`;
          state.openTabs.push({ id: tabId, view, title, pinned });
          state.activeTabId = tabId;
        }),

      closeTab: (tabId: string) =>
        set((state) => {
          const tabIndex = state.openTabs.findIndex((tab) => tab.id === tabId);
          if (tabIndex === -1 || state.openTabs[tabIndex]?.pinned) return;

          state.openTabs.splice(tabIndex, 1);

          // Switch to another tab if current tab was closed
          if (state.activeTabId === tabId && state.openTabs.length > 0) {
            state.activeTabId = state.openTabs[Math.max(0, tabIndex - 1)].id;
          }
        }),

      setActiveTab: (tabId: string) =>
        set((state) => {
          state.activeTabId = tabId;
          const tab = state.openTabs.find((t) => t.id === tabId);
          if (tab) {
            state.activeView = tab.view;
          }
        }),

      pinTab: (tabId: string) =>
        set((state) => {
          const tab = state.openTabs.find((t) => t.id === tabId);
          if (tab) tab.pinned = true;
        }),

      unpinTab: (tabId: string) =>
        set((state) => {
          const tab = state.openTabs.find((t) => t.id === tabId);
          if (tab) tab.pinned = false;
        }),

      // Dock panel management
      toggleDockPanel: (panel: keyof AppShellState['dockPanels']) =>
        set((state) => {
          state.dockPanels[panel] = !state.dockPanels[panel];
          if (state.dockPanels[panel]) {
            state.activeDockPanel = panel;
          }
        }),

      setActiveDockPanel: (panel: string | null) =>
        set((state) => {
          state.activeDockPanel = panel;
        }),

      setDockSize: (size: number) =>
        set((state) => {
          state.dockSize = Math.max(15, Math.min(40, size));
        }),

      // Layout management (Obsidian workspace patterns)
      saveLayout: (name: string) =>
        set((state) => {
          state.savedLayouts[name] = {
            name,
            sidebarSize: 20, // TODO: Get from panel state
            dockSize: state.dockSize,
            dockPanels: { ...state.dockPanels },
            openTabs: [...state.openTabs],
            activeView: state.activeView,
            createdAt: new Date().toISOString(),
          };
        }),

      loadLayout: (name: string) =>
        set((state) => {
          const layout = state.savedLayouts[name];
          if (!layout) return;

          state.dockSize = layout.dockSize;
          state.dockPanels = { ...layout.dockPanels };
          state.openTabs = [...layout.openTabs];
          state.activeView = layout.activeView;
          state.activeTabId =
            layout.openTabs.find((t) => t.view === layout.activeView)?.id ||
            layout.openTabs[0]?.id ||
            '';
        }),

      deleteLayout: (name: string) =>
        set((state) => {
          delete state.savedLayouts[name];
        }),

      // Preferences
      toggleSidebarCollapsed: () =>
        set((state) => {
          state.preferences.sidebarCollapsed = !state.preferences.sidebarCollapsed;
        }),

      toggleDockCollapsed: () =>
        set((state) => {
          state.preferences.dockCollapsed = !state.preferences.dockCollapsed;
        }),

      setCompactMode: (enabled: boolean) =>
        set((state) => {
          state.preferences.compactMode = enabled;
        }),

      // Performance tracking
      recordRenderTime: (time: number) =>
        set((state) => {
          state.performance.renderTimes.push(time);
          // Keep only last 10 measurements
          if (state.performance.renderTimes.length > 10) {
            state.performance.renderTimes.shift();
          }
          state.performance.lastRender = time;
          state.performance.averageRenderTime =
            state.performance.renderTimes.reduce((a, b) => a + b, 0) /
            state.performance.renderTimes.length;
        }),

      resetPerformanceMetrics: () =>
        set((state) => {
          state.performance = { renderTimes: [], lastRender: 0, averageRenderTime: 0 };
        }),

      // Reset to default state
      reset: () => set(() => ({ ...DEFAULT_STATE })),
    })),
    {
      name: 'command-workspace-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist important user preferences, not temporary state
      partialize: (state) => ({
        savedLayouts: state.savedLayouts,
        preferences: state.preferences,
        dockSize: state.dockSize,
        dockPanels: state.dockPanels,
      }),
    }
  )
);

/**
 * Performance monitoring hook for AppShell
 */
export function useAppShellPerformance() {
  const { recordRenderTime, performance } = useAppShell();

  return {
    recordRender: recordRenderTime,
    metrics: performance,
    isPerformant: performance.averageRenderTime < 500, // Research target
    getStatus: () => ({
      average: performance.averageRenderTime,
      last: performance.lastRender,
      target: 500,
      status: performance.averageRenderTime < 500 ? 'good' : 'needs-optimization',
    }),
  };
}

/**
 * Workspace layout utilities
 */
export const WorkspaceLayoutUtils = {
  /**
   * Export layout for sharing (research: Obsidian layout sharing)
   */
  exportLayout: (layoutName: string) => {
    const layout = useAppShell.getState().savedLayouts[layoutName];
    if (!layout) return null;

    return {
      ...layout,
      version: '2.0.0',
      exported: new Date().toISOString(),
    };
  },

  /**
   * Import layout from export
   */
  importLayout: (layoutData: any) => {
    if (layoutData.version !== '2.0.0') {
      throw new Error('Incompatible layout version');
    }

    useAppShell.getState().saveLayout(layoutData.name);
  },
};
