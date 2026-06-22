// Give a Gallon — Stripe Connect V2 Integration (Sample Code)
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import Stripe from "stripe";

/**
 * Helper to initialize the Stripe Client.
 * Since this is a TypeScript/JavaScript codebase, we use the 'stripe' Node.js SDK.
 * We use the 'stripeClient' variable name and pattern for all requests as requested.
 *
 * The latest version of the Stripe API (e.g. 2026-05-27.dahlia) is used automatically by the SDK.
 */
function getStripeClient(): Stripe {
  // Check if Stripe API Key is configured in environment variables
  // If not, provide a helpful developer error message with placeholder comments
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey || apiKey === "YOUR_STRIPE_SECRET_KEY") {
    throw new Error(
      "Missing STRIPE_SECRET_KEY environment variable. " +
      "Please set STRIPE_SECRET_KEY in your Convex Dashboard to continue. " +
      "Placeholder value 'sk_test_...' can be retrieved from: https://dashboard.stripe.com/test/apikeys"
    );
  }

  // Use the standard Stripe client instantiation as requested: new Stripe('sk_***')
  return new Stripe(apiKey);
}

// ── 1. DB Mappings & Queries ───────────────────────────────────────────────

/**
 * Query to check if the currently authenticated user has an active Stripe V2 Connect account mapping in the DB.
 */
