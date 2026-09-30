"use client";

import { useState } from "react";

export default function HelpAccordion({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2.5">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} className={`card-surface overflow-hidden transition ${isOpen ? "border-white/20" : ""}`}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 p-4 text-left"
            >
              <span className="font-bold">{q}</span>
              <span
                aria-hidden
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/8 text-sm transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                ＋
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 text-sm leading-relaxed text-dim">{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
