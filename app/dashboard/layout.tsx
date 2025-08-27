import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type React from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated (allow in development for foundation tests)
  const { userId } = await auth();

  if (!userId && process.env.NODE_ENV === 'production') {
    redirect('/landing');
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>

      {/* Global Toast Notifications */}
      <Toaster />
    </div>
  );
}
