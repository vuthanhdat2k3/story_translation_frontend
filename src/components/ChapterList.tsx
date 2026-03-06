"use client";

import Link from "next/link";
import { ChapterListItem } from "@/types";

interface ChapterListProps {
  chapters: ChapterListItem[];
  novelId: number;
  onDeleteChapter?: (id: number) => void;
  onRetranslateChapter?: (id: number) => void;
}

const STATUS_CONFIG: Record<string, { icon: string; textClass: string; bgClass: string }> = {
  pending:    { icon: "⏳", textClass: "text-slate-500", bgClass: "bg-slate-500/10" },
  translating:{ icon: "🔄", textClass: "text-amber-500", bgClass: "bg-amber-500/10" },
  completed:  { icon: "✅", textClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
  error:      { icon: "❌", textClass: "text-rose-500", bgClass: "bg-rose-500/10" },
};

export default function ChapterList({ chapters, novelId, onDeleteChapter, onRetranslateChapter }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <div className="glass-card text-center py-20 rounded-[2rem] border border-dashed border-[var(--color-border)]">
        <span className="text-5xl mb-4 block opacity-50">📭</span>
        <p className="text-lg font-bold opacity-70">Tác phẩm này chưa có chương nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter, index) => {
        const st = STATUS_CONFIG[chapter.status] ?? STATUS_CONFIG.pending;
        return (
          <div
            key={chapter.id}
            className="glass-card group flex items-center gap-4 sm:gap-6 px-5 sm:px-6 py-4 rounded-[1.5rem] transition-all duration-300 hover:shadow-hover animate-slide-down relative overflow-hidden"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-premium opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none" />

            {/* Number badge */}
            <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center text-sm font-extrabold text-white shrink-0 bg-gradient-premium shadow-[0_4px_10px_rgba(99,102,241,0.3)]">
              {chapter.chapter_number}
            </div>

            {/* Title + date — clickable area */}
            <Link href={`/chapter/${chapter.id}`} className="flex-1 min-w-0 py-1 outline-none">
              <p className="text-lg font-extrabold truncate hover:text-transparent hover:bg-clip-text hover:bg-gradient-premium transition-all duration-300 mb-1">
                {chapter.title || `Chương ${chapter.chapter_number}`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {new Date(chapter.created_at).toLocaleDateString("vi-VN")}
                </p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.bgClass} ${st.textClass}`}>
                  <span>{st.icon}</span> {chapter.status}
                </span>
              </div>
            </Link>

            {/* Action buttons */}
            <div className="shrink-0 flex items-center gap-2">
              {onRetranslateChapter && (
                <button
                  title="Dịch lại chương này"
                  onClick={(e) => { e.preventDefault(); onRetranslateChapter(chapter.id); }}
                  disabled={chapter.status === "translating"}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors duration-200 disabled:opacity-40"
                  style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-accent)" }}
                >
                  🔁
                </button>
              )}
              {onDeleteChapter && (
                <button
                  title="Xóa chương này"
                  onClick={(e) => { e.preventDefault(); onDeleteChapter(chapter.id); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors duration-200 hover:bg-red-500/20"
                  style={{ background: "rgba(239,68,68,0.08)", color: "var(--color-error)" }}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
