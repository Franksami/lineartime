import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  // Check if user is authenticated
  const { userId } = await auth()
  
  // Redirect based on authentication status
  if (userId) {
    // Authenticated users go to dashboard
    redirect('/dashboard')
  } else {
    // Anonymous users see landing page
    redirect('/landing')
  }
}