import { query, mutation } from "./_generated/server";

// Temporary admin functions - DELETE AFTER USE

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("authAccounts").collect();
    const users = await ctx.db.query("users").collect();
    const sessions = await ctx.db.query("authSessions").collect();
    return { accounts, users, sessions };
  },
});

export const deleteAccountByEmail = mutation({
  args: {},
  handler: async (ctx) => {
    // Find and delete accounts/users for patriotnewsactivism@gmail.com 
    const users = await ctx.db.query("users").collect();
    const targetUsers = users.filter((u: any) => 
      u.email === "patriotnewsactivism@gmail.com" || 
      u.email === "don@giveagallon.com" ||
      u.email === "final-test@giveagallon.com" ||
      u.email === "don3@test.com" ||
      u.email === "test999@test.com"
    );
    
    const deleted: string[] = [];
    for (const user of targetUsers) {
      // Delete associated accounts
      const accounts = await ctx.db.query("authAccounts").collect();
      for (const acc of accounts) {
        if (acc.userId === user._id) {
          // Delete sessions for this account
          const sessions = await ctx.db.query("authSessions").collect();
          for (const sess of sessions) {
            if ((sess as any).userId === user._id) {
              await ctx.db.delete(sess._id);
            }
          }
          // Delete refresh tokens
          const tokens = await ctx.db.query("authRefreshTokens").collect();
          for (const tok of tokens) {
            if ((tok as any).sessionId) {
              // Delete all tokens to be safe
              await ctx.db.delete(tok._id);
            }
          }
          await ctx.db.delete(acc._id);
        }
      }
      await ctx.db.delete(user._id);
      deleted.push(user.email || "unknown");
    }
    return { deleted };
  },
});
