import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { createAccount, retrieveAccount } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";

// PBKDF2 password hashing using Web Crypto API (works in Convex runtime)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts[0] !== "pbkdf2" || parts.length !== 3) return false;
  const salt = new Uint8Array(parts[1].match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const expectedHash = parts[2];
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === expectedHash;
}

const PasswordCredentials = ConvexCredentials<DataModel>({
  id: "password",
  crypto: {
    async hashSecret(password: string) {
      return await hashPassword(password);
    },
    async verifySecret(password: string, hash: string) {
      return await verifyPassword(password, hash);
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
        return { userId: existing.user._id };
      } catch {
        // Account doesn't exist — create new
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
