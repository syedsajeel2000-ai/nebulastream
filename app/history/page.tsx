import Link from "next/link";
import type { Metadata } from "next";
import { getWatchHistory, type HistoryEntry } from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import HistoryGrid from "@/components/HistoryGrid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Watch History" };

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Empty
        title="No watch history yet."
        body="Log in to keep a record of everything you watch on NebulaStream."
        cta="Log In"
        href="/login"
      />
    );
  }

  const profile = await getActiveProfile(user.id);
  const entries: HistoryEntry[] = getWatchHistory(profile.id, 200);

  if (entries.length === 0) {
    return (
      <Empty
        title="No watch history yet."
        body="Everything you watch will be tracked here so you can always find it again."
        cta="Start Watching"
        href="/browse"
      />
    );
  }

  return (
    <div className="anim-fade-in mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#e50914]">{profile.avatar} {profile.profile_name}</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Watch History</h1>
        <p className="mt-1 text-sm text-dim">{entries.length} entr{entries.length === 1 ? "y" : "ies"} · newest first</p>
      </header>
      <HistoryGrid entries={entries} />
    </div>
  );
}

function Empty({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <div className="anim-fade-in mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <div className="mb-5 grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/5 text-3xl text-dim">🕘</div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-dim">{body}</p>
      <Link href={href} className="btn btn-accent mt-6">{cta}</Link>
    </div>
  );
}
