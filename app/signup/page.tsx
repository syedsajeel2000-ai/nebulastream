"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username.trim()))
      e.username = "3–30 characters; letters, numbers and underscores only.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Please enter a valid email address.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setGlobalError(data.error ?? "Sign up failed. Please try again.");
        return;
      }
      window.dispatchEvent(new Event("nebula:auth-changed"));
      router.push("/");
      router.refresh();
    } catch {
      setGlobalError("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof typeof form, label: string, type = "text", autoComplete?: string, placeholder?: string) => (
    <div>
      <label htmlFor={k} className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">
        {label}
      </label>
      <input
        id={k}
        type={type}
        className="input"
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
      {errors[k] && <p className="mt-1 text-xs font-semibold text-red-300">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url(/api/art?url=https%3A%2F%2Fpicsum.photos%2Fseed%2Fnebula-signup%2F1600%2F900)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-[#0a0c14]/70 to-[#0a0c14]/40" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center px-4 py-20">
        <div className="anim-scale-in w-full rounded-2xl border border-white/10 bg-black/75 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="text-3xl font-semibold">Create Account</h1>
          <p className="mt-1 text-sm text-dim">Join NebulaStream — free, instant, demo-licious.</p>

          {globalError && (
            <div role="alert" className="anim-rise mt-5 rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
              {globalError}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {field("fullName", "Full Name", "text", "name", "Ada Lovelace")}
            {field("username", "Username", "text", "username", "ada_lovelace")}
            {field("email", "Email", "email", "email", "ada@example.com")}
            {field("password", "Password (min 8 characters)", "password", "new-password", "••••••••")}
            {field("confirmPassword", "Confirm Password", "password", "new-password", "••••••••")}
            <button type="submit" disabled={busy} className="btn btn-accent w-full !py-3">
              {busy ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-dim">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#e50914] transition hover:text-[#ff3b30]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
