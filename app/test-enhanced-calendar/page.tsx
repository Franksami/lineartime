/**
 * Legacy Test Route Redirect
 * Redirects to Command Workspace with appropriate view
 */

import { redirect } from 'next/navigation';

export default function TestEnhancedCalendarPage() {
  redirect('/app?view=week&test=enhanced-calendar');
}
