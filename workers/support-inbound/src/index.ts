/**
 * Give-A-Gallon — inbound support email worker.
 *
 * Cloudflare Email Routing delivers mail addressed to support@giveagallon.org
 * to this Worker. It parses the message and POSTs a normalized payload to the
 * Convex `/support-inbound` HTTP endpoint, where the AI assistant picks up the
 * thread and replies. Optionally also forwards a copy to a human inbox.
 */
import PostalMime from "postal-mime";

export interface Env {
  /** Convex HTTP actions URL, e.g. https://aware-sandpiper-557.convex.site/support-inbound */
  CONVEX_SUPPORT_URL: string;
  /** Shared secret — must match SUPPORT_INBOUND_SECRET in the Convex deployment. */
  SUPPORT_INBOUND_SECRET: string;
  /** Optional: also forward the raw email to this verified address. */
  FORWARD_TO?: string;
}

export default {
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = await PostalMime.parse(raw);

    const from = (message.from || parsed.from?.address || "")
      .trim()
      .toLowerCase();
    const name = parsed.from?.name?.trim() ?? "";
    const subject =
      parsed.subject?.trim() ||
      message.headers.get("subject") ||
      "Support request";
    const body = (
      parsed.text ||
      parsed.html?.replace(/<[^>]+>/g, " ") ||
      ""
    ).trim();

    if (from && body) {
      await fetch(env.CONVEX_SUPPORT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-support-secret": env.SUPPORT_INBOUND_SECRET,
        },
        body: JSON.stringify({ from, name, subject, body }),
      });
    }

    if (env.FORWARD_TO) {
      await message.forward(env.FORWARD_TO);
    }
  },
};
