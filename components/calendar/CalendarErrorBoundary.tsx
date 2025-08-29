'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Bug, Home, RefreshCw } from 'lucide-react';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class CalendarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('Calendar Error Boundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Send error to tracking service
      this.reportError(error, errorInfo);
    }
  }

  reportError(error: Error, errorInfo: ErrorInfo) {
    // Implement error reporting to your service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Send to error tracking endpoint
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport),
    }).catch(console.error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const { error, errorInfo, errorCount } = this.state;
      const isCalendarSyncError =
        error?.message?.includes('sync') || error?.message?.includes('calendar');
      const isNetworkError =
        error?.message?.includes('network') || error?.message?.includes('fetch');
      const isAuthError =
        error?.message?.includes('auth') || error?.message?.includes('permission');

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                {isCalendarSyncError && 'There was an issue with calendar synchronization.'}
                {isNetworkError && 'Unable to connect to the server. Please check your connection.'}
                {isAuthError && 'There was an authentication issue. Please try signing in again.'}
                {!isCalendarSyncError &&
                  !isNetworkError &&
                  !isAuthError &&
                  'An unexpected error occurred in the calendar component.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Details</AlertTitle>
                  <AlertDescription className="mt-2 font-mono text-xs">
                    <div className="space-y-1">
                      <p>
                        <strong>Message:</strong> {error.message}
                      </p>
                      {error.stack && (
                        <details className="cursor-pointer">
                          <summary>Stack Trace</summary>
                          <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                      {errorInfo?.componentStack && (
                        <details className="cursor-pointer">
                          <summary>Component Stack</summary>
                          <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                            {errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Count Warning */}
              {errorCount > 2 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Multiple Errors Detected</AlertTitle>
                  <AlertDescription>
                    This error has occurred {errorCount} times. Consider refreshing the page or
                    contacting support if the issue persists.
                  </AlertDescription>
                </Alert>
              )}

              {/* Suggested Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Suggested Actions:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {isCalendarSyncError && (
                    <>
                      <li>Check your calendar provider connection in Settings</li>
                      <li>Try disconnecting and reconnecting your calendar</li>
                      <li>Ensure you have proper permissions for calendar access</li>
                    </>
                  )}
                  {isNetworkError && (
                    <>
                      <li>Check your internet connection</li>
                      <li>Try refreshing the page</li>
                      <li>Check if the service is available</li>
                    </>
                  )}
                  {isAuthError && (
                    <>
                      <li>Sign out and sign back in</li>
                      <li>Check your calendar permissions</li>
                      <li>Reconnect your calendar provider</li>
                    </>
                  )}
                  <li>Clear your browser cache and cookies</li>
                  <li>Try using a different browser</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline">
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="ghost">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Full Error:', error);
                    console.log('Error Info:', errorInfo);
                  }}
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Log Error
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error handling in functional components
export function useCalendarError() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Calendar error captured:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      // Could trigger notifications or logging here
      console.error('useCalendarError:', error);
    }
  }, [error]);

  return { error, resetError, captureError };
}
