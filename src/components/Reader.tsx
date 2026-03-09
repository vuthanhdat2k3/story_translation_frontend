"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ReaderProps {
  content: string;
  chapterTitle: string;
  novelId: number;
  prevId: number | null;
  nextId: number | null;
}

export default function Reader({ content, chapterTitle, novelId, prevId, nextId }: ReaderProps) {
  const [fontSize, setFontSize] = useState(20);
  const router = useRouter();
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  const sentenceBlocks = content
    .split(/\r?\n+/)
    .flatMap((paragraph) =>
      paragraph
        .trim()
        .split(/(?<=[.!?…])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
    );

  const handleScreenClick = (e: React.MouseEvent) => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const now = Date.now();
    if (now - lastTapTimeRef.current < 500) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current === 3) {
      tapCountRef.current = 0;
      const clientX = e.clientX;
      const isLeftHalf = clientX < window.innerWidth / 2;
      
      if (isLeftHalf && prevId) {
        router.push(`/chapter/${prevId}`);
      } else if (!isLeftHalf && nextId) {
        router.push(`/chapter/${nextId}`);
      } else if (nextId) {
        router.push(`/chapter/${nextId}`);
      }
    }
  };

  return (
    <div className="animate-fade-in pb-20 relative min-h-screen" onClick={handleScreenClick}>
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none opacity-50" />

      {/* Toolbar */}
      <div className="glass-card sticky top-20 sm:top-24 z-40 rounded-full px-3 sm:px-5 py-2.5 sm:py-3 mb-12 sm:mb-16 flex items-center justify-between gap-2 sm:gap-4 max-w-4xl mx-auto shadow-sm border border-white/10 transition-all duration-300 mx-4 sm:mx-auto">
        <Link
          href={`/novel/${novelId}`}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 hover:bg-indigo-500/10 hover:text-indigo-500 active:scale-95 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-base sm:text-lg leading-none mb-0.5">←</span> Mục lục
        </Link>

        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-0 bg-[var(--color-bg-secondary)] rounded-full border border-white/5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setFontSize((s) => Math.max(s - 2, 14))}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-extrabold transition-all hover:bg-white/10 active:scale-95 flex items-center justify-center opacity-70 hover:opacity-100 shrink-0"
          >
            A−
          </button>
          <span className="text-[10px] sm:text-xs font-bold w-8 sm:w-12 text-center tabular-nums uppercase tracking-widest opacity-50 shrink-0">
            {fontSize}
          </span>
          <button
            onClick={() => setFontSize((s) => Math.min(s + 2, 40))}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-extrabold transition-all hover:bg-white/10 active:scale-95 flex items-center justify-center opacity-70 hover:opacity-100 shrink-0"
          >
            A+
          </button>
        </div>
      </div>

      {/* Chapter title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-16 text-gradient-premium max-w-4xl mx-auto leading-tight drop-shadow-sm px-4">
        {chapterTitle}
      </h1>

      {/* Content */}
      <article
        className="max-w-4xl mx-auto px-4 leading-[1.85] font-medium opacity-90 transition-all duration-300 text-[var(--color-text)] select-text"
        style={{ fontSize: `${fontSize}px` }}
      >
        {sentenceBlocks.length > 0 ? (
          sentenceBlocks.map((sentence, index) => (
            <p key={`${index}-${sentence.slice(0, 20)}`} className="mb-[1em]">
              {sentence}
            </p>
          ))
        ) : (
          <p>{content}</p>
        )}
      </article>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto mt-24 pt-12 gap-4 px-4 border-t border-dashed border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
        {prevId ? (
          <Link
            href={`/chapter/${prevId}`}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full text-sm sm:text-base font-extrabold transition-all hover:-translate-x-1 active:scale-95 shadow-sm border-2 border-[var(--color-border)] hover:border-indigo-500/50 bg-[var(--color-bg-card)]"
          >
            <span className="text-xl leading-none">←</span> Chương trước
          </Link>
        ) : <div className="hidden sm:block" />}

        {nextId ? (
          <Link
            href={`/chapter/${nextId}`}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full text-sm sm:text-base font-extrabold text-white transition-all duration-300 hover:translate-x-1 active:scale-95 bg-gradient-premium shadow-card hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] group"
          >
            Chương tiếp <span className="text-xl leading-none group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        ) : <div className="hidden sm:block" />}
      </div>
    </div>
  );
}
