"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Please fill in both fields.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }
      window.dispatchEvent(new Event("nebula:auth-changed"));
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url(/api/art?url=https%3A%2F%2Fpicsum.photos%2Fseed%2Fnebula-auth%2F1600%2F900)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-[#0a0c14]/70 to-[#0a0c14]/40" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center px-4 py-20">
        <div className="anim-scale-in w-full rounded-2xl border border-white/10 bg-black/75 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="text-3xl font-semibold">Log In</h1>
          <p className="mt-1 text-sm text-dim">Welcome back — your queue is waiting.</p>

          {error && (
            <div role="alert" className="anim-rise mt-5 rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">
                Email or Username
              </label>
              <input
                id="identifier"
                className="input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" disabled={busy} className="btn btn-accent w-full !py-3">
              {busy ? "Logging in…" : "Log In"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="link-dim">Forgot password?</Link>
            <Link href="/signup" className="font-bold text-[#e50914] transition hover:text-[#ff3b30]">
              Create account
            </Link>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-dim">
            <span className="font-bold text-white">Demo accounts:</span> demo@nebula.test / demo1234 · scifi@nebula.test /
            scifi1234
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
