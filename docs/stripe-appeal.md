# Stripe Account Review — Appeal / Response

> Fill in the bracketed `[...]` fields before sending. Send as a reply to
> Stripe's notice email **and** open a case at https://support.stripe.com
> (Account → "I have a question about an account review/closure"). Keep it
> factual and calm — you are giving them the evidence they need to reverse a
> precautionary fraud hold.

---

## Email to Stripe

**Subject:** Account review response — Give-A-Gallon ([your Stripe account ID, acct_...])

Hello Stripe Risk Team,

I'm writing in response to your notice that payments on the Give-A-Gallon
account have been flagged as potentially unauthorized and that payment
acceptance has been disabled with refunds scheduled to begin June 28, 2026.

I want to give you the full context and the documentation to show these are
legitimate, customer-initiated donations.

**What Give-A-Gallon is.** Give-A-Gallon (www.giveagallon.org) is a
crowdfunding/donation platform operated under the We The People News network.
Supporters voluntarily donate to activists, journalists, and independent
creators in units we call "gallons of fuel" ($4.25 each). It is a brand-new
platform, so our processing volume started from zero and ramped up quickly as
we launched — which I understand can resemble a risk pattern, but every charge
corresponds to a real, consenting donor.

**Why these charges are authorized.** For each donation we capture, at the time
of payment:
- The donor's name and email address (and, for most, a logged-in account on our
  platform).
- The specific creator/campaign the donor chose to fund.
- In many cases, a personal message the donor wrote to the creator.
- A confirmation email sent to the donor at checkout.

I have attached a full export of completed donations (see below) including the
Stripe Payment Intent ID for every charge, so you can match each one against
your dashboard.

**What I'm asking.**
1. Please re-review the account with this context before issuing refunds, as
   reversing legitimate donations will harm the creators these funds were
   raised for.
2. If the account cannot be reinstated, please tell me exactly what
   documentation you need (business registration, identity verification, donor
   confirmations, our terms of service, etc.) and I will provide it promptly.
3. Please confirm the status of the current balance and any reserve, and the
   timeline for releasing funds that correspond to undisputed donations.

I'm happy to provide anything else that helps — business details, our refund
and donation policies, website/terms links, or direct donor confirmations.

Thank you for taking a second look.

[Your full name]
[Your title, e.g. Founder]
Give-A-Gallon / We The People News
[Phone] · [Email] · https://www.giveagallon.org

---

## Evidence to attach

Run the new admin export to generate the donation evidence file, then attach
it to the email (CSV that Stripe can open in a spreadsheet):

1. Log into the site as the admin account.
2. The admin query `admin.exportDonationEvidence` returns a `summary` block and
   a `rows` array (date, donor name, donor email, has-account flag, gallons,
   amount, the creator funded, the donor's message, and the Stripe Payment
   Intent ID for each charge).
3. Export those rows to CSV (or use the `scripts/export-donations.ts` helper —
   see `docs/payments-contingency.md`).

The `summary` figures (total donations, unique donor emails, how many came from
logged-in users, how many included a personal message) are the strongest
top-line proof that these are real supporters, not card testing.

## Do / Don't while under review

- **Do** keep enough balance to cover the scheduled refunds so the account
  doesn't go negative (a negative balance can go to collections).
- **Do** respond quickly and provide whatever they ask for.
- **Don't** open a second Stripe account to keep processing — Stripe links
  accounts by EIN, bank, device, and identity, and this deepens the risk flag.
- **Don't** withdraw remaining funds in the hope of keeping them; that can
  trigger a negative balance and collections.
