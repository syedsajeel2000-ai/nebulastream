"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  poster?: string;
  startAt: number;
  contentId: number;
  episodeId?: number | null;
  onEnded?: () => void;
  onFirstFrame?: () => void;
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

export default function VideoPlayer({ src, poster, startAt, contentId, episodeId, onEnded, onFirstFrame }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const seekedRef = useRef(false);
  const lastSavedRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState(false);
  const [speedMenu, setSpeedMenu] = useState(false);

  const saveProgress = useCallback(
    (position: number, dur: number) => {
      if (dur <= 0) return;
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          episodeId: episodeId ?? null,
          position,
          duration: dur,
        }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [contentId, episodeId]
  );

  // Resume: seek to the saved position once metadata is available.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    seekedRef.current = false;
    setBuffering(true);
    setError(false);

    function onLoaded() {
      if (!v) return;
      setDuration(v.duration || 0);
      if (!seekedRef.current && startAt > 0 && startAt < (v.duration || 0) - 5) {
        v.currentTime = startAt;
      }
      seekedRef.current = true;
      setBuffering(false);
      onFirstFrame?.();
    }
    v.addEventListener("loadedmetadata", onLoaded);
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [src, startAt, onFirstFrame]);

  // Periodic autosave every 10s while playing + save on pause/unload.
  useEffect(() => {
    function intervalSave() {
      const v = videoRef.current;
      if (v && !v.paused && v.duration > 0 && v.currentTime - lastSavedRef.current >= 10) {
        lastSavedRef.current = v.currentTime;
        saveProgress(v.currentTime, v.duration);
      }
    }
    const t = window.setInterval(intervalSave, 3000);
    return () => {
      window.clearInterval(t);
      const v = videoRef.current;
      if (v && v.duration > 0 && v.currentTime > 0) saveProgress(v.currentTime, v.duration);
    };
  }, [saveProgress, src]);

  // Pause → save immediately.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function onPause() {
      if (v!.duration > 0) saveProgress(v!.currentTime, v!.duration);
    }
    v.addEventListener("pause", onPause);
    return () => v.removeEventListener("pause", onPause);
  }, [saveProgress, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
    v.playbackRate = speed;
  }, [volume, muted, speed]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setError(true));
    else v.pause();
  }

  function seekTo(t: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, t), v.duration || 0);
    setCurrent(v.currentTime);
  }

  function toggleFullscreen() {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.requestFullscreen?.().catch(() => undefined);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowRight") seekTo(current + 10);
    else if (e.key === "ArrowLeft") seekTo(current - 10);
    else if (e.key === "m") setMuted((m) => !m);
    else if (e.key === "f") toggleFullscreen();
  }

  return (
    <div
      ref={shellRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="player-shell relative w-full overflow-hidden rounded-none bg-black outline-none sm:rounded-2xl"
      aria-label="Video player"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster ? `/api/art?url=${encodeURIComponent(poster)}` : undefined}
        playsInline
        preload="metadata"
        className="aspect-video w-full"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => {
          setBuffering(false);
          setError(false);
        }}
        onEnded={() => {
          setPlaying(false);
          if (videoRef.current?.duration) saveProgress(videoRef.current.duration, videoRef.current.duration);
          onEnded?.();
        }}
        onError={() => {
          setBuffering(false);
          setError(true);
        }}
      />

      {/* Buffering spinner */}
      {buffering && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#e50914]" />
        </div>
      )}

      {/* Playback error */}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/85 p-6 text-center">
          <div>
            <p className="text-lg font-bold">Video failed to load</p>
            <p className="mt-1 text-sm text-dim">
              Check your connection and try again. The demo streams open-license sample videos.
            </p>
            <button
              onClick={() => {
                setError(false);
                setBuffering(true);
                videoRef.current?.load();
              }}
              className="btn btn-accent mt-4"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Big center play button (paused) */}
      {!playing && !buffering && !error && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 m-auto grid h-20 w-20 place-items-center rounded-full bg-[#e50914]/95 text-white shadow-2xl transition hover:scale-110"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.5v13l11-6.5-11-6.5z" />
          </svg>
        </button>
      )}

      {/* Controls */}
      <div
        className={`player-controls absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-10 transition-all duration-300 sm:px-4 ${
          playing ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Seek bar */}
        <input
          type="range"
          className="seek"
          min={0}
          max={Math.max(duration, 0.1)}
          step={0.1}
          value={Math.min(current, duration || 0)}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Seek"
          style={{
            background: `linear-gradient(to right, #e50914 ${(current / Math.max(duration, 0.1)) * 100}%, rgba(255,255,255,0.25) ${(current / Math.max(duration, 0.1)) * 100}%)`,
          }}
        />

        <div className="mt-2 flex items-center gap-2 text-white">
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/15">
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            )}
          </button>

          <button onClick={() => seekTo(current - 10)} aria-label="Back 10 seconds" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/15">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M11 8H5V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-45 8 5)" />
              <path d="M5.5 13a6.5 6.5 0 1 0 1.6-6.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="group/vol flex items-center gap-1.5">
            <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/15">
              {muted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                  <path d="M17 9l4 6M21 9l-4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                  <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(Number(e.target.value) === 0);
              }}
              aria-label="Volume"
              className="h-1 w-0 cursor-pointer rounded-full opacity-0 transition-all duration-300 group-hover/vol:w-20 group-hover/vol:opacity-100 sm:group-hover/vol:w-24"
              style={{
                background: `linear-gradient(to right, #fff ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.25) ${(muted ? 0 : volume) * 100}%)`,
                appearance: "none",
              }}
            />
          </div>

          <span className="ml-1 select-none text-xs font-semibold tabular-nums text-white/90 sm:text-sm">
            {fmt(current)} <span className="text-white/50">/ {fmt(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-1">
            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setSpeedMenu((s) => !s)}
                aria-label="Playback speed"
                aria-expanded={speedMenu}
                className="grid h-10 w-10 place-items-center rounded-full text-xs font-black transition hover:bg-white/15"
              >
                {speed}×
              </button>
              {speedMenu && (
                <div className="anim-scale-in absolute bottom-12 right-0 z-20 w-24 overflow-hidden rounded-lg border border-white/15 bg-black/95 py-1 shadow-2xl">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSpeed(s);
                        setSpeedMenu(false);
                      }}
                      className={`block w-full px-4 py-1.5 text-left text-sm transition hover:bg-white/10 ${
                        speed === s ? "font-black text-[#e50914]" : "text-white/85"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) seekTo(Math.min((v.currentTime || 0) + 10, v.duration || 0));
              }}
              aria-label="Forward 10 seconds"
              className="hidden h-10 w-10 place-items-center rounded-full transition hover:bg-white/15 sm:grid"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ transform: "scaleX(-1)" }}>
                <path d="M11 8H5V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-45 8 5)" />
                <path d="M5.5 13a6.5 6.5 0 1 0 1.6-6.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <button onClick={toggleFullscreen} aria-label="Fullscreen" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
