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
import type * as aiChat from "../aiChat.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as calendar_caldav from "../calendar/caldav.js";
import type * as calendar_encryption from "../calendar/encryption.js";
import type * as calendar_events from "../calendar/events.js";
import type * as calendar_google from "../calendar/google.js";
import type * as calendar_microsoft from "../calendar/microsoft.js";
import type * as calendar_providers from "../calendar/providers.js";
import type * as calendar_sync from "../calendar/sync.js";
import type * as clerk from "../clerk.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as optimizations from "../optimizations.js";
import type * as performanceMonitor from "../performanceMonitor.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiChat: typeof aiChat;
  auth: typeof auth;
  billing: typeof billing;
  "calendar/caldav": typeof calendar_caldav;
  "calendar/encryption": typeof calendar_encryption;
  "calendar/events": typeof calendar_events;
  "calendar/google": typeof calendar_google;
  "calendar/microsoft": typeof calendar_microsoft;
  "calendar/providers": typeof calendar_providers;
  "calendar/sync": typeof calendar_sync;
  clerk: typeof clerk;
  crons: typeof crons;
  events: typeof events;
  http: typeof http;
  optimizations: typeof optimizations;
  performanceMonitor: typeof performanceMonitor;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
