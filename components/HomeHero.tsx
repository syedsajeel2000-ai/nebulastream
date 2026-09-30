"use client";

/**
 * Cinematic 3D hero (framer-motion):
 *  - Backdrop zooms 1.12 → 1 while fading in, with scroll parallax
 *  - Whole hero tilts in 3D toward the cursor (subtle, spring-smoothed)
 *  - Content staggers in: badges → title → meta → description → actions
 *  - Play button gets an extra magnetic pop
 * All motion is disabled under prefers-reduced-motion.
 */
import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useRef } from "react";
import { fmtDuration } from "@/lib/format";
import type { ContentItem } from "@/lib/types";

interface Props {
  item: ContentItem | null;
  progress?: { position: number; duration: number; completed: boolean };
}

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const itemV: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function HomeHero({ item, progress }: Props) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // 3D cursor tilt (spring-smoothed)
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(30);
  const glare = useMotionTemplate`radial-gradient(ellipse at ${gx}% ${gy}%, rgba(255,255,255,0.10), transparent 60%)`;

  // Scroll-linked exit: hero content drifts up & fades as you scroll away
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 3.2);
    rx.set(-py * 2.4);
    gx.set((px + 0.5) * 100);
    gy.set((py + 0.5) * 100);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(30);
  }

  if (!item) {
    return (
      <section className="relative h-[62vh] min-h-[420px] w-full overflow-hidden">
        <div className="skeleton absolute inset-0 rounded-none" />
      </section>
    );
  }

  const pct = progress && progress.duration > 0 ? Math.min(100, Math.round((progress.position / progress.duration) * 100)) : 0;

  return (
    <motion.section
      ref={sectionRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative h-[78vh] min-h-[520px] w-full overflow-hidden"
      style={reduce ? undefined : { perspective: 1200 }}
      aria-label="Featured"
    >
      {/* Backdrop with entrance zoom + scroll parallax */}
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y: bgY }}>
        <motion.div
          className="h-full w-full"
          initial={reduce ? false : { scale: 1.12, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/art?url=${encodeURIComponent(item.backdrop)}`}
            alt=""
            className="h-full w-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-[#0a0c14]/55 to-[#0a0c14]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c14]/85 via-[#0a0c14]/30 to-transparent" />
      </motion.div>

      {/* 3D tilt wrapper around the content plane */}
      <motion.div
        className="relative z-10 h-full"
        style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="relative z-10 mx-auto flex h-full max-w-[1500px] items-end px-4 pb-16 sm:items-center sm:px-6 lg:px-10"
          style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        >
          <motion.div className="max-w-2xl" variants={reduce ? undefined : container} initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"}>
            <motion.div className="mb-3 flex items-center gap-2" variants={itemV}>
              <span className="badge badge-accent">{item.type === "tv" ? "Series" : "Film"}</span>
              <span className="badge badge-gold">Featured</span>
            </motion.div>

            <motion.h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl" variants={itemV}>
              {item.title}
            </motion.h1>

            <motion.div
              className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-white/85"
              variants={itemV}
            >
              <span className="font-bold text-[#f5c518]">★ {item.rating.toFixed(1)}</span>
              <span>{item.release_year}</span>
              <span className="rounded border border-white/25 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider">{item.license ?? "Public Domain"}</span>
              <span>{item.type === "tv" ? "Series" : fmtDuration(item.duration)}</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{item.genre}</span>
            </motion.div>

            <motion.p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 drop-shadow sm:text-base" variants={itemV}>
              {item.description}
            </motion.p>

            <motion.div className="mt-6 flex flex-wrap items-center gap-3" variants={itemV}>
              <motion.div whileHover={reduce ? undefined : { scale: 1.05, y: -3 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}>
                <Link
                  href={`/watch/${item.id}`}
                  className="btn btn-light !px-7 !py-3 text-base"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13l11-6.5-11-6.5z" />
                  </svg>
                  {pct > 0 ? "Resume" : "Play"}
                </Link>
              </motion.div>
              <motion.div whileHover={reduce ? undefined : { scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}>
                <Link href={`/title/${item.id}`} className="btn btn-ghost !px-7 !py-3 text-base">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 10.6v5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="7.6" r="1.05" fill="currentColor" />
                  </svg>
                  More Info
                </Link>
              </motion.div>
            </motion.div>

            {pct > 0 && (
              <motion.div className="mt-5 max-w-sm" variants={itemV}>
                <div className="mb-1 flex justify-between text-[0.7rem] font-bold text-white/70">
                  <span>{progress!.completed ? "Completed" : "Continue watching"}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className={`h-full rounded-full ${progress!.completed ? "bg-emerald-400" : "bg-[#e50914]"}`} style={{ width: `${pct}%` }} />
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Cursor glare sheen */}
      {!reduce && (
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20" style={{ background: glare }} />
      )}
    </motion.section>
  );
}
