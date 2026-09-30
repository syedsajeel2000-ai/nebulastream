"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-client";

export default function ProfileMenu() {
  const { user, profiles, activeProfile, selectProfile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn btn-ghost !px-4 !py-1.5 text-sm">
          Log In
        </Link>
        <Link href="/signup" className="btn btn-accent !px-4 !py-1.5 text-sm">
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-2 transition hover:bg-white/10"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#e50914] to-[#7a0509] text-base">
          {activeProfile?.avatar ?? "🚀"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="anim-scale-in absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#12151f]/95 shadow-2xl backdrop-blur-xl"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-bold">{user.fullName}</p>
            <p className="truncate text-xs text-dim">@{user.username}</p>
          </div>

          {profiles.length > 1 && (
            <div className="border-b border-white/10 px-3 py-2">
              <p className="px-1 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-dim">Profiles</p>
              <div className="flex flex-wrap gap-1.5 py-1">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={async () => {
                      await selectProfile(p.id);
                      setOpen(false);
                      router.refresh();
                    }}
                    title={p.profile_name}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base transition ${
                      activeProfile?.id === p.id
                        ? "border-[#e50914] bg-[#e50914]/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {p.avatar}
                  </button>
                ))}
              </div>
            </div>
          )}

          <nav className="flex flex-col p-1.5 text-sm">
            {[
              ["/profile", "👤", "My Profile"],
              ["/my-list", "＋", "My List"],
              ["/continue-watching", "▶", "Continue Watching"],
              ["/history", "🕘", "Watch History"],
              ["/account", "⚙", "Account Settings"],
            ].map(([href, icon, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white/10"
              >
                <span aria-hidden className="w-4 text-center text-xs">{icon}</span>
                {label}
              </Link>
            ))}
            <button
              onClick={async () => {
                setOpen(false);
                await logout();
              }}
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-red-300 transition hover:bg-red-500/15"
            >
              <span aria-hidden className="w-4 text-center text-xs">⏻</span>
              Logout
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
