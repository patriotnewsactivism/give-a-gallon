import { action } from "./_generated/server";

export const checkEnvAndAuth = action({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];
    
    // Check environment variables
    const envVars = ["SITE_URL", "JWT_PRIVATE_KEY", "JWKS", "AUTH_RESEND_KEY", "RESEND_API_KEY", "CONVEX_SITE_URL"];
    for (const key of envVars) {
      const val = process.env[key];
      results.push(key + ": " + (val ? "SET (" + val.slice(0, 20) + "...)" : "NOT SET"));
    }
    
    return results;
  },
});
