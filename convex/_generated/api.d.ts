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
import type * as creators from "../creators.js";
import type * as donations from "../donations.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";
import type * as viktorTools from "../viktorTools.js";

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
  creators: typeof creators;
  donations: typeof donations;
  files: typeof files;
  http: typeof http;
  stripe: typeof stripe;
  users: typeof users;
  viktorTools: typeof viktorTools;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
