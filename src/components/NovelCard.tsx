"use client";

import Link from "next/link";
import { Novel } from "@/types";

interface NovelCardProps {
  novel: Novel;
  index: number;
}

const STATUS_MAP: Record<string, { label: string; textClass: string; bgClass: string }> = {
  completed:  { label: "Hoàn thành", textClass: "text-emerald-500",  bgClass: "bg-emerald-500/10" },
  translating:{ label: "Đang dịch",  textClass: "text-amber-500",  bgClass: "bg-amber-500/10" },
  pending:    { label: "Chờ dịch",   textClass: "text-slate-500", bgClass: "bg-slate-500/10" },
};

export default function NovelCard({ novel, index }: NovelCardProps) {
  const pct = novel.total_chapters > 0
    ? Math.round((novel.translated_chapters / novel.total_chapters) * 100)
    : 0;
  const st = STATUS_MAP[novel.status] ?? STATUS_MAP.pending;

  return (
    <Link href={`/novel/${novel.id}`} className="block h-full group outline-none">
      <div
        className="glass-card h-full rounded-[2rem] p-6 sm:p-7 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-hover animate-slide-down overflow-hidden relative"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Subtle hover gradient */}
        <div className="absolute inset-0 bg-gradient-premium opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none" />

        {/* Top row */}
        <div className="flex items-start justify-between mb-5 gap-3 relative z-10">
          <div className="w-12 h-12 flex items-center justify-center rounded-[1rem] bg-indigo-500/10 text-indigo-500 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            <span className="text-2xl drop-shadow-sm">📖</span>
          </div>
          <span className={`px-3 py-1 pb-1.5 rounded-full text-xs font-bold tracking-wide shrink-0 ${st.bgClass} ${st.textClass}`}>
            {st.label}
          </span>
        </div>

        {/* Title */}
        <div className="relative z-10">
          <h3
            className="font-extrabold text-xl leading-snug mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-premium transition-all duration-300"
            title={novel.title}
          >
            {novel.title}
          </h3>
          <p className="text-sm mb-6 truncate font-medium opacity-60">
            {novel.author}
          </p>
        </div>

        {/* Progress */}
        <div className="mt-auto relative z-10">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-3">
            <span className="opacity-50">Tiến độ</span>
            <span className="text-indigo-500">
              {novel.translated_chapters} / {novel.total_chapters} <span className="opacity-70 ml-1">({pct}%)</span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-premium shadow-[0_0_10px_rgba(99,102,241,0.5)] relative"
              style={{ width: `${pct}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px] rounded-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
