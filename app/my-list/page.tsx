import Link from "next/link";
import type { Metadata } from "next";
import { getWatchlist } from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import ListGrid from "@/components/ListGrid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My List" };

export default async function MyListPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        icon="＋"
        title="Your list is empty."
        body="Log in to save movies and shows you want to watch later."
        cta="Log In"
        href="/login"
      />
    );
  }

  const profile = await getActiveProfile(user.id);
  const items = getWatchlist(profile.id);

  if (items.length === 0) {
    return (
      <EmptyState
        icon="＋"
        title="Your list is empty."
        body="Save movies and shows to watch them later — they'll stay here across sessions."
        cta="Browse Movies"
        href="/browse"
      />
    );
  }

  return (
    <div className="anim-fade-in mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#e50914]">{profile.avatar} {profile.profile_name}</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">My List</h1>
        <p className="mt-1 text-sm text-dim">{items.length} title{items.length === 1 ? "" : "s"} saved</p>
      </header>
      <ListGrid items={items} inListIds={new Set(items.map((i) => i.id))} showRemove />
    </div>
  );
}

function EmptyState({ icon, title, body, cta, href }: { icon: string; title: string; body: string; cta: string; href: string }) {
  return (
    <div className="anim-fade-in mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <div className="mb-5 grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/5 text-3xl text-dim">
        {icon}
      </div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-dim">{body}</p>
      <Link href={href} className="btn btn-accent mt-6">
        {cta}
      </Link>
    </div>
  );
}
