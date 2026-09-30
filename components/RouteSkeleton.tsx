/**
 * Route-level loading skeletons (used by app/**\/loading.tsx).
 * Server-component safe: pure markup + CSS shimmer, no JS.
 */

function ShimmerLine({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

function PosterSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
        <div key={i}>
          <ShimmerLine className="aspect-[2/3] w-full rounded-xl" />
          <ShimmerLine className="mt-2 h-3.5 w-3/4" />
          <ShimmerLine className="mt-1.5 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function PageHeaderSkeleton({ wide = true }: { wide?: boolean }) {
  return (
    <div>
      <ShimmerLine className={`h-9 ${wide ? "w-64" : "w-48"} rounded-lg`} />
      <ShimmerLine className="mt-2 h-4 w-80 max-w-full" />
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="route-loading" aria-busy="true" aria-live="polite">
      <PageHeaderSkeleton />
      <ShimmerLine className="h-10 w-40 rounded-lg" />
      <PosterSkeletonGrid count={count} />
    </div>
  );
}

export function HeroRowsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      {/* Hero */}
      <div className="relative min-h-[62vh] w-full overflow-hidden">
        <div className="skeleton absolute inset-0 rounded-none" />
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 pb-14 sm:px-8 lg:px-16">
            <ShimmerLine className="h-6 w-40" />
            <ShimmerLine className="mt-4 h-12 w-96 max-w-full rounded-lg" />
            <ShimmerLine className="mt-4 h-4 w-72 max-w-full" />
            <ShimmerLine className="mt-3 h-4 w-full max-w-xl" />
            <div className="mt-6 flex gap-3">
              <ShimmerLine className="h-11 w-32 rounded-lg" />
              <ShimmerLine className="h-11 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      {/* Rows */}
      <div className="mx-auto max-w-[1500px] space-y-10 px-4 py-10 sm:px-6 lg:px-10">
        {[0, 1, 2].map((row) => (
          <div key={row}>
            <ShimmerLine className="mb-3 h-6 w-44" />
            <div className="row-scroll">
              {Array.from({ length: 6 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                <div key={i} className="w-[150px] shrink-0 sm:w-[168px] lg:w-[185px]">
                  <ShimmerLine className="aspect-[2/3] w-full rounded-xl" />
                  <ShimmerLine className="mt-2 h-3.5 w-28" />
                  <ShimmerLine className="mt-1.5 h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="relative min-h-[46vh] w-full overflow-hidden">
        <div className="skeleton absolute inset-0 rounded-none" />
      </div>
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <ShimmerLine className="aspect-[2/3] w-40 shrink-0 rounded-xl sm:w-48" />
          <div className="flex-1">
            <ShimmerLine className="h-9 w-3/4 max-w-md rounded-lg" />
            <ShimmerLine className="mt-3 h-4 w-56" />
            <ShimmerLine className="mt-5 h-4 w-full max-w-xl" />
            <ShimmerLine className="mt-2 h-4 w-full max-w-xl" />
            <ShimmerLine className="mt-2 h-4 w-2/3 max-w-md" />
            <div className="mt-6 flex gap-3">
              <ShimmerLine className="h-11 w-28 rounded-lg" />
              <ShimmerLine className="h-11 w-36 rounded-lg" />
              <ShimmerLine className="h-11 w-24 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="mt-10 space-y-3">
          <ShimmerLine className="h-5 w-32" />
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
            <ShimmerLine key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="route-loading" aria-busy="true" aria-live="polite">
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black">
        <div className="flex flex-col items-center gap-4">
          <span className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/15 border-t-[#e50914]" />
          <p className="text-sm font-medium text-white/60">Loading player…</p>
        </div>
      </div>
      <ShimmerLine className="h-7 w-72 max-w-full rounded-lg" />
      <ShimmerLine className="h-4 w-full max-w-2xl" />
      <ShimmerLine className="h-4 w-2/3 max-w-xl" />
    </div>
  );
}

export function SimpleSkeleton() {
  return (
    <div className="route-loading" aria-busy="true" aria-live="polite">
      <PageHeaderSkeleton />
      <ShimmerLine className="h-36 w-full rounded-2xl" />
      <ShimmerLine className="h-36 w-full rounded-2xl" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="route-loading" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-5">
        <ShimmerLine className="h-20 w-20 shrink-0 rounded-full" />
        <div className="flex-1">
          <ShimmerLine className="h-8 w-56 max-w-full rounded-lg" />
          <ShimmerLine className="mt-2 h-4 w-44" />
        </div>
      </div>
      <ShimmerLine className="h-52 w-full rounded-2xl" />
    </div>
  );
}
