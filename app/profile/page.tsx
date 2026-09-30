import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { getActiveProfile } from "@/lib/profile";
import { getProfilesForUser } from "@/lib/users";
import { db } from "@/lib/db";
import ProfileEditor from "@/components/ProfileEditor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const profiles = getProfilesForUser(user.id);
  const active = await getActiveProfile(user.id);

  const stats = {
    watched: db
      .prepare<[number], { n: number }>("SELECT COUNT(DISTINCT content_id) n FROM watch_history WHERE profile_id = ?")
      .get(active.id)!.n,
    completed: db
      .prepare<[number], { n: number }>("SELECT COUNT(*) n FROM watch_history WHERE profile_id = ? AND completed = 1")
      .get(active.id)!.n,
    listCount: db.prepare<[number], { n: number }>("SELECT COUNT(*) n FROM watchlist WHERE profile_id = ?").get(active.id)!.n,
    likes: db.prepare<[number], { n: number }>("SELECT COUNT(*) n FROM likes WHERE profile_id = ?").get(active.id)!.n,
  };

  const topGenre = db
    .prepare<[number], { genre: string; n: number }>(
      `SELECT c.genre, COUNT(*) n FROM watch_history h JOIN content c ON c.id = h.content_id
       WHERE h.profile_id = ? GROUP BY c.genre ORDER BY n DESC LIMIT 1`
    )
    .get(active.id);

  return (
    <div className="anim-fade-in mx-auto max-w-[1100px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-[#e50914] to-[#5f0409] text-4xl shadow-2xl">
          {active.avatar}
        </div>
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{user.fullName}</h1>
          <p className="text-sm text-dim">
            @{user.username} · {user.email} · member since{" "}
            {new Date(user.createdAt.replace(" ", "T") + "Z").toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/account" className="btn btn-outline sm:ml-auto">
          Account Settings
        </Link>
      </header>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Titles Started", stats.watched],
          ["Completed", stats.completed],
          ["In My List", stats.listCount],
          ["Likes", stats.likes],
        ].map(([label, value]) => (
          <div key={label as string} className="card-surface p-4 text-center">
            <p className="text-2xl font-semibold text-[#e50914]">{value as number}</p>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-dim">{label as string}</p>
          </div>
        ))}
      </div>

      {topGenre && (
        <div className="card-surface mb-10 flex items-center gap-4 p-5">
          <span className="text-3xl">🍿</span>
          <div>
            <p className="text-sm font-bold">Your most-watched genre: {topGenre.genre}</p>
            <p className="text-xs text-dim">Based on your watch history — recommendations lean into it automatically.</p>
          </div>
        </div>
      )}

      {/* Profiles manager */}
      <section>
        <h2 className="section-title mb-4">Profiles on this account</h2>
        <p className="mb-4 text-sm text-dim">
          Each profile keeps its own watch history, progress, list, likes and recommendations.
        </p>
        <ProfileEditor profiles={profiles} activeId={active.id} />
      </section>
    </div>
  );
}
