import { query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Get the current authenticated user
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get the user identity from Clerk JWT
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }

    // Get user from our database using Clerk ID
    const user = await ctx.runQuery(internal.clerk.getUserByClerkId, {
      clerkUserId: identity.subject,
    });

    return user;
  },
});

/**
 * Require authentication - throws if user is not authenticated
 */
export const requireAuth = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  
  if (!identity) {
    throw new Error("Authentication required");
  }

  const user = await ctx.runQuery(internal.clerk.getUserByClerkId, {
    clerkUserId: identity.subject,
  });

  if (!user) {
    throw new Error("User not found in database");
  }

  return { user, identity };
};

