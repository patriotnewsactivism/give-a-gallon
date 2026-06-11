import { mutation } from "./_generated/server";

export const cleanPatriot = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const target = users.find((u: any) => u.email === "patriotnewsactivism@gmail.com");
    if (!target) return { deleted: false, msg: "not found" };
    
    const accounts = await ctx.db.query("authAccounts").collect();
    for (const acc of accounts) {
      if (acc.userId === target._id) await ctx.db.delete(acc._id);
    }
    const sessions = await ctx.db.query("authSessions").collect();
    for (const sess of sessions) {
      if ((sess as any).userId === target._id) await ctx.db.delete(sess._id);
    }
    const tokens = await ctx.db.query("authRefreshTokens").collect();
    for (const tok of tokens) await ctx.db.delete(tok._id);
    
    await ctx.db.delete(target._id);
    return { deleted: true };
  },
});
