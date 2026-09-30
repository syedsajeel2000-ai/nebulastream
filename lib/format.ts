/** Formatting helpers — safe in both server and client components. */

/** Format a duration given in SECONDS as e.g. "1h 28m" or "79m". */
export function fmtDuration(sec?: number): string {
  if (!sec || sec <= 0) return "";
  const mins = Math.round(sec / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Format seconds as a clock string: "1:28:52" or "12:34". */
export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
}
