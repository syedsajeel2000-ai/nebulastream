"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="fixed bottom-6 right-4 z-[100] flex flex-col gap-2 sm:right-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`anim-toast pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-md ${
              t.kind === "success"
                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                : t.kind === "error"
                  ? "border border-red-400/30 bg-red-500/15 text-red-100"
                  : "border border-white/15 bg-black/70 text-white"
            }`}
          >
            <span aria-hidden className="text-base">
              {t.kind === "success" ? "✅" : t.kind === "error" ? "⚠️" : "ℹ️"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
