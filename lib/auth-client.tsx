"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface ClientUser {
  id: number;
  fullName: string;
  username: string;
  email: string;
}

interface ProfileDto {
  id: number;
  profile_name: string;
  avatar: string;
  kids_mode: number;
}

interface AuthCtx {
  user: ClientUser | null;
  profiles: ProfileDto[];
  activeProfile: ProfileDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  selectProfile: (id: number) => Promise<void>;
  api: (path: string, init?: RequestInit) => Promise<Response>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [profiles, setProfiles] = useState<ProfileDto[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const api = useCallback((path: string, init?: RequestInit) => fetch(path, init), []);

  const refresh = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const me = (await meRes.json()) as { user: ClientUser | null };
      setUser(me.user ?? null);
      if (me.user) {
        const profilesRes = await fetch("/api/profiles", { cache: "no-store" });
        if (profilesRes.ok) {
          const data = (await profilesRes.json()) as { profiles: ProfileDto[] };
          setProfiles(data.profiles ?? []);
          const stored = Number.parseInt(document.cookie.match(/nebula_profile=(\d+)/)?.[1] ?? "", 10);
          setActiveId(
            data.profiles?.some((p) => p.id === stored) ? stored : (data.profiles?.[0]?.id ?? null)
          );
        } else {
          setProfiles([]);
          setActiveId(null);
        }
      } else {
        setProfiles([]);
        setActiveId(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Login/signup pages dispatch this so the header updates without a reload.
    window.addEventListener("nebula:auth-changed", refresh as EventListener);
    return () => window.removeEventListener("nebula:auth-changed", refresh as EventListener);
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProfiles([]);
    setActiveId(null);
    window.location.href = "/";
  }, []);

  const selectProfile = useCallback(async (id: number) => {
    document.cookie = `nebula_profile=${id}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    setActiveId(id);
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null,
    [profiles, activeId]
  );

  return (
    <Ctx.Provider value={{ user, profiles, activeProfile, loading, refresh, logout, selectProfile, api }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
