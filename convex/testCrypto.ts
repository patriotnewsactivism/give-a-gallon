import { action } from "./_generated/server";

export const testSignUp = action({
  args: {},
  handler: async () => {
    const results: string[] = [];
    
    try {
      // Test 1: Can we import the auth module?
      results.push("Step 1: Importing auth module...");
      const authModule = await import("./auth");
      results.push("Step 1: OK - auth module loaded");
      results.push("Exports: " + Object.keys(authModule).join(", "));
    } catch (e: any) {
      results.push("Step 1 FAILED: " + e.message);
      results.push("Stack: " + (e.stack || "none").slice(0, 500));
    }
    
    return results;
  },
});
