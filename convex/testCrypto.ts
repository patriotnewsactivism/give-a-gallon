import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const debugRealSignIn = action({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];
    
    try {
      results.push("JWKS set: " + !!process.env.JWKS);
      results.push("SITE_URL: " + (process.env.SITE_URL || "NOT SET"));
      results.push("JWKS length: " + (process.env.JWKS?.length || 0));
      
      // Try to call signIn as a scheduled action
      results.push("Calling auth:signIn via ctx.runAction...");
      
      const signInResult = await ctx.runAction(api.auth.signIn, {
        provider: "password",
        params: {
          email: "debug-real@example.com",
          password: "testpassword123",
          flow: "signUp",
          name: "Debug Real",
        },
      });
      
      results.push("SUCCESS! Result: " + JSON.stringify(signInResult).slice(0, 500));
    } catch (e: any) {
      results.push("ERROR: " + e.message);
      results.push("Error data: " + JSON.stringify(e.data || {}));
      results.push("Stack: " + (e.stack || "").slice(0, 1000));
    }
    
    return results;
  },
});
