/**
 * Real-time Notification System
 * Handles real-time updates and displays notifications to users
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRealtimeReminders, useRealtimeSyncStatus, useRealtimeConflicts } from "@/hooks/useRealtimeSubscriptions";
import { Id } from "@/convex/_generated/dataModel";
import { Bell, AlertCircle, CheckCircle, X, Clock, Sync, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: "reminder" | "sync" | "conflict" | "success" | "error" | "info";
  title: string;
  message: string;
  timestamp: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface RealtimeNotificationsProps {
  userId: Id<"users"> | undefined;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxNotifications?: number;
  autoHideDuration?: number; // in milliseconds
}

export function RealtimeNotifications({
  userId,
  position = "top-right",
  maxNotifications = 5,
  autoHideDuration = 5000,
}: RealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastReminderTime, setLastReminderTime] = useState<number>(0);
  const [lastSyncUpdate, setLastSyncUpdate] = useState<number>(0);
  const [lastConflictCheck, setLastConflictCheck] = useState<number>(0);

  // Subscribe to real-time data
  const { reminders, nextReminder } = useRealtimeReminders(userId, 30); // 30 minute window
  const { syncStatus, isSyncing } = useRealtimeSyncStatus(userId);
  const { hasConflicts, totalConflicts } = useRealtimeConflicts(userId);

  // Helper to add notification
  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Auto-hide after duration
    if (autoHideDuration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoHideDuration);
    }
  }, [maxNotifications, autoHideDuration]);

  // Helper to remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Check for upcoming reminders
  useEffect(() => {
    if (!nextReminder) return;

    const now = Date.now();
    if (nextReminder.shouldFireNow && nextReminder.reminderTime > lastReminderTime) {
      setLastReminderTime(nextReminder.reminderTime);
      
      addNotification({
        type: "reminder",
        title: "Event Reminder",
        message: `${nextReminder.eventTitle} starts in ${nextReminder.minutesBefore} minutes`,
        icon: <Clock className="h-5 w-5" />,
        action: {
          label: "View",
          onClick: () => {
            // Navigate to event
            console.log("Navigate to event:", nextReminder.eventId);
          },
        },
      });
    }
  }, [nextReminder, lastReminderTime, addNotification]);

  // Monitor sync status changes
  useEffect(() => {
    if (!syncStatus) return;

    const now = Date.now();
    
    // Show notification when sync starts
    if (isSyncing && now - lastSyncUpdate > 5000) {
      setLastSyncUpdate(now);
      
      addNotification({
        type: "sync",
        title: "Syncing Calendars",
        message: `Syncing ${syncStatus.totalProcessing} items...`,
        icon: <Sync className="h-5 w-5 animate-spin" />,
      });
    }

    // Show success when sync completes
    if (!isSyncing && syncStatus.totalProcessing === 0 && lastSyncUpdate > 0) {
      setLastSyncUpdate(0);
      
      addNotification({
        type: "success",
        title: "Sync Complete",
        message: "All calendars are up to date",
        icon: <CheckCircle className="h-5 w-5" />,
      });
    }
  }, [syncStatus, isSyncing, lastSyncUpdate, addNotification]);

  // Monitor conflicts
  useEffect(() => {
    if (!hasConflicts) return;

    const now = Date.now();
    if (totalConflicts > 0 && now - lastConflictCheck > 60000) { // Check every minute
      setLastConflictCheck(now);
      
      addNotification({
        type: "conflict",
        title: "Sync Conflicts Detected",
        message: `${totalConflicts} event${totalConflicts > 1 ? "s" : ""} need${totalConflicts > 1 ? "" : "s"} your attention`,
        icon: <AlertTriangle className="h-5 w-5" />,
        action: {
          label: "Resolve",
          onClick: () => {
            // Navigate to conflict resolution
            console.log("Navigate to conflict resolution");
          },
        },
      });
    }
  }, [hasConflicts, totalConflicts, lastConflictCheck, addNotification]);

  // Position classes
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  // Icon based on type
  const getIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    switch (notification.type) {
      case "reminder":
        return <Bell className="h-5 w-5" />;
      case "sync":
        return <Sync className="h-5 w-5" />;
      case "conflict":
        return <AlertTriangle className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  // Color based on type
  const getColorClasses = (type: Notification["type"]) => {
    switch (type) {
      case "reminder":
        return "bg-blue-500 text-white";
      case "sync":
        return "bg-purple-500 text-white";
      case "conflict":
        return "bg-orange-500 text-white";
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 pointer-events-none`}
      style={{ maxWidth: "400px" }}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: position.includes("right") ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: position.includes("right") ? 100 : -100 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto mb-3"
          >
            <div
              className={`rounded-lg shadow-lg p-4 ${getColorClasses(
                notification.type
              )} backdrop-blur-sm`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <p className="text-sm opacity-90 mt-1">{notification.message}</p>
                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className="mt-2 text-xs font-medium underline hover:no-underline"
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 ml-2 hover:opacity-75 transition-opacity"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Notification Bell Icon with Badge
 * Shows count of pending notifications
 */
export function NotificationBell({ userId }: { userId: Id<"users"> | undefined }) {
  const { hasUpcomingReminders, totalUpcoming } = useRealtimeReminders(userId, 60);
  const { hasConflicts, totalConflicts } = useRealtimeConflicts(userId);
  
  const totalNotifications = totalUpcoming + totalConflicts;
  
  return (
    <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      {totalNotifications > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
          {totalNotifications > 9 ? "9+" : totalNotifications}
        </span>
      )}
    </button>
  );
}

/**
 * Connection Status Indicator
 * Shows real-time connection status
 */
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <AlertCircle className="h-5 w-5" />
      <span className="text-sm font-medium">No internet connection</span>
    </div>
  );
}