import { query, mutation } from "./_generated/server";

export const deleteTestAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    const testEmails = [
      "test-viktor@example.com", "debug@example.com", "test@example.com",
      "test99@example.com", "don@test.com", "debug-real@example.com"
    ];
    const users = await ctx.db.query("users").collect();
    const deleted: string[] = [];
    for (const user of users) {
      if (testEmails.includes(user.email || "")) {
        const accounts = await ctx.db.query("authAccounts").collect();
        for (const acc of accounts) {
          if (acc.userId === user._id) {
            await ctx.db.delete(acc._id);
          }
        }
        const sessions = await ctx.db.query("authSessions").collect();
        for (const sess of sessions) {
          if ((sess as any).userId === user._id) {
            await ctx.db.delete(sess._id);
          }
        }
        await ctx.db.delete(user._id);
        deleted.push(user.email || "unknown");
      }
    }
    return { deleted };
  },
});
