import Link from "next/link";
import type { Metadata } from "next";
import { getContinueWatching, getWatchlist, type HistoryEntry } from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import ContinueGrid from "@/components/ContinueGrid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Continue Watching" };

export default async function ContinueWatchingPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Empty
        title="No unfinished titles."
        body="Log in to pick up exactly where you left off — we'll remember your spot."
        cta="Log In"
        href="/login"
      />
    );
  }

  const profile = await getActiveProfile(user.id);
  const entries: HistoryEntry[] = getContinueWatching(profile.id, 60);

  if (entries.length === 0) {
    return (
      <Empty
        title="No unfinished titles."
        body="Start watching something and it will show up here, right down to the second."
        cta="Start Watching"
        href="/browse"
      />
    );
  }

  const inListSet = new Set(getWatchlist(profile.id).map((c) => c.id));

  return (
    <div className="anim-fade-in mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#e50914]">{profile.avatar} {profile.profile_name}</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Continue Watching</h1>
        <p className="mt-1 text-sm text-dim">Pick up right where you left off.</p>
      </header>
      <ContinueGrid entries={entries} inListSet={inListSet} />
    </div>
  );
}

function Empty({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <div className="anim-fade-in mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <div className="mb-5 grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/5 text-3xl text-dim">▶</div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-dim">{body}</p>
      <Link href={href} className="btn btn-accent mt-6">{cta}</Link>
    </div>
  );
}
