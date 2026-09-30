"use client";

import { useRef, useState } from "react";
import ContentCard, { type CardItem, type CardProgress } from "./ContentCard";
import { FadeIn, StaggerGroup, StaggerItem } from "./motion";

interface Props {
  title: string;
  items?: CardItem[];
  loading?: boolean;
  href?: string;
  progressMap?: Record<number, CardProgress>;
  inListSet?: Set<number>;
  onListChange?: (contentId: number, inList: boolean) => void;
}

export default function ContentRow({ title, items, loading, href, progressMap, inListSet, onListChange }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  function updateArrows() {
    const el = scroller.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }

  function scrollBy(dir: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (loading) {
    return (
      <section className="mb-8">
        <div className="skeleton mb-3 h-6 w-44" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="shrink-0">
              <div className="skeleton aspect-[2/3] w-[150px] rounded-xl sm:w-[168px] lg:w-[185px]" />
              <div className="skeleton mt-2 h-3.5 w-28" />
              <div className="skeleton mt-1.5 h-3 w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="group/row relative mb-8" aria-label={title}>
      <FadeIn whenVisible y={24}>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="section-title">
          {href ? (
            <a href={href} className="transition-colors hover:text-[#e50914]">
              {title}
              <span aria-hidden className="ml-2 inline-block text-sm opacity-0 transition-all duration-300 group-hover/row:opacity-100">
                →
              </span>
            </a>
          ) : (
            title
          )}
        </h2>
      </div>

      <div className="relative">
        {!atStart && (
          <button
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-[38%] z-20 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-white/20 bg-black/75 text-white opacity-0 shadow-2xl backdrop-blur transition group-hover/row:opacity-100 hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {!atEnd && (
          <button
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-[38%] z-20 grid h-11 w-11 translate-x-1/2 place-items-center rounded-full border border-white/20 bg-black/75 text-white opacity-0 shadow-2xl backdrop-blur transition group-hover/row:opacity-100 hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <StaggerGroup whenVisible>
        <div
          ref={scroller}
          onScroll={updateArrows}
          className="row-scroll px-0.5"
        >
          {items.map((item) => (
            <StaggerItem key={`${item.id}-${item.title}`} className="shrink-0">
              <ContentCard
                item={item}
                progress={progressMap?.[item.id]}
                inList={inListSet?.has(item.id)}
                onListChange={(v) => onListChange?.(item.id, v)}
              />
            </StaggerItem>
          ))}
        </div>
        </StaggerGroup>
      </div>
      </FadeIn>
    </section>
  );
}
