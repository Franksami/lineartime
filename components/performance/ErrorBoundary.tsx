'use client';

import { errorBoundarySystem } from '@/lib/performance/ErrorBoundarySystem';
import { AlertCircle, ChevronDown, ChevronUp, Home, RefreshCw } from 'lucide-react';
import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableRecovery?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  showDetails: boolean;
  recoveryAttempts: number;
  isRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      recoveryAttempts: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capture error in the system
    const capturedError = errorBoundarySystem.captureError(error, {
      component: this.props.componentName || 'ErrorBoundary',
      errorInfo,
      props: this.props,
      state: this.state,
    });

    this.setState({
      errorInfo,
      errorId: capturedError.id,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Attempt auto-recovery if enabled
    if (this.props.enableRecovery) {
      this.attemptAutoRecovery();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  attemptAutoRecovery = () => {
    const { recoveryAttempts } = this.state;

    if (recoveryAttempts < 3) {
      this.setState({ isRecovering: true });

      // Exponential backoff
      const delay = 2 ** recoveryAttempts * 1000;

      this.retryTimeoutId = setTimeout(() => {
        console.log(`Attempting auto-recovery (attempt ${recoveryAttempts + 1})...`);
        this.handleReset();
      }, delay);
    }
  };

  handleReset = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      recoveryAttempts: prevState.recoveryAttempts + 1,
      isRecovering: false,
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails, isRecovering } = this.state;
    const { children, fallback, showDetails: showDetailsProp = true } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-gray-900 /* TODO: Use semantic token */ px-4 py-12">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-gray-800 /* TODO: Use semantic token */ rounded-lg shadow-xl overflow-hidden">
              {/* Error Header */}
              <div className="bg-red-50 /* TODO: Use semantic token */ dark:bg-red-900 /* TODO: Use semantic token *//20 border-b border-red-200 /* TODO: Use semantic token */ dark:border-red-800 /* TODO: Use semantic token */ p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-red-600 /* TODO: Use semantic token */ dark:text-red-400 /* TODO: Use semantic token */" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-red-800 /* TODO: Use semantic token */ dark:text-red-200 /* TODO: Use semantic token */">
                      Something went wrong
                    </h3>
                    <p className="mt-1 text-sm text-red-700 /* TODO: Use semantic token */ dark:text-red-300 /* TODO: Use semantic token */">
                      {isRecovering
                        ? 'Attempting to recover...'
                        : "An unexpected error occurred. The error has been logged and we'll look into it."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="p-6">
                <div className="bg-muted dark:bg-gray-700 /* TODO: Use semantic token */ rounded-lg p-4">
                  <p className="text-sm font-mono text-muted-foreground dark:text-gray-300 /* TODO: Use semantic token */">
                    {error.message}
                  </p>
                </div>

                {/* Error Details */}
                {showDetailsProp && (
                  <div className="mt-4">
                    <button
                      onClick={this.toggleDetails}
                      className="flex items-center text-sm text-gray-600 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */ hover:text-foreground dark:hover:text-gray-200 /* TODO: Use semantic token */"
                    >
                      {showDetails ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show details
                        </>
                      )}
                    </button>

                    {showDetails && (
                      <div className="mt-3 space-y-3">
                        {/* Stack Trace */}
                        {error.stack && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */ uppercase tracking-wide mb-1">
                              Stack Trace
                            </h4>
                            <pre className="bg-gray-900 /* TODO: Use semantic token */ dark:bg-black text-gray-100 /* TODO: Use semantic token */ rounded-lg p-3 text-xs overflow-x-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}

                        {/* Component Stack */}
                        {errorInfo?.componentStack && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */ uppercase tracking-wide mb-1">
                              Component Stack
                            </h4>
                            <pre className="bg-gray-900 /* TODO: Use semantic token */ dark:bg-black text-gray-100 /* TODO: Use semantic token */ rounded-lg p-3 text-xs overflow-x-auto">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}

                        {/* Error ID */}
                        {this.state.errorId && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */ uppercase tracking-wide mb-1">
                              Error ID
                            </h4>
                            <p className="text-xs font-mono text-gray-600 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */">
                              {this.state.errorId}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Recovery Actions */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReset}
                    disabled={isRecovering}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 /* TODO: Use semantic token */ hover:bg-blue-700 /* TODO: Use semantic token */ focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 /* TODO: Use semantic token */ disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
                    {isRecovering ? 'Recovering...' : 'Try Again'}
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 /* TODO: Use semantic token */ dark:border-gray-600 /* TODO: Use semantic token */ text-sm font-medium rounded-md text-muted-foreground dark:text-gray-300 /* TODO: Use semantic token */ bg-white dark:bg-gray-800 /* TODO: Use semantic token */ hover:bg-muted dark:hover:bg-gray-700 /* TODO: Use semantic token */ focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 /* TODO: Use semantic token */"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </button>
                </div>

                {/* Recovery Attempts */}
                {this.state.recoveryAttempts > 0 && (
                  <p className="mt-3 text-xs text-gray-500 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */">
                    Recovery attempts: {this.state.recoveryAttempts}
                  </p>
                )}
              </div>
            </div>

            {/* Help Text */}
            <p className="mt-4 text-center text-sm text-gray-500 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */">
              If this problem persists, please contact support or try refreshing the page.
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Async Error Boundary for handling async errors
export function AsyncErrorBoundary({
  children,
  fallback,
  onError,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason);
      setError(error);
      onError?.(error);

      // Capture in error system
      errorBoundarySystem.captureError(error, {
        component: 'AsyncErrorBoundary',
        category: 'async',
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-4 bg-yellow-50 /* TODO: Use semantic token */ dark:bg-yellow-900 /* TODO: Use semantic token *//20 border border-yellow-200 /* TODO: Use semantic token */ dark:border-yellow-800 /* TODO: Use semantic token */ rounded-lg">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-600 /* TODO: Use semantic token */ dark:text-yellow-400 /* TODO: Use semantic token */" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 /* TODO: Use semantic token */ dark:text-yellow-200 /* TODO: Use semantic token */">
              Async Error
            </h3>
            <p className="mt-1 text-sm text-yellow-700 /* TODO: Use semantic token */ dark:text-yellow-300 /* TODO: Use semantic token */">
              {error.message}
            </p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-yellow-600 /* TODO: Use semantic token */ dark:text-yellow-400 /* TODO: Use semantic token */ hover:text-yellow-500 /* TODO: Use semantic token */"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
