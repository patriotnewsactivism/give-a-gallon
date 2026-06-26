import { useMutation } from "convex/react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";

const CATEGORIES = [
  { id: "donation", label: "Donations & receipts" },
  { id: "creator", label: "Running a campaign" },
  { id: "payout", label: "Payouts & PayPal" },
  { id: "account", label: "Account & login" },
  { id: "other", label: "Something else" },
];

const FAQS = [
  {
    q: "How much is a gallon, and where does my money go?",
    a: "One gallon of fuel is $4.25. After a 5% platform fee and ~3% PayPal processing, 92% goes directly to the creator.",
  },
  {
    q: "Can I get a refund?",
    a: "Donations are generally non-refundable because funds can pay out to creators quickly. If you believe a charge was unauthorized, contact us right away and we'll investigate.",
  },
  {
    q: "When do creators get paid?",
    a: "Payouts go through PayPal. Standard payouts take 1–2 business days (free); instant payouts use PayPal's standard processing fee. New accounts may have a brief verification period. Give-A-Gallon never adds fees beyond what PayPal charges.",
  },
  {
    q: "Are donations tax-deductible?",
    a: "Only if the creator is a registered 501(c)(3) — most are not. Your contribution is a voluntary gift.",
  },
  {
    q: "What shows up on my bank statement?",
    a: "Charges appear as “GIVEAGALLON.”",
  },
];

export function SupportPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const submit = useMutation(api.support.submitTicket);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "donation",
    subject: "",
    message: "",
  });

  const update = (k: keyof typeof form, val: string) =>
    setForm(f => ({ ...f, [k]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submit(form);
      setDone(true);
      toast.success("Message sent — check your inbox shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container max-w-3xl py-16 px-4 sm:px-6">
        <h1
          className="text-4xl sm:text-5xl font-black uppercase tracking-tight mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          How can we <span className="text-fuel">help?</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-12 max-w-xl">
          Reach our support team any time. Most messages get an answer within
          minutes — email us directly at{" "}
          <a
            href="mailto:support@giveagallon.org"
            className="text-fuel hover:underline"
          >
            support@giveagallon.org
          </a>{" "}
          or use the form below.
        </p>

        {/* FAQ */}
        <section className="mb-14">
          <h2
            className="text-lg font-bold uppercase text-fuel tracking-wide mb-5 flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <MessageSquare className="size-4" /> Common questions
          </h2>
          <div className="space-y-5">
            {FAQS.map(f => (
              <div
                key={f.q}
                className="border-l-[3px] border-fuel/40 pl-4 py-1"
              >
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {f.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section className="rounded-2xl border border-border/40 bg-card/40 p-6 sm:p-8">
          <h2
            className="text-lg font-bold uppercase text-fuel tracking-wide mb-1 flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Mail className="size-4" /> Contact support
          </h2>

          {done ? (
            <div className="py-8 text-center">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-fuel/15 text-fuel mb-4">
                <Send className="size-5" />
              </div>
              <p className="text-foreground font-semibold mb-1">
                Thanks — your message is on its way.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                We've emailed a reply to{" "}
                <span className="text-foreground">{form.email}</span>. Check
                your inbox (and spam folder) shortly.
              </p>
              <Link to="/" className="text-sm text-fuel hover:underline">
                ← Back to Give-A-Gallon
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 mt-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Your name
                  </label>
                  <Input
                    value={form.name}
                    onChange={e => update("name", e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Email <span className="text-fuel">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => update("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Topic
                </label>
                <select
                  value={form.category}
                  onChange={e => update("category", e.target.value)}
                  className="w-full h-10 rounded-md border border-border/60 bg-background px-3 text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Subject
                </label>
                <Input
                  value={form.subject}
                  onChange={e => update("subject", e.target.value)}
                  placeholder="Brief summary"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Message <span className="text-fuel">*</span>
                </label>
                <Textarea
                  required
                  value={form.message}
                  onChange={e => update("message", e.target.value)}
                  placeholder="Tell us what's going on…"
                  rows={6}
                  maxLength={4000}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-fuel hover:bg-fuel/90 text-fuel-foreground font-semibold"
              >
                {submitting ? "Sending…" : "Send message"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                We'll reply to your email. By submitting you agree to our{" "}
                <Link
                  to="/privacy-policy"
                  className="text-fuel hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default SupportPage;
