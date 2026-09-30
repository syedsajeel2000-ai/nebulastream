"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function NotFound() {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url(/api/art?url=https%3A%2F%2Fpicsum.photos%2Fseed%2Fnebula-404%2F1600%2F900)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-[#0a0c14]/80 to-[#0a0c14]/60" />

      <motion.div
        className="relative z-10 max-w-lg text-center"
        initial={reduce ? false : { opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <motion.p
          className="text-[7rem] font-semibold leading-none tracking-tighter text-[#e50914] drop-shadow-2xl sm:text-[9rem]"
          initial={reduce ? false : { scale: 0.7, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 16, delay: 0.1 }}
        >
          404
        </motion.p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Page Not Found</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-dim">
          The page you're looking for drifted out of orbit. It may have been removed, or the link is wrong.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <motion.div whileHover={reduce ? undefined : { scale: 1.06, y: -3 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}>
            <Link href="/" className="btn btn-accent !px-7 !py-3">Go Home</Link>
          </motion.div>
          <motion.div whileHover={reduce ? undefined : { scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}>
            <Link href="/browse" className="btn btn-light !px-7 !py-3">Browse Content</Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
