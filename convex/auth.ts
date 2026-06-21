import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { ResendEmail, ResendPasswordReset } from "./authEmail";

// Email verification + password reset are only enforced when Resend is
// configured (RESEND_API_KEY set in the Convex deployment). This keeps local
// dev, preview, and the E2E test user working without an email provider, while
// turning on full OTP verification automatically once the key is present.
const emailEnabled = !!process.env.RESEND_API_KEY;

const PasswordProvider = Password<DataModel>({
  id: "password",
  // Normalize and shape the user record stored on sign up.
  profile(params) {
    const email = (params.email as string)?.trim().toLowerCase();
    const name = ((params.name as string) || email?.split("@")[0]) ?? "";
    return { email, name };
  },
  validatePasswordRequirements: (password: string) => {
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
  },
  // Conditionally require OTP email verification / password reset.
  ...(emailEnabled ? { verify: ResendEmail, reset: ResendPasswordReset } : {}),
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordProvider],
});

export const currentUser = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});
