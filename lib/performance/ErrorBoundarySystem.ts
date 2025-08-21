/**
 * ErrorBoundarySystem - Comprehensive error handling and recovery system
 * Provides error tracking, recovery strategies, and user feedback
 */

export interface ErrorInfo {
  id: string;
  timestamp: number;
  error: Error;
  errorInfo?: React.ErrorInfo;
  component?: string;
  props?: any;
  state?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'render' | 'async' | 'network' | 'permission' | 'validation' | 'unknown';
  userId?: string;
  sessionId: string;
  browser: string;
  url: string;
  stackTrace?: string;
  breadcrumbs: Breadcrumb[];
  recovered: boolean;
  recoveryAttempts: number;
}

export interface Breadcrumb {
  timestamp: number;
  type: 'navigation' | 'click' | 'input' | 'xhr' | 'console' | 'error';
  message: string;
  data?: any;
}

export interface RecoveryStrategy {
  name: string;
  condition: (error: ErrorInfo) => boolean;
  recover: (error: ErrorInfo) => Promise<boolean>;
  maxAttempts: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recoveryRate: number;
  averageRecoveryTime: number;
  topErrors: Array<{ error: string; count: number }>;
  errorTrend: Array<{ timestamp: number; count: number }>;
}

export class ErrorBoundarySystem {
  private static instance: ErrorBoundarySystem;
  private errors: Map<string, ErrorInfo> = new Map();
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private maxErrors = 100;
  private recoveryStrategies: RecoveryStrategy[] = [];
  private observers: Set<(error: ErrorInfo) => void> = new Set();
  private sessionId: string;
  private isRecovering = false;
  
  // Error patterns for categorization
  private errorPatterns = {
    render: /ReactDOM|Component|render|setState|props/i,
    async: /Promise|async|await|then|catch/i,
    network: /fetch|xhr|ajax|network|cors|404|500/i,
    permission: /permission|denied|unauthorized|forbidden/i,
    validation: /validation|invalid|required|format/i,
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupDefaultRecoveryStrategies();
    this.setupGlobalErrorHandlers();
    this.setupBreadcrumbTracking();
  }

