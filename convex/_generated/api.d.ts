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
import type * as checkEnv from "../checkEnv.js";
import type * as constants from "../constants.js";
import type * as creators from "../creators.js";
import type * as donations from "../donations.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as seedTestUser from "../seedTestUser.js";
import type * as stripe from "../stripe.js";
import type * as testAuth from "../testAuth.js";
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
  checkEnv: typeof checkEnv;
  constants: typeof constants;
  creators: typeof creators;
  donations: typeof donations;
  files: typeof files;
  http: typeof http;
  seedTestUser: typeof seedTestUser;
  stripe: typeof stripe;
  testAuth: typeof testAuth;
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
