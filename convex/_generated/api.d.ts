/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ViktorSpacesEmail from "../ViktorSpacesEmail.js";
import type * as auth from "../auth.js";
import type * as connect from "../connect.js";
import type * as constants from "../constants.js";
import type * as creators from "../creators.js";
import type * as donations from "../donations.js";
import type * as emails from "../emails.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as milestones from "../milestones.js";
import type * as platform from "../platform.js";
import type * as referrals from "../referrals.js";
import type * as seedTestUser from "../seedTestUser.js";
import type * as stripe from "../stripe.js";
import type * as subscriptions from "../subscriptions.js";
import type * as testAuth from "../testAuth.js";
import type * as updates from "../updates.js";
import type * as users from "../users.js";
import type * as viktorTools from "../viktorTools.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ViktorSpacesEmail: typeof ViktorSpacesEmail;
  auth: typeof auth;
  connect: typeof connect;
  constants: typeof constants;
  creators: typeof creators;
  donations: typeof donations;
  emails: typeof emails;
  files: typeof files;
  http: typeof http;
  milestones: typeof milestones;
  platform: typeof platform;
  referrals: typeof referrals;
  seedTestUser: typeof seedTestUser;
  stripe: typeof stripe;
  subscriptions: typeof subscriptions;
  testAuth: typeof testAuth;
  updates: typeof updates;
  users: typeof users;
  viktorTools: typeof viktorTools;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
