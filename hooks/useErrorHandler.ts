import { useCallback, useEffect, useState } from 'react';
import { 
  errorBoundarySystem, 
  ErrorInfo, 
  ErrorMetrics,
  RecoveryStrategy 
} from '@/lib/performance/ErrorBoundarySystem';

export interface UseErrorHandlerOptions {
  /**
   * Component name for error tracking
   */
  componentName?: string;
  
  /**
   * Custom recovery strategies
   */
  recoveryStrategies?: RecoveryStrategy[];
  
  /**
   * Callback when error occurs
   */
  onError?: (error: ErrorInfo) => void;
  
  /**
   * Enable automatic error reporting
   */
  autoReport?: boolean;
  
  /**
   * Maximum errors to track
   */
  maxErrors?: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    componentName = 'Unknown',
    recoveryStrategies = [],
    onError,
    autoReport = true,
    maxErrors = 10,
  } = options;

  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Add custom recovery strategies
  useEffect(() => {
    recoveryStrategies.forEach(strategy => {
      errorBoundarySystem.addRecoveryStrategy(strategy);
    });
  }, [recoveryStrategies]);

  // Subscribe to errors
  useEffect(() => {
    const unsubscribe = errorBoundarySystem.subscribe((error) => {
      if (error.component === componentName || componentName === 'Unknown') {
        setErrors(prev => [...prev.slice(-(maxErrors - 1)), error]);
        onError?.(error);
        
        // Update metrics
        setMetrics(errorBoundarySystem.getMetrics());
      }
    });

    // Get initial metrics
    setMetrics(errorBoundarySystem.getMetrics());

    return unsubscribe;
  }, [componentName, onError, maxErrors]);

  // Capture error manually
  const captureError = useCallback((
    error: Error | string,
    context?: Partial<ErrorInfo>
  ) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const capturedError = errorBoundarySystem.captureError(errorObj, {
      component: componentName,
      ...context,
    });

    if (autoReport) {
      console.error(`[${componentName}] Error captured:`, errorObj);
    }

    return capturedError;
  }, [componentName, autoReport]);

  // Try-catch wrapper for async functions
  const tryAsync = useCallback(async <T,>(
    fn: () => Promise<T>,
    context?: Partial<ErrorInfo>
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error) {
      captureError(error as Error, {
        category: 'async',
        ...context,
      });
      return null;
    }
  }, [captureError]);

  // Try-catch wrapper for sync functions
  const trySync = useCallback(<T,>(
    fn: () => T,
    context?: Partial<ErrorInfo>
  ): T | null => {
    try {
      return fn();
    } catch (error) {
      captureError(error as Error, {
        category: 'unknown',
        ...context,
      });
      return null;
    }
  }, [captureError]);

  // Error boundary for hooks
  const withErrorBoundary = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    context?: Partial<ErrorInfo>
  ): T => {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.catch((error: Error) => {
            captureError(error, {
              category: 'async',
              ...context,
            });
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        captureError(error as Error, context);
        throw error;
      }
    }) as T;
  }, [captureError]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    errorBoundarySystem.clearErrors();
  }, []);

  // Get error by ID
  const getError = useCallback((errorId: string): ErrorInfo | undefined => {
    return errors.find(e => e.id === errorId);
  }, [errors]);

  // Check if component has errors
  const hasErrors = errors.length > 0;

  // Get error summary
  const getErrorSummary = useCallback(() => {
    const summary = {
      total: errors.length,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      recovered: 0,
      recent: errors.slice(-5),
    };

    errors.forEach(error => {
      // Count by severity
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
      
      // Count by category
      summary.byCategory[error.category] = (summary.byCategory[error.category] || 0) + 1;
      
      // Count recovered
      if (error.recovered) {
        summary.recovered++;
      }
    });

    return summary;
  }, [errors]);

  // Export error log
  const exportErrorLog = useCallback(() => {
    return errorBoundarySystem.exportErrorLog();
  }, []);

  // Create recovery strategy
  const createRecoveryStrategy = useCallback((
    name: string,
    condition: (error: ErrorInfo) => boolean,
    recover: (error: ErrorInfo) => Promise<boolean>,
    maxAttempts = 3
  ): RecoveryStrategy => {
    return {
      name,
      condition,
      recover,
      maxAttempts,
    };
  }, []);

  // Retry failed operation
  const retry = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delay = 1000
  ): Promise<T | null> => {
    setIsRecovering(true);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        setIsRecovering(false);
        return result;
      } catch (error) {
        if (attempt === maxAttempts) {
          captureError(error as Error, {
            severity: 'high',
            category: 'async',
            recoveryAttempts: attempt,
          });
          setIsRecovering(false);
          return null;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    setIsRecovering(false);
    return null;
  }, [captureError]);

  return {
    // State
    errors,
    metrics,
    hasErrors,
    isRecovering,
    
    // Error capture
    captureError,
    tryAsync,
    trySync,
    withErrorBoundary,
    
    // Error management
    clearErrors,
    getError,
    getErrorSummary,
    exportErrorLog,
    
    // Recovery
    createRecoveryStrategy,
    retry,
    
    // Metrics
    totalErrors: metrics?.totalErrors || 0,
    recoveryRate: metrics?.recoveryRate || 0,
    topErrors: metrics?.topErrors || [],
    errorTrend: metrics?.errorTrend || [],
  };
}