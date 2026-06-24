import { Link } from "react-router-dom";
import { useEffect } from "react";

export function TermsOfServicePage() {
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
          Terms of <span className="text-fuel">Service</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Effective Date: June 17, 2026 · Last Updated: June 17, 2026
        </p>

        <p className="text-muted-foreground mb-6 text-sm">
          Welcome to Give-A-Gallon ("the Platform"), operated by We The People News. By using www.giveagallon.org, you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Platform.
        </p>

        {/* Sections */}
        <Section title="1. What Give-A-Gallon Is">
          <p>
            Give-A-Gallon is a crowdfunding platform that enables supporters ("Donors") to fund activists, journalists, and content creators ("Campaign Creators") in increments of one gallon of gas ($4.25 per gallon).
          </p>
          <div className="bg-fuel/10 border-l-[3px] border-fuel rounded-r-lg px-5 py-4 my-4">
            <p className="text-sm">
              <strong className="text-foreground">Give-A-Gallon is a platform, not a party to donations.</strong>{" "}
              <span className="text-muted-foreground">
                We facilitate the connection between Donors and Campaign Creators. We do not control how Campaign Creators use funds after payout.
              </span>
            </p>
          </div>
        </Section>

        <Section title="2. Eligibility">
          <ul>
            <li>You must be at least 18 years old to create an account</li>
            <li>You must provide accurate and truthful information</li>
            <li>Campaign Creators must complete PayPal identity verification to receive payouts</li>
            <li>You may not use the Platform for any unlawful purpose</li>
          </ul>
        </Section>

        <Section title="3. Accounts">
          <p>
            <strong className="text-foreground">Campaign Creators.</strong>{" "}
            You are responsible for the accuracy of your campaign description. Your campaign must relate to a legitimate cause, activity, or need. Misleading or fraudulent campaigns will be removed and may result in permanent suspension.
          </p>
          <p>
            <strong className="text-foreground">Donors.</strong>{" "}
            By donating, you understand that your contribution is a voluntary gift. Donations are not tax-deductible unless the Campaign Creator is a registered 501(c)(3) organization (which most are not).
          </p>
          <p>
            <strong className="text-foreground">Account Security.</strong>{" "}
            You are responsible for maintaining the security of your account credentials. Notify us immediately if you suspect unauthorized access.
          </p>
        </Section>

        <Section title="4. Fees and Payments">
          {/* Fee table */}
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-fuel">Fee</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-fuel">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-fuel">Who Pays</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/20">
                  <td className="py-3 px-4">Platform fee</td>
                  <td className="py-3 px-4">5%</td>
                  <td className="py-3 px-4">Deducted from donation</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-3 px-4">PayPal processing</td>
                  <td className="py-3 px-4">~3%</td>
                  <td className="py-3 px-4">Deducted from donation</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-3 px-4 text-foreground font-medium">Net to Campaign Creator</td>
                  <td className="py-3 px-4 text-foreground font-medium">~92%</td>
                  <td className="py-3 px-4">—</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-3 px-4">Standard payout</td>
                  <td className="py-3 px-4">Free</td>
                  <td className="py-3 px-4">1–2 business days</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-3 px-4">⚡ Instant payout</td>
                  <td className="py-3 px-4">~3% (PayPal processing fee)</td>
                  <td className="py-3 px-4">Campaign Creator (at cost)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            All payments are processed by{" "}
            <a href="https://paypal.com" target="_blank" rel="noopener noreferrer" className="text-fuel hover:underline">PayPal, Inc.</a>{" "}
            By using the Platform, you also agree to{" "}
            <a href="https://www.paypal.com/us/legalhub/paypal-user-agreement-full" target="_blank" rel="noopener noreferrer" className="text-fuel hover:underline">PayPal's User Agreement</a>{" "}
            (for Campaign Creators) and{" "}
            <a href="https://www.paypal.com/us/legalhub/paypal-user-agreement-full" target="_blank" rel="noopener noreferrer" className="text-fuel hover:underline">PayPal's terms</a>{" "}
            (for Donors).
          </p>
        </Section>

        <Section title="5. Donations">
          <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Refund Policy</h3>
          <p>
            Donations are generally non-refundable. Because funds may be paid out to Campaign Creators quickly (including via instant payout), refunds cannot be guaranteed once a donation is processed. If you believe a donation was made fraudulently using your payment method, contact us immediately at{" "}
            <a href="mailto:wtpjournalism@gmail.com" className="text-fuel hover:underline">wtpjournalism@gmail.com</a>.
          </p>
          <h3 className="text-base font-semibold text-foreground mt-4 mb-2">No Guarantee of Use</h3>
          <p>
            Give-A-Gallon does not guarantee that Campaign Creators will use donations for any specific purpose. While we encourage honest representation, the Platform is not responsible for how funds are ultimately spent.
          </p>
        </Section>

        <Section title="6. Campaign Creator Responsibilities">
          <ul>
            <li>You must accurately describe your cause, activities, and how funds will be used</li>
            <li>You must not create campaigns for illegal activities</li>
            <li>You must not impersonate another person or organization</li>
            <li>You are solely responsible for any tax obligations arising from funds received</li>
            <li>You must comply with all applicable federal, state, and local laws</li>
          </ul>
        </Section>

        <Section title="7. Prohibited Conduct">
          <p>You may not:</p>
          <ul>
            <li>Create fraudulent, misleading, or deceptive campaigns</li>
            <li>Use the Platform to launder money or fund illegal activities</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Attempt to circumvent Platform fees or payment processing</li>
            <li>Use bots, scripts, or automated tools to interact with the Platform without authorization</li>
            <li>Interfere with or disrupt Platform infrastructure</li>
            <li>Scrape or harvest user data</li>
          </ul>
        </Section>

        <Section title="8. Content and Intellectual Property">
          <p>
            <strong className="text-foreground">Your Content.</strong>{" "}
            You retain ownership of content you post (campaign descriptions, images, updates). By posting, you grant Give-A-Gallon a non-exclusive, royalty-free license to display, distribute, and promote your content on the Platform and related channels (social media, newsletters) for the purpose of operating the Platform.
          </p>
          <p>
            <strong className="text-foreground">Platform Content.</strong>{" "}
            The Give-A-Gallon name, logo, fuel gauge design, and website design are the property of We The People News. You may not use these without written permission.
          </p>
        </Section>

        <Section title="9. Removal and Suspension">
          <p>We reserve the right to remove any campaign or suspend any account that:</p>
          <ul>
            <li>Violates these Terms</li>
            <li>Contains fraudulent or misleading information</li>
            <li>Promotes illegal activity</li>
            <li>Is the subject of valid legal complaint</li>
          </ul>
          <p>
            We will make reasonable efforts to notify you before or at the time of removal, except where doing so would compromise an investigation or endanger others.
          </p>
        </Section>

        <Section title="10. Disclaimers">
          <p>
            <strong className="text-foreground">AS-IS BASIS.</strong>{" "}
            The Platform is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or secure.
          </p>
          <p>
            <strong className="text-foreground">NOT LEGAL OR FINANCIAL ADVICE.</strong>{" "}
            Nothing on the Platform constitutes legal, tax, or financial advice. Campaign Creators should consult qualified professionals regarding tax obligations on funds received.
          </p>
          <p>
            <strong className="text-foreground">THIRD-PARTY SERVICES.</strong>{" "}
            We rely on PayPal for payment processing and hosting infrastructure. We are not liable for disruptions, errors, or data breaches caused by third-party service providers.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Give-A-Gallon and We The People News shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to lost funds, lost data, or campaign disputes between Donors and Campaign Creators.
          </p>
          <p>
            Our total liability for any claim arising from these Terms or your use of the Platform shall not exceed the amount of Platform fees you have paid in the twelve (12) months preceding the claim.
          </p>
        </Section>

        <Section title="12. Indemnification">
          <p>
            You agree to indemnify and hold harmless Give-A-Gallon, We The People News, and their officers, directors, and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the Platform or violation of these Terms.
          </p>
        </Section>

        <Section title="13. Dispute Resolution">
          <p>
            <strong className="text-foreground">Governing Law.</strong>{" "}
            These Terms are governed by the laws of the State of Mississippi, without regard to conflict of law principles.
          </p>
          <p>
            <strong className="text-foreground">Informal Resolution First.</strong>{" "}
            Before filing any formal claim, you agree to contact us at{" "}
            <a href="mailto:wtpjournalism@gmail.com" className="text-fuel hover:underline">wtpjournalism@gmail.com</a>{" "}
            and attempt to resolve the dispute informally for at least 30 days.
          </p>
        </Section>

        <Section title="14. Modifications">
          <p>
            We may update these Terms from time to time. Material changes will be posted on this page with an updated effective date. If you continue to use the Platform after changes take effect, you accept the revised Terms.
          </p>
        </Section>

        <Section title="15. Severability">
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>Questions about these Terms:</p>
          <p>
            <strong className="text-foreground">We The People News</strong><br />
            Email:{" "}
            <a href="mailto:wtpjournalism@gmail.com" className="text-fuel hover:underline">wtpjournalism@gmail.com</a><br />
            Website:{" "}
            <a href="https://wtpnews.org" target="_blank" rel="noopener noreferrer" className="text-fuel hover:underline">wtpnews.org</a><br />
            Platform:{" "}
            <a href="https://www.giveagallon.org" className="text-fuel hover:underline">www.giveagallon.org</a>
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

export default TermsOfServicePage;
