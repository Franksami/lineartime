import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/landing')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <DashboardSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      
      {/* Global Toast Notifications */}
      <Toaster />
    </div>
  )
}