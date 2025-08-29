'use client';

import { cn } from '@/lib/utils';
import React, {
  type ComponentType,
  type ReactNode,
  createElement,
  useMemo,
  lazy,
  Suspense,
} from 'react';

/**
 * UI Component Adapter Architecture
 *
 * Purpose: Enable seamless switching between UI libraries while maintaining
 * consistent behavior, theming, and API surface
 *
 * Features:
 * - Runtime library switching
 * - Theme consistency across libraries
 * - Performance optimization via lazy loading
 * - Type safety with generic constraints
 * - Graceful fallbacks and error boundaries
 */

// Supported UI Libraries
export type UILibrary = 'shadcn' | 'arco' | 'antd' | 'mantine' | 'mui';

// Component types that can be adapted
export type AdaptableComponent =
  | 'Button'
  | 'Input'
  | 'Card'
  | 'Modal'
  | 'Select'
  | 'DatePicker'
  | 'Table'
  | 'Sidebar'
  | 'CommandPalette'
  | 'Toast'
  | 'Avatar'
  | 'Badge'
  | 'Progress';

// Universal component props interface
export interface UniversalProps {
  className?: string;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  [key: string]: any;
}

// Component registry for different libraries
interface ComponentRegistry {
  [library: string]: {
    [component: string]: {
      component: ComponentType<any> | (() => Promise<{ default: ComponentType<any> }>);
      propsAdapter?: (props: UniversalProps) => any;
      themeAdapter?: (theme: any) => any;
      lazy?: boolean;
    };
  };
}

// Theme mapping for consistent appearance across libraries
const THEME_MAPPINGS = {
  colors: {
    primary: {
      shadcn: 'hsl(var(--primary))',
      arco: 'rgb(var(--arcoblue-6))',
      antd: 'var(--ant-primary-color)',
      mantine: 'var(--mantine-color-blue-6)',
      mui: 'var(--mui-palette-primary-main)',
    },
    background: {
      shadcn: 'hsl(var(--background))',
      arco: 'var(--color-bg-1)',
      antd: 'var(--ant-component-background)',
      mantine: 'var(--mantine-color-white)',
      mui: 'var(--mui-palette-background-default)',
    },
  },
  sizing: {
    sm: { shadcn: 'h-8', arco: 'mini', antd: 'small', mantine: 'xs', mui: 'small' },
    md: { shadcn: 'h-10', arco: 'small', antd: 'middle', mantine: 'sm', mui: 'medium' },
    lg: { shadcn: 'h-12', arco: 'default', antd: 'large', mantine: 'md', mui: 'large' },
  },
};

// Lazy-loaded component registry
const createComponentRegistry = (): ComponentRegistry => ({
  shadcn: {
    Button: {
      component: lazy(() => import('@/components/ui/button').then((m) => ({ default: m.Button }))),
      lazy: true,
    },
    Input: {
      component: lazy(() => import('@/components/ui/input').then((m) => ({ default: m.Input }))),
      lazy: true,
    },
    Card: {
      component: lazy(() => import('@/components/ui/card').then((m) => ({ default: m.Card }))),
      lazy: true,
    },
    Modal: {
      component: lazy(() => import('@/components/ui/dialog').then((m) => ({ default: m.Dialog }))),
      propsAdapter: (props: UniversalProps) => ({
        open: props.open,
        onOpenChange: props.onOpenChange,
        ...props,
      }),
      lazy: true,
    },
    Sidebar: {
      component: lazy(() =>
        import('@/components/ui/sidebar').then((m) => ({ default: m.Sidebar }))
      ),
      lazy: true,
    },
    CommandPalette: {
      component: lazy(() =>
        import('@/components/ui/command').then((m) => ({ default: m.Command }))
      ),
      lazy: true,
    },
  },

  arco: {
    Button: {
      component: lazy(() => import('@arco-design/web-react').then((m) => ({ default: m.Button }))),
      propsAdapter: (props: UniversalProps) => ({
        type: props.variant === 'outline' ? 'outline' : 'primary',
        size: THEME_MAPPINGS.sizing[props.size || 'md'].arco,
        loading: props.loading,
        disabled: props.disabled,
        className: cn('arco-btn-adapted', props.className),
        ...props,
      }),
      lazy: true,
    },
    Input: {
      component: lazy(() => import('@arco-design/web-react').then((m) => ({ default: m.Input }))),
      propsAdapter: (props: UniversalProps) => ({
        size: THEME_MAPPINGS.sizing[props.size || 'md'].arco,
        disabled: props.disabled,
        className: cn('arco-input-adapted', props.className),
        ...props,
      }),
      lazy: true,
    },
  },

  antd: {
    Button: {
      component: lazy(() => import('antd').then((m) => ({ default: m.Button }))),
      propsAdapter: (props: UniversalProps) => ({
        type: props.variant === 'outline' ? 'default' : 'primary',
        size: THEME_MAPPINGS.sizing[props.size || 'md'].antd,
        loading: props.loading,
        disabled: props.disabled,
        className: cn('ant-btn-adapted', props.className),
        ...props,
      }),
      lazy: true,
    },
  },
});

