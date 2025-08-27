/**
 * CheatCal Default Route - AI Revenue Planner Interface
 * 
 * According to CheatCal architecture plan, AI Planner is now the default interface
 * for authenticated users, with traditional calendar moved to Planning tab.
 * 
 * Navigation structure: [Planner|Week|Day|Planning|Settings]
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import PlannerInterface from '@/components/planner/PlannerInterface';

export default async function HomePage() {
  // Check if user is authenticated
  const { userId } = await auth();

  // Redirect unauthenticated users to landing page
  if (!userId) {
    redirect('/landing');
  }

  // Authenticated users get AI Planner as default (CheatCal architecture)
  return <PlannerInterface />;
}
