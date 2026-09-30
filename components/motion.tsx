"use client";

/**
 * Shared framer-motion primitives — every animation in the app flows through
 * here so prefers-reduced-motion is respected in ONE place.
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
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/* --------------------------------- FadeIn --------------------------------- */

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  /** Animate when scrolled into view instead of on mount */
  whenVisible?: boolean;
  once?: boolean;
}

/** Fade + rise entrance. Used for every section, card group and block. */
export function FadeIn({ children, delay = 0, y = 18, className, whenVisible = false, once = true }: FadeInProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      {...(whenVisible
        ? { whileInView: { opacity: 1, y: 0 }, viewport: { once, margin: "-60px" } }
        : { animate: { opacity: 1, y: 0 } })}
      transition={{ duration: 0.55, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ StaggerGroup ------------------------------ */

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Wraps a list/grid; direct children should be <StaggerItem> elements. */
export function StaggerGroup({
  children,
  className,
  whenVisible = true,
}: {
  children: ReactNode;
  className?: string;
  whenVisible?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      {...(whenVisible ? { whileInView: "show", viewport: { once: true, margin: "-40px" } } : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/* --------------------------------- Tilt3D --------------------------------- */

/**
 * Mouse-tracked 3D tilt with a light glare. Motion-safe only (returns a plain
 * div when the user prefers reduced motion). The glare layer renders only on
 * hover (parent should carry the `group` class).
 */
export function Tilt3D({
  children,
  className,
  max = 8,
  scale = 1.02,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.16), transparent 55%)`;

  if (reduce) return <div className={className}>{children}</div>;

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(50);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={{ scale }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
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

/* --------------------------------- HoverFX -------------------------------- */

interface HoverButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  className?: string;
  /** Lift amount in px */
  lift?: number;
  scale?: number;
}

/**
 * Motion button with a tactile hover: lift, slight scale, press-down on tap.
 * Wrap primary action buttons in this.
 */
export function HoverButton({ children, className, lift = -2, scale = 1.03, ...rest }: HoverButtonProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    const { whileHover: _wh, whileTap: _wt, ...btnRest } = rest as Record<string, unknown>;
    return (
      <button className={className} {...(btnRest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      className={className}
      whileHover={{ y: lift, scale, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      whileTap={{ scale: 0.96, y: 0 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

/** Same tactile hover, for next/link styled as buttons (renders motion.a). */
export function HoverLink({
  children,
  className,
  href,
  lift = -2,
  scale = 1.03,
  ...rest
}: HTMLMotionProps<"a"> & { href: string; children: ReactNode; className?: string; lift?: number; scale?: number }) {
  const reduce = useReducedMotion();
  if (reduce) {
    const { whileHover: _wh, whileTap: _wt, ...linkRest } = rest as Record<string, unknown>;
    return (
      <Link href={href} className={className} {...(linkRest as Record<string, never>)}>
        {children}
      </Link>
    );
  }
  return (
    <motion.a
      href={href}
      className={className}
      whileHover={{ y: lift, scale, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      whileTap={{ scale: 0.96, y: 0 }}
      {...rest}
    >
      {children}
    </motion.a>
  );
}

/* ------------------------------ ParallaxLayer ----------------------------- */

/** Scroll-linked parallax translateY, clamped and motion-safe. */
export function ParallaxLayer({
  children,
  className,
  distance = 60,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance * 0.4, -distance * 0.6]);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