// Component adapter hook for theme and library management
export function useUIAdapter() {
  const [currentLibrary, setCurrentLibrary] = React.useState<UILibrary>('shadcn');
  const [fallbackLibrary] = React.useState<UILibrary>('shadcn');
  const [loadingStates, _setLoadingStates] = React.useState<Map<string, boolean>>(new Map());

  const componentRegistry = useMemo(() => createComponentRegistry(), []);

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = React.useState({
    loadTimes: new Map<string, number>(),
    renderCount: 0,
    failedLoads: new Set<string>(),
  });

  const switchLibrary = React.useCallback(
    (library: UILibrary) => {
      console.log(`🔄 Switching UI library from ${currentLibrary} to ${library}`);
      setCurrentLibrary(library);
    },
    [currentLibrary]
  );

  const getComponent = React.useCallback(
    (componentName: AdaptableComponent, library: UILibrary = currentLibrary) => {
      const startTime = performance.now();
      const componentKey = `${library}-${componentName}`;

      try {
        const libraryRegistry = componentRegistry[library];
        if (!libraryRegistry || !libraryRegistry[componentName]) {
          console.warn(
            `⚠️ Component ${componentName} not found in ${library}, falling back to ${fallbackLibrary}`
          );
          return componentRegistry[fallbackLibrary]?.[componentName]?.component;
        }

        const componentDef = libraryRegistry[componentName];

        // Track performance
        const endTime = performance.now();
        setPerformanceMetrics((prev) => ({
          ...prev,
          loadTimes: new Map(prev.loadTimes.set(componentKey, endTime - startTime)),
          renderCount: prev.renderCount + 1,
        }));

        return componentDef;
      } catch (error) {
        console.error(`❌ Failed to load ${componentName} from ${library}:`, error);
        setPerformanceMetrics((prev) => ({
          ...prev,
          failedLoads: new Set(prev.failedLoads.add(componentKey)),
        }));

        // Fallback to default library
        return componentRegistry[fallbackLibrary]?.[componentName]?.component;
      }
    },
    [componentRegistry, currentLibrary, fallbackLibrary]
  );

  return {
    currentLibrary,
    switchLibrary,
    getComponent,
    performanceMetrics,
    loadingStates,
  };
}

// Universal component factory
interface AdaptedComponentProps extends UniversalProps {
  library?: UILibrary;
  fallback?: ComponentType<any>;
}

export function createAdaptedComponent<T extends UniversalProps>(
  componentName: AdaptableComponent
) {
  return React.forwardRef<any, T & AdaptedComponentProps>((props, ref) => {
    const { library, fallback, ...componentProps } = props;
    const { getComponent, currentLibrary } = useUIAdapter();

    const targetLibrary = library || currentLibrary;
    const componentDef = getComponent(componentName, targetLibrary);

    if (!componentDef) {
      if (fallback) {
        return createElement(fallback, componentProps as T);
      }

      return (
        <div className="p-4 border border-destructive/20 rounded bg-destructive/5">
          <p className="text-sm text-destructive">
            Component {componentName} not available in {targetLibrary}
          </p>
        </div>
      );
    }

    // Apply props adapter if available
    const adaptedProps = componentDef.propsAdapter
      ? componentDef.propsAdapter(componentProps as UniversalProps)
      : componentProps;

    // Handle lazy loading
    if (componentDef.lazy) {
      return (
        <Suspense fallback={<div className="animate-pulse bg-muted rounded h-10 w-20" />}>
          {createElement(componentDef.component as ComponentType, {
            ...adaptedProps,
            ref,
          })}
        </Suspense>
      );
    }

    return createElement(componentDef.component as ComponentType, {
      ...adaptedProps,
      ref,
    });
  });
}

