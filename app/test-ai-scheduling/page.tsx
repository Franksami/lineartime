/**
 * Legacy Test Route Redirect
 * Redirects to Command Workspace with AI panel open
 */

import { redirect } from 'next/navigation';

export default function TestAISchedulingPage() {
  redirect('/app?view=week&panel=ai&test=ai-scheduling');
}
