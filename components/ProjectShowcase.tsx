"use client";

/**
 * ProjectShowcase — a 3D animated section explaining the project itself:
 * what NebulaStream is, what it does, and the tech behind it.
 *
 * Motion: scroll-triggered entrance, mouse-tracked 3D tilt on the tech cards,
 * floating stat chips, animated counters. All gated on prefers-reduced-motion.
 */
import Link from "next/link";
import { motion, useInView, useReducedMotion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------ stat counter ------------------------------ */

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    const dur = 1400;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // RAF is frozen in hidden tabs — a timeout guarantees the final value lands.
    const done = window.setTimeout(() => setVal(to), dur + 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
  }, [inView, to, reduce]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ------------------------------- tilt card -------------------------------- */

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.12), transparent 60%)`;

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * 12);
        rx.set(-(py - 0.5) * 12);
        gx.set(px * 100);
        gy.set(py * 100);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glare }}
      />
    </motion.div>
  );
}

/* --------------------------------- section -------------------------------- */

const FEATURES = [
  {
    icon: "▶",
    title: "Real Streaming",
    body: "A custom HTML5 player with resume-from-position, playback speed, fullscreen and per-episode progress — every position saved to SQLite as you watch.",
  },
  {
    icon: "🗂️",
    title: "SQLite-Powered",
    body: "Accounts, watchlists, likes, history and recommendations all live in a real relational database with foreign keys and migrations — no fake data.",
  },
  {
    icon: "🎯",
    title: "Smart Recommendations",
    body: "The more you watch, like and list, the smarter your rows get. Genre affinity is computed from your actual activity across every profile.",
  },
];

const STACK = [
  { k: "Next.js 15", d: "App Router + RSC" },
  { k: "SQLite", d: "better-sqlite3 · WAL" },
  { k: "TypeScript", d: "strict mode" },
  { k: "Tailwind v4", d: "design tokens" },
  { k: "framer-motion", d: "3D + spring physics" },
];

export default function ProjectShowcase({ stats }: { stats: { titles: number; episodes: number; genres: number } }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} className="relative mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-10" aria-label="About this project">
      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#e50914]/10 blur-[120px]" />
      </div>

      <motion.div
        className="relative mx-auto max-w-3xl text-center"
        initial={reduce ? false : { opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <span className="badge badge-gold mb-4">About This Project</span>
        <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
          A streaming platform,{" "}
          <span className="bg-gradient-to-r from-[#e50914] via-[#ff6b60] to-[#f5c518] bg-clip-text text-transparent">
            built for real
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-dim sm:text-base">
          NebulaStream is a fully functional Netflix-inspired platform: every button, search, filter and
          playback action writes to a real SQLite database. The catalog streams 33 genuine films and series —
          modern Creative Commons open movies and public-domain mission animations — all legally hosted by the Internet Archive.
        </p>
      </motion.div>

      {/* animated stats */}
      <motion.div
        className="relative mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
      >
        {[
          { n: stats.titles, s: "+", label: "Titles streaming" },
          { n: stats.episodes, s: "", label: "TV episodes" },
          { n: stats.genres, s: "", label: "Genres" },
        ].map((st) => (
          <div key={st.label} className="card-surface px-2 py-6">
            <p className="text-3xl font-semibold text-white sm:text-4xl">
              <Counter to={st.n} suffix={st.s} />
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-dim">{st.label}</p>
          </div>
        ))}
      </motion.div>

      {/* feature cards with 3D tilt */}
      <div className="relative mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.12 }}
          >
            <TiltCard className="group card-surface relative h-full overflow-hidden p-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#e50914]/25 to-[#e50914]/5 text-xl text-[#ff6b60] ring-1 ring-[#e50914]/30">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dim">{f.body}</p>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* tech stack chips */}
      <motion.div
        className="relative mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-3"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        {STACK.map((t, i) => (
          <motion.div
            key={t.k}
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            className="card-surface flex items-center gap-2 px-4 py-2.5"
          >
            <span className="text-sm font-semibold text-white">{t.k}</span>
            <span className="text-xs text-dim">{t.d}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div
        className="relative mt-12 flex flex-wrap items-center justify-center gap-3"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <motion.div whileHover={reduce ? undefined : { scale: 1.05, y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}>
          <Link href="/signup" className="btn btn-accent !px-7 !py-3">Create Free Account</Link>
        </motion.div>
        <motion.div whileHover={reduce ? undefined : { scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}>
          <Link href="/browse" className="btn btn-ghost !px-7 !py-3">Start Watching</Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
