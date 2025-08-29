/**
 * Legacy Test Route Redirect
 * Redirects to Command Workspace with appropriate view
 */

import { redirect } from 'next/navigation';

export default function TestCategoryTagsPage() {
  redirect('/app?view=planner&test=category-tags');
}
