import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const debugSignUp = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const results: string[] = [];
    
    try {
      results.push("Starting sign-up test for: " + args.email);
      
      // Import and try the crypto functions
      const encoder = new TextEncoder();
      
      // Test hash
      results.push("Testing PBKDF2 hash...");
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey(
        "raw", encoder.encode(args.password), "PBKDF2", false, ["deriveBits"]
      );
      const hash = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial, 256
      );
      results.push("Hash OK: " + hash.byteLength + " bytes");
      
      // Try calling the actual signIn
      results.push("Attempting auth:signIn...");
      try {
        // The @convex-dev/auth signIn action
        const { signIn } = await import("./auth");
        results.push("signIn type: " + typeof signIn);
        // We can't call it directly from here - it's an action reference
        results.push("signIn is a registered action, cannot call directly from another action");
      } catch (e: any) {
        results.push("Import error: " + e.message);
      }
      
    } catch (e: any) {
      results.push("ERROR: " + e.message);
      results.push("Stack: " + (e.stack || "none").slice(0, 800));
    }
    
    return results;
  },
});

// A direct test that mimics what the authorize callback does
export const testCreateAccount = action({
  args: {},
  handler: async (ctx) => {
    try {
      const { createAccount, retrieveAccount } = await import("@convex-dev/auth/server");
      return "createAccount type: " + typeof createAccount + ", retrieveAccount type: " + typeof retrieveAccount;
    } catch (e: any) {
      return "Error importing: " + e.message + " | Stack: " + (e.stack || "").slice(0, 500);
    }
  },
});
