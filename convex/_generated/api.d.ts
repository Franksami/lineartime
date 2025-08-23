/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as calendar_caldav from "../calendar/caldav.js";
import type * as calendar_events from "../calendar/events.js";
import type * as calendar_google from "../calendar/google.js";
import type * as calendar_providers from "../calendar/providers.js";
import type * as calendar_sync from "../calendar/sync.js";
import type * as clerk from "../clerk.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as optimizations from "../optimizations.js";
import type * as performanceMonitor from "../performanceMonitor.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as utils_encryption from "../utils/encryption.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "calendar/caldav": typeof calendar_caldav;
  "calendar/events": typeof calendar_events;
  "calendar/google": typeof calendar_google;
  "calendar/providers": typeof calendar_providers;
  "calendar/sync": typeof calendar_sync;
  clerk: typeof clerk;
  crons: typeof crons;
  events: typeof events;
  optimizations: typeof optimizations;
  performanceMonitor: typeof performanceMonitor;
  subscriptions: typeof subscriptions;
  users: typeof users;
  "utils/encryption": typeof utils_encryption;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
