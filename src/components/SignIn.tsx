import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Mode = "signin" | "reset" | "recovery";

export function SignIn() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("reset") === "1" ? "recovery" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("reset") === "1") setMode("recovery");
  }, [searchParams]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login?reset=1`,
        });
        if (error) throw error;
        setNotice("Password reset link sent. Check your email.");
        return;
      }
      if (mode === "recovery") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setNotice("Password updated. You can continue to your dashboard.");
        setMode("signin");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message ?? "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          {mode !== "recovery" && (
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
          )}
          {mode !== "reset" && (
            <div className="space-y-2">
              <Label htmlFor="signin-password">{mode === "recovery" ? "New password" : "Password"}</Label>
              <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "recovery" ? "new-password" : "current-password"} />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-green-500">{notice}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "reset" ? "Send reset link" : mode === "recovery" ? "Set new password" : "Sign in"}
          </Button>
          {mode === "signin" ? (
            <button type="button" className="w-full text-center text-xs text-muted-foreground hover:text-foreground" onClick={() => setMode("reset")}>
              Forgot password?
            </button>
          ) : mode === "reset" ? (
            <button type="button" className="w-full text-center text-xs text-muted-foreground hover:text-foreground" onClick={() => setMode("signin")}>
              Back to sign in
            </button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
