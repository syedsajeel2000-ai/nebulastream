"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { useAuth } from "@/lib/auth-client";

interface Props {
  user: { fullName: string; username: string; email: string };
  memberSince: string;
}

export default function AccountForms({ user, memberSince }: Props) {
  const router = useRouter();
  const { refresh } = useAuth();
  const { toast } = useToast();

  const [info, setInfo] = useState(user);
  const [infoBusy, setInfoBusy] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast(data.error ?? "Could not save your changes.", "error");
        return;
      }
      toast("Account details updated.", "success");
      await refresh();
      router.refresh();
    } finally {
      setInfoBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) {
      toast("New password must be at least 8 characters.", "error");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast("New passwords do not match.", "error");
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast(data.error ?? "Could not change your password.", "error");
        return;
      }
      setPw({ current: "", next: "", confirm: "" });
      toast("Password changed. Other sessions were signed out.", "success");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="card-surface p-6">
        <h2 className="section-title mb-1">Profile Information</h2>
        <p className="mb-5 text-xs text-dim">Member since {new Date(memberSince.replace(" ", "T") + "Z").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
        <form onSubmit={saveInfo} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">Full Name</label>
            <input id="fullName" className="input" value={info.fullName} onChange={(e) => setInfo({ ...info, fullName: e.target.value })} required minLength={2} />
          </div>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">Username</label>
            <input id="username" className="input" value={info.username} onChange={(e) => setInfo({ ...info, username: e.target.value })} required minLength={3} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">Email</label>
            <input id="email" type="email" className="input" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={infoBusy} className="btn btn-accent">
              {infoBusy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="card-surface p-6">
        <h2 className="section-title mb-1">Change Password</h2>
        <p className="mb-5 text-xs text-dim">Changing your password signs out all other sessions.</p>
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="current" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">Current Password</label>
            <input id="current" type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="next" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">New Password</label>
            <input id="next" type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={8} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">Confirm New Password</label>
            <input id="confirm" type="password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required minLength={8} autoComplete="new-password" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pwBusy} className="btn btn-accent">
              {pwBusy ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
