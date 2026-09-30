"use client";

import { useEffect, useRef, useState } from "react";

/** extract a YouTube video id from a watch/m/embed URL */
function youtubeId(url: string): string | null {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

/** parse an optional "start,end" media-fragment window: url#t=30,120 */
function timeWindow(url: string): { src: string; start: number | null; end: number | null } {
  const m = url.match(/#t=(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))/);
  if (!m) return { src: url, start: null, end: null };
  return {
    src: url.slice(0, m.index),
    start: parseFloat(m[1]),
    end: m[2] ? parseFloat(m[2]) : null,
  };
}

/** Direct-play video that honours an optional [start, end) highlight window.
 * Uses raw DOM listeners (React does not reliably receive media events). */
function WindowVideo({ src, start, end }: { src: string; start: number | null; end: number | null }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onMeta = () => {
      if (start != null) v.currentTime = start;
    };
    const onTick = () => {
      if (end != null && v.currentTime >= end) {
        v.currentTime = end;
        v.pause();
      }
    };
    const onErr = () => {
      v.closest("div")?.replaceChildren(
        Object.assign(document.createElement("p"), {
          textContent: "Trailer could not be loaded. Please try again later.",
          className: "p-6 text-center text-sm text-dim",
        })
      );
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTick);
    v.addEventListener("error", onErr);
    if (v.readyState >= 1) onMeta();
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTick);
      v.removeEventListener("error", onErr);
    };
  }, [src, start, end]);

  return (
    <video
      ref={ref}
      src={src}
      controls
      autoPlay
      playsInline
      className="aspect-video w-full bg-black"
    />
  );
}

export default function TrailerButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const ytId = youtubeId(url);
  const { src, start, end } = timeWindow(url);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-outline mt-3 w-full">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13l11-6.5-11-6.5z" />
        </svg>
        Watch Trailer
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} trailer`}
          className="anim-fade-in fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="anim-scale-in w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="truncate text-sm font-bold">{title} — Trailer</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close trailer"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {ytId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                title={`${title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full border-0 bg-black"
              />
            ) : (
              <WindowVideo src={src} start={start} end={end} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
