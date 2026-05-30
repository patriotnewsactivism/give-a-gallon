import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { createAccount, retrieveAccount } from "@convex-dev/auth/server";
import { Scrypt } from "lucia";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";

// Direct password auth using ConvexCredentials.
// No email verification, no Resend API key, no JWT_PRIVATE_KEY needed.
// Passwords are hashed with Scrypt (via lucia).
const PasswordCredentials = ConvexCredentials<DataModel>({
  id: "password",
  crypto: {
    async hashSecret(password: string) {
      return await new Scrypt().hash(password);
    },
    async verifySecret(password: string, hash: string) {
      return await new Scrypt().verify(hash, password);
    },
  },
  authorize: async (params, ctx) => {
    const email = params.email as string;
    const password = params.password as string;
    const flow = params.flow as string;
    const name = (params.name as string) || undefined;

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (flow === "signUp") {
      // Try to retrieve existing account first
      try {
        const existing = await retrieveAccount(ctx, {
          provider: "password",
          account: {
            id: email,
            secret: password,
          },
        });
        // Account exists and password matches — sign them in
        return { userId: existing.user._id };
      } catch {
        // Account doesn't exist or password wrong — create new
      }

      const { user } = await createAccount(ctx, {
        provider: "password",
        account: {
          id: email,
          secret: password,
        },
        profile: {
          email,
          name: name || email.split("@")[0],
          emailVerificationTime: Date.now(),
        },
        shouldLinkViaEmail: false,
      });

      return { userId: user._id };
    }

    // Sign in flow
    const result = await retrieveAccount(ctx, {
      provider: "password",
      account: {
        id: email,
        secret: password,
      },
    });

    return { userId: result.user._id };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordCredentials],
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});