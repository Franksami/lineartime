/**
 * CheatCal Middleware - Simplified Authentication
 * 
 * Clean middleware focused on Clerk authentication for CheatCal AI Revenue Planner.
 * Removed i18n and A/B testing complexity to focus on core functionality.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes that do not require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/landing',
  '/sign-in(.*)',
  '/sign-up(.*)' 
])

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ]
}