'use client';

import type React from 'react';
import { type ReactNode, createContext, useCallback, useContext, useReducer } from 'react';

/**
 * UI Context - Manages theme, layout, modals, and UI-specific state
 * Replaces scattered UI state management across components
 */

export interface UIState {
  // Theme & Layout
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  mobileMenuOpen: boolean;

  // Modal Management
  modals: {
    eventModal: boolean;
    settingsModal: boolean;
    confirmDialog: boolean;
    helpModal: boolean;
  };

  // Command Palette
  commandPalette: {
    open: boolean;
    query: string;
    loading: boolean;
  };

  // Toast & Notifications UI State
  toasts: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    maxVisible: number;
  };

  // Loading States
  loading: {
    global: boolean;
    calendar: boolean;
    events: boolean;
    sync: boolean;
  };

  // Accessibility
  keyboardNavigation: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  announceMessage: string;
}

export type UIAction =
  | { type: 'SET_THEME'; payload: UIState['theme'] }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_WIDTH'; payload: number }
  | { type: 'SET_MOBILE_MENU'; payload: boolean }
  | { type: 'SET_MODAL'; payload: { modal: keyof UIState['modals']; open: boolean } }
  | { type: 'SET_COMMAND_PALETTE'; payload: Partial<UIState['commandPalette']> }
  | { type: 'SET_LOADING'; payload: { key: keyof UIState['loading']; loading: boolean } }
  | {
      type: 'SET_ACCESSIBILITY';
      payload: Partial<Pick<UIState, 'keyboardNavigation' | 'reducedMotion' | 'highContrast'>>;
    }
  | { type: 'ANNOUNCE_MESSAGE'; payload: string }
  | { type: 'BATCH_UPDATE'; payload: Partial<UIState> };

const initialUIState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  sidebarWidth: 280,
  mobileMenuOpen: false,

  modals: {
    eventModal: false,
    settingsModal: false,
    confirmDialog: false,
    helpModal: false,
  },

  commandPalette: {
    open: false,
    query: '',
    loading: false,
  },

  toasts: {
    position: 'top-right',
    maxVisible: 5,
  },

  loading: {
    global: false,
    calendar: false,
    events: false,
    sync: false,
  },

  keyboardNavigation: false,
  reducedMotion: false,
  highContrast: false,
  announceMessage: '',
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
        sidebarWidth: !state.sidebarCollapsed ? 80 : 280,
      };

    case 'SET_SIDEBAR_WIDTH':
      return { ...state, sidebarWidth: action.payload };

    case 'SET_MOBILE_MENU':
      return { ...state, mobileMenuOpen: action.payload };

    case 'SET_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: action.payload.open,
        },
      };

    case 'SET_COMMAND_PALETTE':
      return {
        ...state,
        commandPalette: {
          ...state.commandPalette,
          ...action.payload,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      };

    case 'SET_ACCESSIBILITY':
      return { ...state, ...action.payload };

    case 'ANNOUNCE_MESSAGE':
      return { ...state, announceMessage: action.payload };

    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

export interface UIContextValue {
  state: UIState;
  dispatch: React.Dispatch<UIAction>;

  // Convenience methods
  setTheme: (theme: UIState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setMobileMenu: (open: boolean) => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCommandQuery: (query: string) => void;
  setLoading: (key: keyof UIState['loading'], loading: boolean) => void;
  announceMessage: (message: string) => void;
  batchUpdate: (updates: Partial<UIState>) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState);

  // Convenience methods
  const setTheme = useCallback((theme: UIState['theme']) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    dispatch({ type: 'SET_SIDEBAR_WIDTH', payload: width });
  }, []);

  const setMobileMenu = useCallback((open: boolean) => {
    dispatch({ type: 'SET_MOBILE_MENU', payload: open });
  }, []);

  const openModal = useCallback((modal: keyof UIState['modals']) => {
    dispatch({ type: 'SET_MODAL', payload: { modal, open: true } });
  }, []);

  const closeModal = useCallback((modal: keyof UIState['modals']) => {
    dispatch({ type: 'SET_MODAL', payload: { modal, open: false } });
  }, []);

  const openCommandPalette = useCallback(() => {
    dispatch({ type: 'SET_COMMAND_PALETTE', payload: { open: true } });
  }, []);

  const closeCommandPalette = useCallback(() => {
    dispatch({ type: 'SET_COMMAND_PALETTE', payload: { open: false, query: '' } });
  }, []);

  const setCommandQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_COMMAND_PALETTE', payload: { query } });
  }, []);

  const setLoading = useCallback((key: keyof UIState['loading'], loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, loading } });
  }, []);

  const announceMessage = useCallback((message: string) => {
    dispatch({ type: 'ANNOUNCE_MESSAGE', payload: message });
  }, []);

  const batchUpdate = useCallback((updates: Partial<UIState>) => {
    dispatch({ type: 'BATCH_UPDATE', payload: updates });
  }, []);

  const contextValue: UIContextValue = {
    state,
    dispatch,
    setTheme,
    toggleSidebar,
    setSidebarWidth,
    setMobileMenu,
    openModal,
    closeModal,
    openCommandPalette,
    closeCommandPalette,
    setCommandQuery,
    setLoading,
    announceMessage,
    batchUpdate,
  };

  return <UIContext.Provider value={contextValue}>{children}</UIContext.Provider>;
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}

// Specialized hooks for specific UI concerns
export function useTheme() {
  const { state, setTheme } = useUIContext();
  return {
    theme: state.theme,
    setTheme,
    isDark:
      state.theme === 'dark' ||
      (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
}

export function useSidebar() {
  const { state, toggleSidebar, setSidebarWidth, setMobileMenu } = useUIContext();
  return {
    collapsed: state.sidebarCollapsed,
    width: state.sidebarWidth,
    mobileMenuOpen: state.mobileMenuOpen,
    toggleSidebar,
    setSidebarWidth,
    setMobileMenu,
  };
}

export function useModals() {
  const { state, openModal, closeModal } = useUIContext();
  return {
    modals: state.modals,
    openModal,
    closeModal,
  };
}

export function useCommandPalette() {
  const { state, openCommandPalette, closeCommandPalette, setCommandQuery } = useUIContext();
  return {
    ...state.commandPalette,
    openCommandPalette,
    closeCommandPalette,
    setCommandQuery,
  };
}

export function useLoading() {
  const { state, setLoading } = useUIContext();
  return {
    loading: state.loading,
    setLoading,
    isAnyLoading: Object.values(state.loading).some(Boolean),
  };
}

export function useAnnouncements() {
  const { state, announceMessage } = useUIContext();
  return {
    message: state.announceMessage,
    announceMessage,
  };
}
