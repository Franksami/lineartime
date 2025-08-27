'use client';

import { SessionActivityMonitor } from '@/lib/security/session-manager';
import { useUser } from '@clerk/nextjs';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Key,
  Lock,
  Monitor,
  Shield,
  Smartphone,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function SecuritySettingsPage() {
  const { user, isLoaded } = useUser();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  interface SessionInfo {
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }

  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [isEnablingMFA, setIsEnablingMFA] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30); // minutes
  const [idleTimeout, setIdleTimeout] = useState(15); // minutes
  const [activityMonitor, setActivityMonitor] = useState<SessionActivityMonitor | null>(null);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState<number | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      // Check if user has MFA enabled
      // This would integrate with Clerk's API
      checkMFAStatus();
      fetchActiveSessions();

      // Initialize activity monitor
      const monitor = new SessionActivityMonitor(
        idleTimeout * 60 * 1000,
        60000 // 1 minute warning
      );

      monitor.onWarning(() => {
        console.log('Session timeout warning');
        // Show warning notification
      });

      monitor.onTimeout(() => {
        console.log('Session timed out');
        // Handle session timeout
        window.location.href = '/sign-in';
      });

      setActivityMonitor(monitor);

      // Update time until timeout every second
      const interval = setInterval(() => {
        if (monitor) {
          setTimeUntilTimeout(monitor.getTimeUntilTimeout());
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        monitor.destroy();
      };
    }
  }, [isLoaded, user, idleTimeout]);

  const checkMFAStatus = async () => {
    // Check MFA status from Clerk or backend
    // For now, using a placeholder
    setMfaEnabled(false);
  };

  const fetchActiveSessions = async () => {
    // Fetch active sessions from backend
    // For now, using placeholder data
    setActiveSessions([
      {
        id: '1',
        device: 'Chrome on MacOS',
        location: 'San Francisco, CA',
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: '2',
        device: 'Safari on iPhone',
        location: 'San Francisco, CA',
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        current: false,
      },
    ]);
  };

  const enableMFA = async () => {
    setIsEnablingMFA(true);
    setShowMFASetup(true);

    try {
      // This would integrate with Clerk's MFA setup
      // For now, simulating the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would trigger Clerk's MFA setup flow
      console.log('MFA setup initiated');
    } catch (error) {
      console.error('Failed to enable MFA:', error);
    } finally {
      setIsEnablingMFA(false);
    }
  };

  const disableMFA = async () => {
    try {
      // This would integrate with Clerk's API to disable MFA
      console.log('Disabling MFA');
      setMfaEnabled(false);
    } catch (error) {
      console.error('Failed to disable MFA:', error);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      // Call backend to terminate session
      console.log('Terminating session:', sessionId);
      setActiveSessions((sessions) => sessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account security and active sessions
        </p>
      </div>

      {/* Session Activity Monitor */}
      {timeUntilTimeout !== null &&
        timeUntilTimeout < 120000 && ( // Show when less than 2 minutes
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your session will timeout in {formatTimeRemaining(timeUntilTimeout)} due to
                  inactivity
                </p>
              </div>
              <button
                onClick={() => activityMonitor?.destroy()}
                className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
              >
                Keep me signed in
              </button>
            </div>
          </div>
        )}

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Two-Factor Authentication (2FA)
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account by requiring a verification code in
                addition to your password
              </p>

              {mfaEnabled ? (
                <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  2FA is enabled
                </div>
              ) : (
                <div className="mt-4 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  2FA is not enabled
                </div>
              )}
            </div>
          </div>

          <button
            onClick={mfaEnabled ? disableMFA : enableMFA}
            disabled={isEnablingMFA}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mfaEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isEnablingMFA ? 'Setting up...' : mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>

        {/* MFA Setup Instructions */}
        {showMFASetup && !mfaEnabled && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Setup Instructions:
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>1. Install an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>2. Scan the QR code that will appear</li>
              <li>3. Enter the verification code from your app</li>
              <li>4. Save your backup codes in a secure location</li>
            </ol>
            <p className="mt-3 text-xs text-blue-700 dark:text-blue-400">
              Note: This feature will be fully functional once Clerk MFA is configured in the
              dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Session Timeout Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start">
          <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 mr-3" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Session Timeout Settings
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configure automatic logout after periods of inactivity
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number.parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum time a session can remain active
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Idle Timeout (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={idleTimeout}
                  onChange={(e) => setIdleTimeout(Number.parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Logout after this period of inactivity
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start mb-4">
          <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage devices and locations where you&apos;re currently signed in
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center">
                <Monitor className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.device}
                    {session.current && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.location} • Last active:{' '}
                    {new Date(session.lastActive).toLocaleString()}
                  </p>
                </div>
              </div>

              {!session.current && (
                <button
                  onClick={() => terminateSession(session.id)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Sign out
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="mt-4 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium">
          Sign out all other sessions
        </button>
      </div>

      {/* Security Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          Security Recommendations:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li className="flex items-start">
            <Key className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Use a strong, unique password for your account
          </li>
          <li className="flex items-start">
            <Smartphone className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Enable two-factor authentication for maximum security
          </li>
          <li className="flex items-start">
            <Lock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Review active sessions regularly and sign out from unknown devices
          </li>
        </ul>
      </div>
    </div>
  );
}
