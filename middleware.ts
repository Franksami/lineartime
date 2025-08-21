// Temporarily disabled Clerk middleware for development
// Uncomment when you have valid Clerk keys

// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// // Define public routes that don't require authentication
// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/api/webhooks(.*)',
// ]);

// export default clerkMiddleware((auth, req) => {
//   if (isPublicRoute(req)) return
//   auth.protect()
// })

// import { NextRequest } from 'next/server';
// import { securityMiddleware } from '@/middleware/security';

// Temporary passthrough middleware
// Security features are implemented but disabled due to Edge Runtime limitations
// They can be enabled in API routes instead of middleware
export default async function middleware() {
  // Security middleware disabled temporarily due to Edge Runtime limitations
  // The crypto module is not available in Edge Runtime
  // Security features can still be used in API routes
  return;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};