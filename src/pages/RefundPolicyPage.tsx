import { useEffect } from "react";
import { Link } from "react-router-dom";

export function RefundPolicyPage() {
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
          Refund &amp; <span className="text-fuel">Donation Policy</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Effective Date: June 24, 2026 · Last Updated: June 24, 2026
        </p>

        <p className="text-muted-foreground mb-6 text-sm">
          This policy explains how donations on Give-A-Gallon ("the Platform"),
          operated by We The People News, are processed, charged, refunded, and
          disputed. It supplements our{" "}
          <Link to="/terms" className="text-fuel hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-fuel hover:underline">
            Privacy Policy
          </Link>
          . By making a donation you agree to this policy.
        </p>

        <Section title="1. What You're Paying For">
          <p>
            A donation on Give-A-Gallon is a{" "}
            <strong className="text-foreground">voluntary contribution</strong>{" "}
            made in increments of one "gallon of fuel" ($4.25 per gallon) to a
            specific activist, journalist, or content creator ("Campaign
            Creator") that you choose. Your payment funds that creator's
            campaign; it is not a purchase of goods or services and it is not an
            investment.
          </p>
          <div className="bg-fuel/10 border-l-[3px] border-fuel rounded-r-lg px-5 py-4 my-4">
            <p className="text-sm text-muted-foreground">
              Donations are{" "}
              <strong className="text-foreground">not tax-deductible</strong>{" "}
              unless the Campaign Creator is a registered 501(c)(3) organization
              (most are not).
            </p>
          </div>
        </Section>

        <Section title="2. How Your Card Is Charged">
          <ul>
            <li>
              Your donation is charged once, at the time you complete checkout.
              Give-A-Gallon does not store your card number — payments are
              processed by our payment provider (Stripe or PayPal).
            </li>
            <li>
              Your bank or card statement will show the charge as{" "}
              <strong className="text-foreground">GIVEAGALLON</strong> (or
              "PAYPAL ⁠* GIVEAGALLON" when paying through PayPal).
            </li>
            <li>
              One-time donations are not recurring. You are only charged again
              if you separately start a monthly membership, which is clearly
              labeled as recurring at checkout and can be canceled anytime.
            </li>
          </ul>
        </Section>

        <Section title="3. Refund Policy">
          <p>
            <strong className="text-foreground">
              Donations are generally non-refundable.
            </strong>{" "}
            Because funds may be paid out to Campaign Creators quickly (in some
            cases within minutes via instant payout), refunds cannot be
            guaranteed once a donation has been processed.
          </p>
          <p>
            We will, however, review refund requests in good faith and may issue
            a refund at our discretion in cases such as:
          </p>
          <ul>
            <li>A genuine duplicate or accidental charge.</li>
            <li>
              A technical error that resulted in you being charged the wrong
              amount.
            </li>
            <li>
              A charge you did not authorize (see Section 4 — Unauthorized
              Charges).
            </li>
            <li>
              A donation made within the last 24 hours that has not yet been
              paid out to the Campaign Creator.
            </li>
          </ul>
          <p>
            To request a refund, email{" "}
            <a
              href="mailto:support@giveagallon.org"
              className="text-fuel hover:underline"
            >
              support@giveagallon.org
            </a>{" "}
            from the email address used for the donation, including the date,
            amount, and the Campaign Creator you supported. We aim to respond
            within one business day.
          </p>
        </Section>

        <Section title="4. Unauthorized Charges">
          <p>
            If you see a Give-A-Gallon or GIVEAGALLON charge you do not
            recognize or did not authorize, please contact us{" "}
            <strong className="text-foreground">
              before disputing with your bank
            </strong>{" "}
            so we can investigate and resolve it quickly:
          </p>
          <p>
            <a
              href="mailto:support@giveagallon.org"
              className="text-fuel hover:underline"
            >
              support@giveagallon.org
            </a>
          </p>
          <p>
            We take fraud seriously. If a charge is confirmed to be
            unauthorized, we will refund it and take steps to prevent further
            misuse. Reaching out to us first is usually faster than a bank
            chargeback and helps us keep the Platform safe for everyone.
          </p>
        </Section>

        <Section title="5. Chargebacks">
          <p>
            Filing a chargeback with your bank without contacting us first can
            delay resolution and may result in the disputed funds being
            reclaimed from the Campaign Creator you supported. We're almost
            always able to resolve billing issues directly and more quickly. If
            you have any concern about a charge, email{" "}
            <a
              href="mailto:support@giveagallon.org"
              className="text-fuel hover:underline"
            >
              support@giveagallon.org
            </a>{" "}
            and we'll make it right.
          </p>
        </Section>

        <Section title="6. Payouts to Campaign Creators">
          <p>
            Campaign Creators receive the net amount of each donation (after the
            platform fee and payment processing fees — see our{" "}
            <Link to="/terms" className="text-fuel hover:underline">
              Terms of Service
            </Link>{" "}
            for the fee breakdown). Payouts are handled by our payment provider.
          </p>
          <p>
            Standard payouts typically arrive within 1–2 business days. New
            payment accounts can occasionally have temporary holds or review
            periods that the payment provider applies for fraud protection;
            these are outside our control and generally clear automatically.
          </p>
        </Section>

        <Section title="7. No Guarantee of Use">
          <p>
            Give-A-Gallon is a platform that connects Donors with Campaign
            Creators. We do not control, and cannot guarantee, how a Campaign
            Creator uses funds after payout. While we require honest
            representation and remove fraudulent campaigns, donations are made
            at your own discretion and risk.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>Questions about this policy or a specific donation:</p>
          <p>
            <strong className="text-foreground">Give-A-Gallon Support</strong>
            <br />
            Email:{" "}
            <a
              href="mailto:support@giveagallon.org"
              className="text-fuel hover:underline"
            >
              support@giveagallon.org
            </a>
            <br />
            Website:{" "}
            <a
              href="https://www.giveagallon.org"
              className="text-fuel hover:underline"
            >
              www.giveagallon.org
            </a>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

export default RefundPolicyPage;
