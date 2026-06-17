import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Action that checks for recent donations and sends email alerts
 * Called by the Base44 automation every 10 minutes
 */
export const checkAndAlert = action({
  args: {},
  handler: async (ctx) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || "alerts@give.wtpnews.org";
    const emailRecipient = "don@donmatthews.live";
    const siteUrl = "https://give.wtpnews.org";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Query for recent donations
    const donations = await ctx.runQuery(
      internal.automations.getRecentDonationsForAlert,
      { minutesAgo: 10 }
    );

    if (!donations || donations.length === 0) {
      console.log("No new donations found");
      return { status: "ok", donations_found: 0 };
    }

    console.log(`Found ${donations.length} new donations`);

    // Send email for each donation
    const emailResults = await Promise.all(
      donations.map(async (donation: any) => {
        const creatorLink = `${siteUrl}/${donation.creatorSlug}`;
        const dollarsAmount = (donation.amountCents / 100).toFixed(2);

        const htmlBody = `
          <h2>New Donation Received! 🎉</h2>
          <p><strong>Donor:</strong> ${donation.donorName}</p>
          <p><strong>Gallons:</strong> ${donation.gallons}</p>
          <p><strong>Amount:</strong> $${dollarsAmount}</p>
          <p><strong>Campaign:</strong> <a href="${creatorLink}">${donation.creatorName}</a></p>
          <p><a href="${creatorLink}">View creator profile →</a></p>
        `;

        console.log(`Sending email alert for ${donation.donorName}'s $${dollarsAmount} donation`);

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: emailRecipient,
            subject: `New $${dollarsAmount} donation for ${donation.creatorName}`,
            html: htmlBody,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to send email: ${error}`);
          throw new Error(`Email send failed: ${error}`);
        }

        return await response.json();
      })
    );

    return {
      status: "ok",
      donations_found: donations.length,
      emails_sent: emailResults.length,
    };
  },
});
