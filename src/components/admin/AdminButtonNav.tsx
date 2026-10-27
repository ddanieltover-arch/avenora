/**
 * @license Apache-2.0
 * Horizontal admin section button bar — mirrors customer portal secondary nav.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminTabId } from '../../routing/appRoutes.ts';
import { ADMIN_LIVE_TABS } from './AdminSidebar.tsx';

interface AdminButtonNavProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
}

export const AdminButtonNav: React.FC<AdminButtonNavProps> = ({ activeTab, onTabChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollHints();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    el.addEventListener('scroll', updateScrollHints, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateScrollHints);
    };
  }, [updateScrollHints]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <nav
      className="shrink-0 bg-[#FAFAF7] border-b border-[#E2E8E4]"
      aria-label="Admin sections"
    >
      <div className="relative flex items-stretch px-2 sm:px-4 lg:px-6">
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollBy(-220)}
            className="hidden sm:flex absolute left-1 z-10 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white border border-[#E2E8E4] shadow-sm text-[#075B46] hover:bg-[#F1F4F1] cursor-pointer"
            aria-label="Scroll navigation left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className="flex flex-1 items-center gap-1.5 overflow-x-auto min-h-[3.25rem] py-2 px-1 sm:px-6 scrollbar-none"
          role="tablist"
          style={{ scrollbarWidth: 'none' }}
        >
          {ADMIN_LIVE_TABS.map((item) => {
            const Icon = item.icon;
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-current={selected ? 'page' : undefined}
                onClick={() => onTabChange(item.id)}
                className={`relative shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/50 focus-visible:ring-offset-1 ${
                  selected
                    ? 'bg-gradient-to-r from-[#075B46] to-[#063D32] text-white shadow-sm'
                    : 'text-[#17231F] hover:bg-[#F1F4F1]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${selected ? 'text-white' : 'text-[#68746E]'}`}
                  aria-hidden
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollBy(220)}
            className="hidden sm:flex absolute right-1 z-10 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white border border-[#E2E8E4] shadow-sm text-[#075B46] hover:bg-[#F1F4F1] cursor-pointer"
            aria-label="Scroll navigation right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </nav>
  );
};
