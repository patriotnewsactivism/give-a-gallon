import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Mode = "signin" | "reset-request" | "reset-verify";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");

  // Step 1 of reset: request an OTP code by email.
  if (mode === "reset-request") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <form
            onSubmit={async e => {
              e.preventDefault();
              setError("");
              setLoading(true);
              const formData = new FormData(e.currentTarget);
              formData.set("flow", "reset");
              const submittedEmail = String(formData.get("email") ?? "");
              try {
                await signIn("password", formData);
                setEmail(submittedEmail);
                setMode("reset-verify");
              } catch (err: any) {
                setError(
                  err?.message ??
                    "Could not start password reset. Please try again.",
                );
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a code to reset your password.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Sending code…
                </>
              ) : (
                "Send reset code"
              )}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
            >
              Back to sign in
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Step 2 of reset: verify the code and set a new password.
  if (mode === "reset-verify") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <form
            onSubmit={async e => {
              e.preventDefault();
              setError("");
              setLoading(true);
              const formData = new FormData(e.currentTarget);
              formData.set("flow", "reset-verification");
              formData.set("email", email);
              try {
                await signIn("password", formData);
              } catch {
                setError("Invalid code or password. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-code">Verification code</Label>
              <Input
                id="reset-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="newPassword"
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
                  <Loader2 className="mr-2 size-4 animate-spin" /> Resetting…
                </>
              ) : (
                "Reset password"
              )}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode("reset-request");
                setError("");
              }}
            >
              Didn't get a code? Try again
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
            formData.set("flow", "signIn");
            try {
              await signIn("password", formData);
            } catch (err: any) {
              setError(err?.message ?? "Invalid email or password.");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMode("reset-request");
                  setError("");
                }}
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
