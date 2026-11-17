import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Glass, Button, Notice, Logo, btnClass, inputClass } from "@/components/ui-kit";
import { completePasswordReset, friendlyAuthError, verifyResetCode } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({
    oobCode: typeof s["oobCode"] === "string" ? s["oobCode"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Set a new password — Futuroute" },
      { name: "description", content: "Choose a new password for your Futuroute account." },
      { property: "og:title", content: "Set a new password — Futuroute" },
      { property: "og:description", content: "Reset your Futuroute password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const { oobCode } = Route.useSearch();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(Boolean(oobCode));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setChecking(false);
      return;
    }
    verifyResetCode(oobCode)
      .then((em) => setEmail(em))
      .catch((x) => setErr(friendlyAuthError(x)))
      .finally(() => setChecking(false));
  }, [oobCode]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!oobCode)
      return setErr("Missing reset code. Request a new password reset link from Sign in.");
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords don't match.");
    setBusy(true);
    try {
      await completePasswordReset(oobCode, pw);
      toast.success("Password updated — please sign in with your new password.");
      nav({ to: "/auth" });
    } catch (x) {
      setErr(friendlyAuthError(x));
    } finally {
      setBusy(false);
    }
  }

  const cls = inputClass();
  return (
    <div className="ambient grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <Glass>
          <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
          {checking ? (
            <p className="mt-3 text-sm text-text-2">Verifying reset link…</p>
          ) : !oobCode ? (
            <div className="mt-4 space-y-4">
              <Notice tone="warn">
                No reset code found in this link. Request a new password reset email from the
                sign-in page.
              </Notice>
              <Link to="/auth" className={btnClass("primary", "w-full")}>
                Go to Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 grid gap-3">
              {email && (
                <p className="text-sm text-text-2">
                  Resetting password for{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              )}
              <label className="grid gap-1 text-sm">
                New password
                <input
                  type="password"
                  className={cls}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Confirm password
                <input
                  type="password"
                  className={cls}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              {err && <Notice tone="warn">{err}</Notice>}
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Update password"}
              </Button>
            </form>
          )}
        </Glass>
      </div>
    </div>
  );
}
