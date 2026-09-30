"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth-client";
import { useToast } from "./Toast";
import { HoverButton } from "./motion";

interface Props {
  contentId: number;
  title: string;
  initialInList: boolean;
  initialLiked: boolean;
}

export default function TitleActions({ contentId, title, initialInList, initialLiked }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [inList, setInList] = useState(initialInList);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();

  async function requireLogin(): Promise<boolean> {
    if (user) return true;
    toast("Log in to save titles and likes.", "info");
    router.push("/login");
    return false;
  }

  async function toggleList() {
    if (!(await requireLogin()) || busy) return;
    setBusy(true);
    const next = !inList;
    try {
      const res = await fetch("/api/watchlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not update your list.");
      }
      setInList(next);
      toast(next ? `Added “${title}” to My List` : `Removed “${title}” from My List`, next ? "success" : "info");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleLike() {
    if (!(await requireLogin()) || busy) return;
    setBusy(true);
    const next = !liked;
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not save your like.");
      }
      setLiked(next);
      toast(next ? `Liked “${title}”` : `Like removed`, next ? "success" : "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/title/${contentId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* user cancelled — fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard.", "success");
    } catch {
      toast(url, "info");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <HoverLinkPlay contentId={contentId} />
      <HoverButton onClick={toggleList} disabled={busy} className={`btn !py-3 ${inList ? "btn-accent" : "btn-ghost"}`}>
        {inList ? "✓ In My List" : "＋ My List"}
      </HoverButton>
      <HoverButton
        onClick={toggleLike}
        disabled={busy}
        aria-pressed={liked}
        className={`btn !py-3 ${liked ? "btn-accent" : "btn-ghost"}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={liked ? "liked" : "unliked"}
            aria-hidden
            initial={reduce ? false : { scale: 0.4, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="inline-block"
          >
            {liked ? "👍" : "🤍"}
          </motion.span>
        </AnimatePresence>
        {liked ? "Liked" : "Like"}
      </HoverButton>
      <HoverButton onClick={share} className="btn btn-ghost !py-3">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="18" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="6" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="18" cy="19" r="2.6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.4 10.7l7.2-4.2M8.4 13.3l7.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Share
      </HoverButton>
    </div>
  );
}

/** Play link with the same magnetic hover as the hero. */
function HoverLinkPlay({ contentId }: { contentId: number }) {
  return (
    <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}>
      <Link href={`/watch/${contentId}`} className="btn btn-light !px-7 !py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13l11-6.5-11-6.5z" />
        </svg>
        Play
      </Link>
    </motion.div>
  );
}
