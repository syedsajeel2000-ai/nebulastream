/**
 * Branded skeleton loading screen.
 * Server-component safe: pure markup + CSS animations (no JS, no framer-motion),
 * so it streams instantly while the route's data loads.
 *
 * Layout mirrors the real homepage: full-bleed hero skeleton + content rows,
 * fronted by a centered logo lockup with a pulsing glow and a sliding bar.
 */
import { HeroRowsSkeleton } from "@/components/RouteSkeleton";

export default function LoadingScreen() {
  return (
    <div className="relative" aria-busy="true" aria-live="polite" aria-label="Loading NebulaStream">
      {/* Skeleton shell behind the brand overlay */}
      <div className="pointer-events-none select-none opacity-60">
        <HeroRowsSkeleton />
      </div>

      {/* Brand overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c14]/72 backdrop-blur-[3px]">
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="loading-logo grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#e50914] to-[#8b0209] font-brand text-xl font-extrabold text-white">
              N
            </span>
            <span className="loading-wordmark text-2xl font-extrabold tracking-tight">
              NEBULA<span className="text-[#e50914]">STREAM</span>
            </span>
          </div>
          <div className="loading-bar" role="progressbar" aria-label="Loading" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-dim">Preparing your screen</p>
        </div>
      </div>
    </div>
  );
}