  static getInstance(): ErrorBoundarySystem {
    if (!ErrorBoundarySystem.instance) {
      ErrorBoundarySystem.instance = new ErrorBoundarySystem();
    }
    return ErrorBoundarySystem.instance;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup default recovery strategies
   */
  private setupDefaultRecoveryStrategies(): void {
    // Retry strategy for network errors
    this.addRecoveryStrategy({
      name: 'network-retry',
      condition: (error) => error.category === 'network',
      recover: async (error) => {
        await this.delay(1000 * Math.pow(2, error.recoveryAttempts)); // Exponential backoff
        return true; // Signal to retry
      },
      maxAttempts: 3,
    });

    // Component remount strategy for render errors
    this.addRecoveryStrategy({
      name: 'component-remount',
      condition: (error) => error.category === 'render' && error.severity !== 'critical',
      recover: async (error) => {
        // Component will handle remount
        await this.delay(100);
        return true;
      },
      maxAttempts: 2,
    });

    // Clear cache strategy for persistent errors
    this.addRecoveryStrategy({
      name: 'clear-cache',
      condition: (error) => error.recoveryAttempts >= 2,
      recover: async (error) => {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        localStorage.clear();
        sessionStorage.clear();
        return true;
      },
      maxAttempts: 1,
    });

    // Fallback UI strategy for critical errors
    this.addRecoveryStrategy({
      name: 'fallback-ui',
      condition: (error) => error.severity === 'critical',
      recover: async (error) => {
        // Signal to show fallback UI
        return false; // Don't retry, show fallback
      },
      maxAttempts: 1,
    });
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Window error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'window',
        category: 'unknown',
        severity: 'high',
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        component: 'promise',
        category: 'async',
        severity: 'high',
      });
    });
  }

  /**
   * Setup breadcrumb tracking
   */
  private setupBreadcrumbTracking(): void {
    // Track navigation
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      this.addBreadcrumb({
        type: 'navigation',
        message: `Navigate to ${args[2]}`,
        data: { url: args[2] },
      });
      return originalPushState.apply(history, args);
    };

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const selector = this.getElementSelector(target);
      this.addBreadcrumb({
        type: 'click',
        message: `Click on ${selector}`,
        data: { selector, text: target.textContent?.substring(0, 50) },
      });
    }, true);

    // Track console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addBreadcrumb({
        type: 'console',
        message: 'Console error',
        data: { args: args.map(arg => String(arg).substring(0, 100)) },
      });
      return originalConsoleError.apply(console, args);
    };

    // Track XHR/Fetch
    this.trackNetworkRequests();
  }

  /**
   * Track network requests for breadcrumbs
   */
  private trackNetworkRequests(): void {
    // Track fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);
      const method = args[1]?.method || 'GET';
      
      this.addBreadcrumb({
        type: 'xhr',
        message: `${method} ${url}`,
        data: { url, method },
      });

      try {
        const response = await originalFetch.apply(window, args);
        if (!response.ok) {
          this.addBreadcrumb({
            type: 'xhr',
            message: `${method} ${url} failed with ${response.status}`,
            data: { url, method, status: response.status },
          });
        }
        return response;
      } catch (error) {
        this.addBreadcrumb({
          type: 'xhr',
          message: `${method} ${url} failed`,
          data: { url, method, error: String(error) },
        });
        throw error;
      }
    };
  }

  /**
   * Get element selector for breadcrumb tracking
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Add breadcrumb
   */
  private addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now(),
    });

    // Trim breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Capture error
   */
  captureError(
    error: Error,
    context?: Partial<ErrorInfo>
  ): ErrorInfo {
    const errorInfo: ErrorInfo = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      error,
      component: context?.component,
      props: context?.props,
      state: context?.state,
      severity: context?.severity || this.determineSeverity(error),
      category: context?.category || this.categorizeError(error),
      sessionId: this.sessionId,
      browser: this.getBrowserInfo(),
      url: window.location.href,
      stackTrace: error.stack,
      breadcrumbs: [...this.breadcrumbs],
      recovered: false,
      recoveryAttempts: 0,
      ...context,
    };

    // Store error
    this.errors.set(errorInfo.id, errorInfo);
    
    // Trim errors
    if (this.errors.size > this.maxErrors) {
      const firstKey = this.errors.keys().next().value;
      this.errors.delete(firstKey);
    }

    // Notify observers
    this.notifyObservers(errorInfo);

    // Attempt recovery
    this.attemptRecovery(errorInfo);

    return errorInfo;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): ErrorInfo['severity'] {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('critical') || errorMessage.includes('fatal')) {
      return 'critical';
    }
    if (errorMessage.includes('error') || errorMessage.includes('fail')) {
      return 'high';
    }
    if (errorMessage.includes('warning') || errorMessage.includes('deprecated')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Categorize error
   */
  private categorizeError(error: Error): ErrorInfo['category'] {
    const errorString = `${error.message} ${error.stack}`;
    
    for (const [category, pattern] of Object.entries(this.errorPatterns)) {
      if (pattern.test(errorString)) {
        return category as ErrorInfo['category'];
      }
    }
    
    return 'unknown';
  }

  /**
   * Get browser info
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(errorInfo: ErrorInfo): Promise<boolean> {
    if (this.isRecovering) return false;
    
    this.isRecovering = true;
    
    try {
      for (const strategy of this.recoveryStrategies) {
        if (
          strategy.condition(errorInfo) &&
          errorInfo.recoveryAttempts < strategy.maxAttempts
        ) {
          errorInfo.recoveryAttempts++;
          
          console.log(`Attempting recovery strategy: ${strategy.name}`);
          const recovered = await strategy.recover(errorInfo);
          
          if (recovered) {
            errorInfo.recovered = true;
            this.errors.set(errorInfo.id, errorInfo);
            console.log(`Recovery successful: ${strategy.name}`);
            return true;
          }
        }
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
    } finally {
      this.isRecovering = false;
    }
    
    return false;
  }

  /**
   * Add recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Subscribe to errors
   */
  subscribe(observer: (error: ErrorInfo) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Notify observers
   */
  private notifyObservers(error: ErrorInfo): void {
    this.observers.forEach(observer => observer(error));
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    const errors = Array.from(this.errors.values());
    
    // Count by category
    const errorsByCategory: Record<string, number> = {};
    errors.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
    });
    
    // Count by severity
    const errorsBySeverity: Record<string, number> = {};
    errors.forEach(error => {
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });
    
    // Calculate recovery rate
    const recoveredCount = errors.filter(e => e.recovered).length;
    const recoveryRate = errors.length > 0 ? recoveredCount / errors.length : 0;
    
    // Calculate average recovery time
    const recoveryTimes = errors
      .filter(e => e.recovered)
      .map(e => e.recoveryAttempts * 1000); // Approximate
    const averageRecoveryTime = recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0;
    
    // Get top errors
    const errorCounts: Record<string, number> = {};
    errors.forEach(error => {
      const key = error.error.message;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get error trend (last 10 minutes)
    const now = Date.now();
    const trend: Array<{ timestamp: number; count: number }> = [];
    for (let i = 9; i >= 0; i--) {
      const start = now - (i + 1) * 60000;
      const end = now - i * 60000;
      const count = errors.filter(e => e.timestamp >= start && e.timestamp < end).length;
      trend.push({ timestamp: end, count });
    }
    
    return {
      totalErrors: errors.length,
      errorsByCategory,
      errorsBySeverity,
      recoveryRate,
      averageRecoveryTime,
      topErrors,
      errorTrend: trend,
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): ErrorInfo[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors.clear();
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export error log
   */
  exportErrorLog(): string {
    const errors = Array.from(this.errors.values());
    const metrics = this.getMetrics();
    
    return JSON.stringify({
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metrics,
      errors: errors.map(e => ({
        ...e,
        error: {
          message: e.error.message,
          stack: e.error.stack,
        },
      })),
    }, null, 2);
  }
}

// Export singleton instance
export const errorBoundarySystem = ErrorBoundarySystem.getInstance();