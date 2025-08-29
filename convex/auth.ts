import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { query } from './_generated/server';

/**
 * Get the current authenticated user
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx): Promise<Doc<'users'> | null> => {
    // Get the user identity from Clerk JWT
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Get user from our database using Clerk ID
    const user: Doc<'users'> | null = await ctx.runQuery(internal.clerk.getUserByClerkId, {
      clerkUserId: identity.subject,
    });

    return user;
  },
});

/**
 * Require authentication - throws if user is not authenticated
 */
export const requireAuth = async (ctx: any): Promise<{ user: Doc<'users'>; identity: any }> => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('Authentication required');
  }

  // Retry logic to handle race condition with signup webhook
  let user: Doc<'users'> | null = null;
  const maxRetries = 3;
  const retryDelays = [100, 300, 500]; // Exponential backoff delays in ms

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    user = await ctx.runQuery(internal.clerk.getUserByClerkId, {
      clerkUserId: identity.subject,
    });

    if (user) {
      break; // User found, exit retry loop
    }

    if (attempt < maxRetries - 1) {
      // Wait before retrying (except on last attempt)
      console.warn(
        `User not found on attempt ${attempt + 1}, retrying in ${retryDelays[attempt]}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }
  }

  if (!user) {
    // Log warning but consider creating a fallback user record
    console.error(`User not found after ${maxRetries} attempts for Clerk ID: ${identity.subject}`);
    throw new Error('User not found in database after retries - signup webhook may be delayed');
  }

  return { user, identity };
};
