/**
 * Convex Authentication Configuration
 *
 * Configures Clerk authentication for CheatCal platform with proper JWT verification.
 * This enables secure user authentication throughout the Convex backend.
 */

export default {
  providers: [
    {
      domain: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('test')
        ? 'https://burly-gnat-79.clerk.accounts.dev'
        : 'https://clerk.cheatcal.com',
      applicationID: 'convex',
    },
  ],
};