export const getMyV2AccountMapping = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Retrieve the user's mapped Stripe Connect V2 account from the DB
    return await ctx.db
      .query("stripeV2Accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Query to retrieve a specific Stripe V2 Connect account mapping by user ID.
 * Useful for public storefront views.
 */
export const getV2AccountMappingByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("stripeV2Accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Internal mutation to store a mapping from the user object to the Stripe Connect account ID.
 */
export const storeV2AccountMapping = internalMutation({
  args: {
    userId: v.id("users"),
    stripeAccountId: v.string(),
    stripeAccountStatus: v.string(),
    displayName: v.string(),
    contactEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // If a mapping already exists for this user, delete or update it.
    const existing = await ctx.db
      .query("stripeV2Accounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeAccountId: args.stripeAccountId,
        stripeAccountStatus: args.stripeAccountStatus,
        displayName: args.displayName,
        contactEmail: args.contactEmail,
      });
      return existing._id;
    }

    return await ctx.db.insert("stripeV2Accounts", {
      userId: args.userId,
      stripeAccountId: args.stripeAccountId,
      stripeAccountStatus: args.stripeAccountStatus,
      displayName: args.displayName,
      contactEmail: args.contactEmail,
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal mutation to update the status of a Stripe V2 Connect account mapping.
 */
export const updateV2AccountStatus = internalMutation({
  args: {
    stripeAccountId: v.string(),
    stripeAccountStatus: v.string(),
  },
  handler: async (ctx, { stripeAccountId, stripeAccountStatus }) => {
    const record = await ctx.db
      .query("stripeV2Accounts")
      .withIndex("by_stripeAccount", (q) => q.eq("stripeAccountId", stripeAccountId))
      .unique();

    if (record) {
      await ctx.db.patch(record._id, { stripeAccountStatus });
      console.log(`Updated stripeV2Account status for ${stripeAccountId} to ${stripeAccountStatus}`);
    } else {
      console.warn(`No local record found for stripeAccountId ${stripeAccountId}`);
    }
  },
});

// ── 2. Creating Connected Accounts ─────────────────────────────────────────

/**
 * Action to create a new Connected Account using the V2 API.
 * This maps the current authenticated user to the newly created Stripe Account ID.
 */
export const createV2Account = action({
  args: {
    displayName: v.string(),
    contactEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("You must be logged in to create a connected account.");
    }

    const stripeClient = getStripeClient();

    console.log(`Creating Stripe Connect V2 Account for user ${userId}...`);

    try {
      /**
       * Note: When creating connected accounts, we use the V2 API with the properties below.
       * ONLY use these properties. Never pass type at the top level.
       * DO NOT use top level type: 'express' or type: 'standard' or type 'custom'.
       */
      const account = await stripeClient.v2.core.accounts.create({
        display_name: args.displayName,
        contact_email: args.contactEmail,
        identity: {
          country: 'us',
        },
        dashboard: 'full',
        defaults: {
          responsibilities: {
            fees_collector: 'stripe',
            losses_collector: 'stripe',
          },
        },
        configuration: {
          customer: {},
          merchant: {
            capabilities: {
              card_payments: {
                requested: true,
              },
            },
          },
        },
      });

      console.log(`Stripe V2 Connected Account successfully created: ${account.id}`);

      // Store mapping from the user object to the Stripe account ID in the DB
      await ctx.runMutation(internal.connectV2.storeV2AccountMapping, {
        userId,
        stripeAccountId: account.id,
        stripeAccountStatus: "pending", // Initially pending onboarding
        displayName: args.displayName,
        contactEmail: args.contactEmail,
      });

      return { stripeAccountId: account.id };
    } catch (err: any) {
      console.error("Stripe Connect Account creation failed:", err);
      throw new Error(`Stripe Connect creation failed: ${err.message || err}`);
    }
  },
});

// ── 3. Onboarding Connected Accounts ───────────────────────────────────────

/**
 * Action to create an onboarding link for a connected account.
 * This onboard process uses Stripe Account Links via the V2 Account Links API.
 */
export const getV2OnboardingLink = action({
  args: {
    stripeAccountId: v.string(),
  },
  handler: async (ctx, { stripeAccountId }) => {
    const stripeClient = getStripeClient();
    const siteUrl = process.env.SITE_URL || "http://localhost:5173";

    console.log(`Generating V2 onboarding link for Stripe Account ${stripeAccountId}...`);

    try {
      /**
       * Use the V2 account links API to create an account link.
       * Users can click this link to complete their KYC/onboarding on Stripe.
       */
      const accountLink = await stripeClient.v2.core.accountLinks.create({
        account: stripeAccountId,
        use_case: {
          type: 'account_onboarding',
          account_onboarding: {
            configurations: ['merchant', 'customer'],
            refresh_url: `${siteUrl}/stripe-connect-sample?connect=refresh`,
            return_url: `${siteUrl}/stripe-connect-sample?connect=complete&accountId=${stripeAccountId}`,
          },
        },
      });

      return { url: accountLink.url };
    } catch (err: any) {
      console.error("Failed to create Stripe Account Link:", err);
      throw new Error(`Stripe Account Link creation failed: ${err.message || err}`);
    }
  },
});

/**
 * Action to retrieve the current onboarding/verification status directly from Stripe API.
 * As instructed, we do not rely purely on the DB mapping; we query the accounts API directly
 * to see if onboarding is completed, and we sync the local DB status as well.
 */
export const getV2AccountStatus = action({
  args: {
    stripeAccountId: v.string(),
  },
  handler: async (ctx, { stripeAccountId }) => {
    const stripeClient = getStripeClient();

    console.log(`Retrieving Stripe Connect V2 Account status for ${stripeAccountId}...`);

    try {
      /**
       * Retrieve the account from Stripe with configuration and requirements expanded/included.
       * This allows us to inspect requirements deadlines and capability statuses.
       */
      const account = await stripeClient.v2.core.accounts.retrieve(stripeAccountId, {
        include: ["configuration.merchant", "requirements"],
      });

      // Determine if the merchant is ready to process payments
      const readyToProcessPayments =
        account?.configuration?.merchant?.capabilities?.card_payments?.status === "active";

      // Examine requirements minimum deadline status
      const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;

      // Onboarding is complete when minimum requirements are not currently_due or past_due
      const onboardingComplete =
        requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

      // Sync status with our local database mapping
      let localStatus = "pending";
      if (readyToProcessPayments && onboardingComplete) {
        localStatus = "active";
      } else if (requirementsStatus === "past_due") {
        localStatus = "restricted";
      }

      await ctx.runMutation(internal.connectV2.updateV2AccountStatus, {
        stripeAccountId,
        stripeAccountStatus: localStatus,
      });

      return {
        stripeAccountId: account.id,
        readyToProcessPayments,
        requirementsStatus: requirementsStatus || "none",
        onboardingComplete,
        stripeAccountStatus: localStatus,
        displayName: account.display_name,
        contactEmail: account.contact_email,
      };
    } catch (err: any) {
      console.error("Failed to retrieve Stripe Account Status:", err);
      throw new Error(`Stripe Account status retrieval failed: ${err.message || err}`);
    }
  },
});

// ── 4. Create Products ─────────────────────────────────────────────────────

/**
 * Action to create a Stripe Product on a specific Connected Account.
 * Uses the Stripe-Account header via the 'stripeAccount' options parameter in Node.js.
 */
export const createV2Product = action({
  args: {
    stripeAccountId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    priceInCents: v.number(),
    currency: v.string(), // e.g. "usd"
  },
  handler: async (ctx, args) => {
    const stripeClient = getStripeClient();

    console.log(`Creating product '${args.name}' on Stripe Connected Account ${args.stripeAccountId}...`);

    try {
      /**
       * Create products on the connected account by passing the 'stripeAccount' property
       * inside the options object (second argument to the create call).
       * This sets the 'Stripe-Account' header under the hood.
       */
      const product = await stripeClient.products.create(
        {
          name: args.name,
          description: args.description || "",
          default_price_data: {
            unit_amount: args.priceInCents,
            currency: args.currency,
          },
        },
        {
          stripeAccount: args.stripeAccountId, // Use stripeAccount for the Stripe-Account header
        }
      );

      console.log(`Product successfully created! ID: ${product.id}`);
      return { productId: product.id, product };
    } catch (err: any) {
      console.error("Failed to create product on Connected Account:", err);
      throw new Error(`Failed to create product: ${err.message || err}`);
    }
  },
});

// ── 5. Display Products ────────────────────────────────────────────────────

/**
 * Action to list products on a specific Connected Account.
 * Uses the Stripe-Account header to fetch from the connected account.
 */
export const listV2Products = action({
  args: {
    stripeAccountId: v.string(),
  },
  handler: async (ctx, { stripeAccountId }) => {
    const stripeClient = getStripeClient();

    console.log(`Retrieving products from Stripe Connected Account ${stripeAccountId}...`);

    try {
      /**
       * Retrieve active products.
       * Make sure to pass the connected account header when retrieving products
       * using the 'stripeAccount' property inside the options object.
       */
      const productsList = await stripeClient.products.list(
        {
          limit: 20,
          active: true,
          expand: ['data.default_price'],
        },
        {
          stripeAccount: stripeAccountId, // Uses the 'Stripe-Account' header
        }
      );

      return productsList.data.map((prod) => {
        const defaultPriceObj = prod.default_price as Stripe.Price | null;
        return {
          id: prod.id,
          name: prod.name,
          description: prod.description,
          priceId: defaultPriceObj?.id || "",
          priceInCents: defaultPriceObj?.unit_amount || 0,
          currency: defaultPriceObj?.currency || "usd",
        };
      });
    } catch (err: any) {
      console.error("Failed to list products from Connected Account:", err);
      throw new Error(`Failed to list products: ${err.message || err}`);
    }
  },
});

// ── 6. Process Charges (Direct Charge with Platform Fee) ────────────────────

/**
 * Action to create a checkout session for purchasing a product.
 * Uses hosted checkout and a Direct Charge with an application fee to monetize the transaction.
 */
export const createV2CheckoutSession = action({
  args: {
    stripeAccountId: v.string(),
    priceId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, { stripeAccountId, priceId, quantity }) => {
    const stripeClient = getStripeClient();
    const siteUrl = process.env.SITE_URL || "http://localhost:5173";

    console.log(`Creating Direct Charge Checkout Session for account ${stripeAccountId}...`);

    try {
      // First, retrieve the price to calculate a sample platform application fee
      const priceObj = await stripeClient.prices.retrieve(
        priceId,
        {},
        { stripeAccount: stripeAccountId }
      );
      const unitAmount = priceObj.unit_amount || 0;
      const totalAmount = unitAmount * quantity;

      // Charge a sample 10% platform fee
      const applicationFeeCents = Math.round(totalAmount * 0.10);

      /**
       * Use hosted checkout for simplicity.
       * Pass the stripeAccount option as the second argument to execute this checkout session
       * directly on the connected account (Direct Charge).
       */
      const session = await stripeClient.checkout.sessions.create(
        {
          line_items: [
            {
              price: priceId, // Pass the direct price ID of the product
              quantity: quantity,
            },
          ],
          payment_intent_data: {
            // Sample Application Fee collected by the platform
            application_fee_amount: applicationFeeCents,
          },
          mode: 'payment',
          success_url: `${siteUrl}/stripe-connect-sample?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}/stripe-connect-sample?purchase=cancel`,
        },
        {
          stripeAccount: stripeAccountId, // Use stripeAccount for the Stripe-Account header
        }
      );

      console.log(`Checkout Session created successfully: ${session.id}`);
      return { url: session.url, sessionId: session.id };
    } catch (err: any) {
      console.error("Failed to create Checkout Session:", err);
      throw new Error(`Failed to create purchase session: ${err.message || err}`);
    }
  },
});

// ── 7. Requirements Change Webhook Handler (Thin Webhooks) ──────────────────

/**
 * Action to handle Stripe webhook requests for Connect V2 Thin Events.
 * Since V2 events are "thin", we first verify the signature, parse the event metadata,
 * and then make an API call to retrieve the full event resource details from Stripe.
 */
export const handleV2Webhook = action({
  args: {
    payload: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, { payload, signature }) => {
    const stripeClient = getStripeClient();

    // Check if the webhook signing secret is configured
    // If not, provide a helpful developer error message with placeholder comments
    const webhookSecret = process.env.STRIPE_V2_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === "YOUR_STRIPE_WEBHOOK_SECRET") {
      throw new Error(
        "STRIPE_V2_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET is not configured on this environment. " +
        "Please set this variable in your Convex Dashboard. " +
        "Placeholder value 'whsec_...' can be retrieved from Stripe Dashboard Webhook destinations."
      );
    }

    try {
      console.log("Parsing Connect V2 thin event webhook...");
      
      /**
       * Parse 'thin' event signature and structure.
       * Uses the 'parseThinEvent' helper on the stripeClient instance for V2 accounts.
       */
      const thinEvent = stripeClient.parseThinEvent(payload, signature, webhookSecret);
      console.log(`Verified thin event: ${thinEvent.type} (ID: ${thinEvent.id})`);

      /**
       * Fetch the full event data from the API to understand the requirements/details.
       * This uses the event's ID to fetch the full v2 event.
       */
      const event = await stripeClient.v2.core.events.retrieve(thinEvent.id);
      console.log(`Successfully retrieved full v2 event payload. Type: ${event.type}`);

      // Handle the different event types
      if (
        event.type === "v2.core.account[requirements].updated" ||
        event.type === "v2.core.account[configuration.merchant].capability_status_updated" ||
        event.type === "v2.core.account[configuration.customer].capability_status_updated"
      ) {
        /**
         * Note on general tips:
         * Do not use .customer id's for V2 accounts. Instead, get the ID from .customer_account.
         * Example:
         * const accountId = subscription.customer_account; (which is shape acct_***)
         * 
         * In V2 account event, the context/related account ID is present on the event data context:
         * Or we can retrieve the account object or query status from the event payload.
         */
        const accountId = event.context || (event.data as any)?.object?.id;
        if (accountId) {
          console.log(`Detected status or requirements change on connected account ${accountId}. Triggering status sync...`);
          
          // Retrieve current account state from the API to update database mapping
          const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
            include: ["configuration.merchant", "requirements"],
          });

          const readyToProcessPayments =
            account?.configuration?.merchant?.capabilities?.card_payments?.status === "active";
          const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
          const onboardingComplete =
            requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

          let localStatus = "pending";
          if (readyToProcessPayments && onboardingComplete) {
            localStatus = "active";
          } else if (requirementsStatus === "past_due") {
            localStatus = "restricted";
          }

          await ctx.runMutation(internal.connectV2.updateV2AccountStatus, {
            stripeAccountId: accountId,
            stripeAccountStatus: localStatus,
          });
        }
      } else {
        console.log(`Ignoring unhandled V2 event type: ${event.type}`);
      }

      return { processed: true };
    } catch (err: any) {
      console.error("Connect V2 Webhook processing failed:", err);
      throw new Error(`Webhook error: ${err.message || err}`);
    }
  },
});
