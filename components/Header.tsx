"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ProfileMenu from "./ProfileMenu";
import { useAuth } from "@/lib/auth-client";

interface Suggestion {
  id: number;
  title: string;
  type: "movie" | "tv";
  genre: string;
  release_year: number;
  poster: string;
}

const NAV = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/browse?type=movie", label: "Movies", match: "/browse" },
  { href: "/browse?type=tv", label: "TV Shows", match: "/browse" },
  { href: "/my-list", label: "My List" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowSuggest(false);
  }, [pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggest(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) setMobileOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounced live suggestions from the real search API.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = (await res.json()) as { results: Suggestion[] };
          setSuggestions(data.results ?? []);
          setShowSuggest(true);
        }
      } catch {
        /* suggestions are best-effort */
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  function submitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    setShowSuggest(false);
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function suggestionBadge(type: string) {
    return type === "tv" ? "TV" : "Movie";
  }

  const isActive = (item: (typeof NAV)[number]) => {
    if (item.href === "/") return pathname === "/";
    if (item.match) return pathname === item.match && item.href === item.label.toLowerCase().replace(" ", "");
    return pathname === item.href;
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0a0c14]/95 shadow-lg backdrop-blur-xl" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="NebulaStream home">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#e50914] to-[#8b0209] text-sm font-brand font-extrabold text-white shadow-lg">
            N
          </span>
          <span className="font-brand text-lg font-extrabold tracking-tight text-white">
            NEBULA<span className="text-[#e50914]">STREAM</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              data-active={isActive(item)}
              className={`nav-link rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive(item) ? "text-white" : "text-dim hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <form onSubmit={submitSearch} className="flex items-center">
              <div
                className={`flex items-center overflow-hidden rounded-lg border transition-all duration-300 ${
                  searchOpen ? "w-52 border-white/30 bg-black/70 sm:w-64" : "w-9 border-transparent"
                }`}
              >
                <button
                  type="button"
                  aria-label="Toggle search"
                  onClick={() => {
                    setSearchOpen((o) => !o);
                    if (!searchOpen) {
                      window.setTimeout(() => searchRef.current?.querySelector("input")?.focus(), 60);
                    }
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center text-white/80 transition hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => q.trim().length >= 2 && setShowSuggest(true)}
                  placeholder="Titles, genres, people"
                  aria-label="Search titles"
                  className={`h-9 w-full bg-transparent pr-3 text-sm text-white outline-none transition ${
                    searchOpen ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                />
              </div>
            </form>

            {showSuggest && suggestions.length > 0 && (
              <div className="anim-scale-in absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#12151f]/97 shadow-2xl backdrop-blur-xl">
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/title/${s.id}`}
                    onClick={() => {
                      setShowSuggest(false);
                      setSearchOpen(false);
                      setQ("");
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/art?url=${encodeURIComponent(s.poster ?? "")}`}
                      alt=""
                      className="h-14 w-10 shrink-0 rounded object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{s.title}</span>
                      <span className="block text-xs text-dim">
                        {suggestionBadge(s.type)} · {s.genre} · {s.release_year}
                      </span>
                    </span>
                  </Link>
                ))}
                <button
                  onClick={() => submitSearch()}
                  className="w-full border-t border-white/10 px-3 py-2.5 text-left text-sm font-semibold text-[#e50914] transition hover:bg-white/5"
                >
                  See all results for “{q.trim()}” →
                </button>
              </div>
            )}
          </div>

          {!loading && user && (
            <Link
              href="/my-list"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-dim transition hover:text-white xl:block"
            >
              My List
            </Link>
          )}
          <ProfileMenu />

          {/* Mobile hamburger */}
          <div className="relative lg:hidden" ref={mobileRef}>
            <button
              aria-label="Menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                {mobileOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                )}
              </svg>
            </button>
            {mobileOpen && (
              <div className="anim-scale-in absolute right-0 top-[calc(100%+10px)] z-50 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#12151f]/97 shadow-2xl backdrop-blur-xl">
                <nav className="flex flex-col p-1.5 text-sm" aria-label="Mobile">
                  {[
                    ["/", "Home"],
                    ["/browse", "Browse All"],
                    ["/browse?type=movie", "Movies"],
                    ["/browse?type=tv", "TV Shows"],
                    ["/genres", "Genres"],
                    ["/my-list", "My List"],
                    ["/continue-watching", "Continue Watching"],
                    ["/history", "Watch History"],
                    ["/profile", "My Profile"],
                    ["/account", "Account Settings"],
                    ["/help", "Help & Support"],
                  ].map(([href, label]) => (
                    <Link
                      key={href + label}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2.5 font-semibold text-dim transition hover:bg-white/10 hover:text-white"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
