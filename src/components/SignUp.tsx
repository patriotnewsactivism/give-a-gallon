import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function SignUp() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // "form" collects credentials; "verify" collects the emailed OTP code.
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");

  if (step === "verify") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <form
            onSubmit={async e => {
              e.preventDefault();
              setError("");
              setLoading(true);
              const formData = new FormData(e.currentTarget);
              formData.set("flow", "email-verification");
              formData.set("email", email);
              try {
                await signIn("password", formData);
              } catch {
                setError("Invalid or expired code. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Enter it below to verify your email.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Verifying…
                </>
              ) : (
                "Verify email"
              )}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStep("form");
                setError("");
              }}
            >
              Use a different email
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardContent className="pt-6">
        <form
          onSubmit={async e => {
            e.preventDefault();
            setError("");
            setLoading(true);
            const formData = new FormData(e.currentTarget);
            formData.set("flow", "signUp");
            const submittedEmail = String(formData.get("email") ?? "");
            try {
              const result = await signIn("password", formData);
              // When email verification is enabled, the server sends an OTP and
              // does not sign the user in yet — advance to the code step.
              if (!result.signingIn) {
                setEmail(submittedEmail);
                setStep("verify");
              }
            } catch (err: any) {
              setError(
                err?.message ?? "Could not create account. Please try again.",
              );
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Creating
                account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
