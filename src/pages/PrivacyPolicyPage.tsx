import { Link } from "react-router-dom";
import { useEffect } from "react";

export function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container max-w-3xl py-16 px-4 sm:px-6">
        {/* Header */}
        <h1
          className="text-4xl sm:text-5xl font-black uppercase tracking-tight mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Privacy <span className="text-fuel">Policy</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Effective Date: June 17, 2026 · Last Updated: June 17, 2026
        </p>

        <p className="text-muted-foreground mb-6">
          Give-A-Gallon ("we," "us," or "the Platform") is operated by We The People News. This Privacy Policy explains how we collect, use, and protect information when you use give.wtpnews.org and related services.
        </p>

        {/* Callout */}
        <div className="bg-fuel/10 border-l-[3px] border-fuel rounded-r-lg px-5 py-4 mb-8">
          <p className="text-sm">
            <strong className="text-foreground">The short version:</strong>{" "}
            <span className="text-muted-foreground">
              We collect only what's needed to process donations and payouts. We don't sell your data. We don't share your personal information with advertisers. Period.
            </span>
          </p>
        </div>

        {/* Sections */}
        <Section title="1. Information We Collect">
          <p>
            <strong className="text-foreground">Account Information.</strong>{" "}
            When you sign up as a campaign creator or supporter, we collect your name, email address, and — for campaign creators — payout details required by our payment processor (Stripe).
          </p>
          <p>
            <strong className="text-foreground">Payment Information.</strong>{" "}
            All payment processing is handled by{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-fuel hover:underline">
              Stripe, Inc.
            </a>{" "}
            We do not store your credit card number, bank account number, or other sensitive financial data on our servers. Stripe collects and processes this information under their own privacy policy.
          </p>
          <p>
            <strong className="text-foreground">Donation Activity.</strong>{" "}
            We record donation amounts, recipient campaigns, timestamps, and display names. Your first name and donation amount may be displayed publicly in the live activity ticker and on campaign pages.
          </p>
          <p>
            <strong className="text-foreground">Usage Data.</strong> We automatically collect:
          </p>
          <ul>
            <li>Browser type and version</li>
            <li>Pages visited and time spent</li>
            <li>Referring URL</li>
            <li>Device type and screen size</li>
            <li>IP address (anonymized for analytics)</li>
          </ul>
          <p>
            <strong className="text-foreground">Cookies.</strong>{" "}
            We use essential cookies for authentication and session management. We may use analytics cookies (such as Google Analytics) to understand how the Platform is used. We do not use advertising cookies or tracking pixels.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul>
            <li>Process donations and payouts through Stripe</li>
            <li>Display campaign progress, leaderboards, and live activity</li>
            <li>Communicate with you about your account, donations, or campaigns</li>
            <li>Prevent fraud and ensure platform security</li>
            <li>Improve the Platform based on aggregate usage patterns</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. What We Share — and What We Don't">
          <p><strong className="text-foreground">We do NOT:</strong></p>
          <ul>
            <li>Sell your personal information to anyone</li>
            <li>Share your data with advertisers</li>
            <li>Provide your email or financial details to campaign creators (and vice versa)</li>
          </ul>
          <p><strong className="text-foreground">We DO share data with:</strong></p>
          <ul>
            <li>
              <strong className="text-foreground">Stripe</strong> — to process payments, payouts, and identity verification for campaign creators. Stripe acts as an independent data controller. See{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-fuel hover:underline">
                Stripe's Privacy Policy
              </a>.
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> — our hosting provider, which processes server requests. See{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-fuel hover:underline">
                Vercel's Privacy Policy
              </a>.
            </li>
            <li>
              <strong className="text-foreground">Law enforcement</strong> — only when required by valid legal process (subpoena, court order, or applicable law).
            </li>
          </ul>
        </Section>

        <Section title="4. Public Information">
          <p>The following information may be displayed publicly on the Platform:</p>
          <ul>
            <li>Your first name and donation amount (in the live ticker and campaign pages)</li>
            <li>Campaign creator names, descriptions, and gallon totals</li>
            <li>Leaderboard rankings</li>
          </ul>
          <p>If you prefer to donate anonymously, you may do so during the donation flow.</p>
        </Section>

        <Section title="5. Data Security">
          <p>We implement industry-standard security measures including:</p>
          <ul>
            <li>SSL/TLS encryption on all connections</li>
            <li>Stripe's PCI-DSS Level 1 compliance for all payment data</li>
            <li>Access controls limiting who can view account data</li>
            <li>Regular monitoring for unauthorized access</li>
          </ul>
          <div className="bg-fuel/10 border-l-[3px] border-fuel rounded-r-lg px-5 py-4 my-4">
            <p className="text-sm">
              <strong className="text-foreground">We never see your full card number.</strong>{" "}
              <span className="text-muted-foreground">
                All sensitive payment data is collected and stored exclusively by Stripe. Our servers never touch it.
              </span>
            </p>
          </div>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul>
            <li><strong className="text-foreground">Access</strong> the personal information we hold about you</li>
            <li><strong className="text-foreground">Correct</strong> inaccurate information</li>
            <li><strong className="text-foreground">Delete</strong> your account and associated data (note: transaction records may be retained as required by law)</li>
            <li><strong className="text-foreground">Opt out</strong> of non-essential communications</li>
            <li><strong className="text-foreground">Export</strong> your data in a portable format upon request</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:wtpjournalism@gmail.com" className="text-fuel hover:underline">wtpjournalism@gmail.com</a>.
          </p>
        </Section>

        <Section title="7. California Residents (CCPA)">
          <p>
            If you are a California resident, you have additional rights under the California Consumer Privacy Act, including the right to know what personal information we collect, request deletion, and opt out of any sale of personal information. We do not sell personal information. To make a CCPA request, contact us at the email above.
          </p>
        </Section>

        <Section title="8. Children's Privacy (COPPA)">
          <p>
            Give-A-Gallon is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child under 13 has provided us with personal information, please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="9. Third-Party Links">
          <p>
            The Platform may contain links to external sites, including wtpnews.org, civilrightshub.org, and campaign creators' own websites. We are not responsible for the privacy practices of those sites.
          </p>
        </Section>

        <Section title="10. Data Retention">
          <p>
            We retain account information for as long as your account is active. If you delete your account, we will remove your personal information within 30 days, except where retention is required for legal, tax, or fraud-prevention purposes (e.g., donation transaction records).
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated effective date. Continued use of the Platform after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p>For privacy questions or requests:</p>
          <p>
            <strong className="text-foreground">We The People News</strong><br />
            Email:{" "}
            <a href="mailto:wtpjournalism@gmail.com" className="text-fuel hover:underline">wtpjournalism@gmail.com</a><br />
            Website:{" "}
            <a href="https://wtpnews.org" target="_blank" rel="noopener noreferrer" className="text-fuel hover:underline">wtpnews.org</a>
          </p>
        </Section>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <Link to="/" className="text-sm text-fuel hover:underline">
            ← Back to Give-A-Gallon
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-lg font-bold uppercase text-fuel tracking-wide mb-4"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default PrivacyPolicyPage;
