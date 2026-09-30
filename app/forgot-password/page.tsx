"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset?action=request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { token?: string; message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setToken(data.token ?? "");
      setNotice(
        data.token
          ? "DEMO RESET FLOW — no email provider is configured in this demo, so your single-use reset token is shown below. It expires in 30 minutes."
          : data.message ?? null
      );
      setStep("confirm");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset?action=confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Reset failed. The token may have expired — request a new one.");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url(/api/art?url=https%3A%2F%2Fpicsum.photos%2Fseed%2Fnebula-forgot%2F1600%2F900)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-[#0a0c14]/70 to-[#0a0c14]/40" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center px-4 py-20">
        <div className="anim-scale-in w-full rounded-2xl border border-white/10 bg-black/75 p-8 shadow-2xl backdrop-blur-xl">
          {step === "request" && (
            <>
              <h1 className="text-3xl font-semibold">Forgot Password</h1>
              <p className="mt-1 text-sm text-dim">Enter your account email and we'll generate a reset token.</p>
              <form onSubmit={requestReset} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">
                    Account Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button type="submit" disabled={busy} className="btn btn-accent w-full !py-3">
                  {busy ? "Generating…" : "Generate Reset Token"}
                </button>
              </form>
            </>
          )}

          {step === "confirm" && (
            <>
              <h1 className="text-3xl font-semibold">Choose a New Password</h1>
              {notice && (
                <div className="mt-4 rounded-lg border border-[#f5c518]/40 bg-[#f5c518]/10 px-4 py-3 text-xs font-semibold leading-relaxed text-[#f5c518]">
                  ⚠ {notice}
                </div>
              )}
              {token && (
                <div className="mt-3 rounded-lg border border-white/15 bg-white/5 p-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-dim">Your demo reset token</p>
                  <code className="mt-1 block break-all text-xs text-emerald-300 select-all">{token}</code>
                </div>
              )}
              <form onSubmit={confirmReset} className="mt-5 space-y-4">
                <input
                  className="input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Reset token (pre-filled)"
                  required
                  aria-label="Reset token"
                />
                <div>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password (min 8 characters)"
                    required
                    aria-label="New password"
                  />
                </div>
                <input
                  type="password"
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  aria-label="Confirm new password"
                />
                <button type="submit" disabled={busy} className="btn btn-accent w-full !py-3">
                  {busy ? "Resetting…" : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 text-3xl">✅</div>
              <h1 className="text-2xl font-semibold">Password Updated</h1>
              <p className="mt-2 text-sm text-dim">Your password has been changed. All other sessions were signed out.</p>
              <button onClick={() => router.push("/login")} className="btn btn-accent mt-6 w-full">
                Go to Log In
              </button>
            </div>
          )}

          {error && (
            <div role="alert" className="anim-rise mt-5 rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="link-dim">← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