// Pre-created adapted components for common use cases
export const AdaptedButton = createAdaptedComponent<{
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}>('Button');

export const AdaptedInput = createAdaptedComponent<{
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}>('Input');

export const AdaptedCard = createAdaptedComponent<{
  title?: string;
  description?: string;
}>('Card');

export const AdaptedModal = createAdaptedComponent<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}>('Modal');

export const AdaptedSidebar = createAdaptedComponent<{
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}>('Sidebar');

// Theme consistency provider
interface ThemeAdapterProps {
  children: ReactNode;
  library: UILibrary;
  customTheme?: any;
}

export function ThemeAdapter({ children, library, customTheme }: ThemeAdapterProps) {
  const themeVars = useMemo(() => {
    const baseTheme = {
      '--adapted-primary': THEME_MAPPINGS.colors.primary[library],
      '--adapted-background': THEME_MAPPINGS.colors.background[library],
    };

    return { ...baseTheme, ...customTheme };
  }, [library, customTheme]);

  return (
    <div
      style={themeVars}
      className={cn('ui-adapter-theme', `ui-adapter-${library}`, 'transition-colors duration-200')}
    >
      {children}
    </div>
  );
}

// Error boundary for component loading failures
interface ComponentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  componentName?: string;
}

export class ComponentErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ComponentType; componentName?: string },
  ComponentErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI Adapter Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return createElement(this.props.fallback);
      }

      return (
        <div className="p-4 border border-destructive/20 rounded bg-destructive/5">
          <h3 className="text-sm font-medium text-destructive mb-2">Component Error</h3>
          <p className="text-xs text-muted-foreground">{this.props.componentName} failed to load</p>
          <details className="mt-2">
            <summary className="text-xs cursor-pointer">Error Details</summary>
            <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring hook
export function useAdapterPerformance() {
  const { performanceMetrics } = useUIAdapter();

  const getAverageLoadTime = () => {
    const times = Array.from(performanceMetrics.loadTimes.values());
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  };

  const getFailureRate = () => {
    const total = performanceMetrics.loadTimes.size + performanceMetrics.failedLoads.size;
    return total > 0 ? (performanceMetrics.failedLoads.size / total) * 100 : 0;
  };

  return {
    averageLoadTime: getAverageLoadTime(),
    failureRate: getFailureRate(),
    totalComponents: performanceMetrics.loadTimes.size,
    renderCount: performanceMetrics.renderCount,
    failedComponents: Array.from(performanceMetrics.failedLoads),
  };
}

// Migration helper functions
export const migrationUtils = {
  // Generate component mapping report
  generateMappingReport: (currentLibrary: UILibrary, targetLibrary: UILibrary) => {
    const report = {
      from: currentLibrary,
      to: targetLibrary,
      mappings: [],
      incompatible: [],
      requiresCustomAdapter: [],
    };

    // This would analyze the current codebase and generate migration guidance
    return report;
  },

  // Validate component compatibility
  validateMigration: async (
    componentName: AdaptableComponent,
    fromLibrary: UILibrary,
    toLibrary: UILibrary
  ) => {
    const registry = createComponentRegistry();
    const fromComponent = registry[fromLibrary]?.[componentName];
    const toComponent = registry[toLibrary]?.[componentName];

    return {
      compatible: !!fromComponent && !!toComponent,
      requiresPropsAdapter: fromComponent?.propsAdapter !== toComponent?.propsAdapter,
      bundleImpact: 'TBD', // Would calculate actual bundle size difference
      riskLevel: toComponent ? 'low' : 'high',
    };
  },
};
