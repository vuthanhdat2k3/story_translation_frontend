"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const queryStorageKey = `story_translation:novel:${novelId}:chapter_query`;
  const orderStorageKey = `story_translation:novel:${novelId}:chapter_desc`;
  const readStorageKey = `story_translation:novel:${novelId}:chapter_read_ids`;
  const lastReadStorageKey = `story_translation:novel:${novelId}:last_read_chapter_id`;
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const hasAutoScrolledRef = useRef(false);

  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(queryStorageKey) || "";
  });
  const [isDescending, setIsDescending] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(orderStorageKey) === "true";
  });
  const [jumpValue, setJumpValue] = useState("");
  const [readChapterIds, setReadChapterIds] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedRead = localStorage.getItem(readStorageKey);
      if (!savedRead) return [];
      const parsed = JSON.parse(savedRead);
      return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
    } catch {
      return [];
    }
  });
  const [lastReadChapterId, setLastReadChapterId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(lastReadStorageKey);
    if (!saved) return null;
    const parsed = Number(saved);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });

  useEffect(() => {
    localStorage.setItem(queryStorageKey, query);
  }, [query, queryStorageKey]);

  useEffect(() => {
    localStorage.setItem(orderStorageKey, String(isDescending));
  }, [isDescending, orderStorageKey]);

  useEffect(() => {
    localStorage.setItem(readStorageKey, JSON.stringify(readChapterIds));
  }, [readChapterIds, readStorageKey]);

  useEffect(() => {
    if (lastReadChapterId) {
      localStorage.setItem(lastReadStorageKey, String(lastReadChapterId));
    } else {
      localStorage.removeItem(lastReadStorageKey);
    }
  }, [lastReadChapterId, lastReadStorageKey]);

  const markChapterAsRead = useCallback((chapterId: number) => {
    setReadChapterIds((prev) => (prev.includes(chapterId) ? prev : [...prev, chapterId]));
    setLastReadChapterId(chapterId);
  }, []);

  const handleMarkAllRead = () => {
    const allIds = chapters.map((c) => c.id);
    setReadChapterIds(allIds);
    const newestChapter = [...chapters].sort((a, b) => b.chapter_number - a.chapter_number)[0];
    setLastReadChapterId(newestChapter?.id ?? null);
  };

  const handleClearReadHistory = () => {
    setReadChapterIds([]);
    setLastReadChapterId(null);
  };

  const handleJumpToChapter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const chapterNumber = Number(jumpValue.trim());
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
      alert("Vui lòng nhập số chương hợp lệ.");
      return;
    }

    const targetChapter = chapters.find((c) => c.chapter_number === chapterNumber);
    if (!targetChapter) {
      alert("Không tìm thấy chương này.");
      return;
    }

    markChapterAsRead(targetChapter.id);
    router.push(`/chapter/${targetChapter.id}`);
  };

  const displayChapters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = chapters.filter((chapter) => {
      if (!normalizedQuery) return true;
      const title = (chapter.title || `Chương ${chapter.chapter_number}`).toLowerCase();
      const chapterNumber = String(chapter.chapter_number);
      return title.includes(normalizedQuery) || chapterNumber.includes(normalizedQuery);
    });

    const filteredByRead = showUnreadOnly
      ? filtered.filter((chapter) => !readChapterIds.includes(chapter.id))
      : filtered;

    const sorted = [...filteredByRead].sort((a, b) =>
      isDescending ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number
    );

    return sorted;
  }, [chapters, isDescending, query, readChapterIds, showUnreadOnly]);

  useEffect(() => {
    if (hasAutoScrolledRef.current || !lastReadChapterId) return;
    const target = document.getElementById(`chapter-item-${lastReadChapterId}`);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    hasAutoScrolledRef.current = true;
  }, [displayChapters, lastReadChapterId]);

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
      <div className="glass-card rounded-2xl p-3 sm:p-4 border border-[var(--color-border)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <label className="flex-1 min-w-0">
          <span className="sr-only">Tìm kiếm chương</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên chương hoặc số chương..."
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </label>
        <button
          onClick={() => setIsDescending((prev) => !prev)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-indigo-500/50 transition-all whitespace-nowrap"
          title="Đảo thứ tự chương"
        >
          {isDescending ? "⬇ Mới -> Cũ" : "⬆ Cũ -> Mới"}
        </button>
      </div>

      <form onSubmit={handleJumpToChapter} className="glass-card rounded-2xl p-3 sm:p-4 border border-[var(--color-border)] flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          type="number"
          min={1}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder="Nhập số chương để nhảy nhanh..."
          className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all whitespace-nowrap"
        >
          Đi tới chương
        </button>
      </form>

      <div className="glass-card rounded-2xl p-3 sm:p-4 border border-[var(--color-border)] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleMarkAllRead}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-center"
          >
            Danh dau tat ca da doc
          </button>
          <button
            onClick={handleClearReadHistory}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-center"
          >
            Xoa lich su da doc
          </button>
        </div>
        <button
          onClick={() => setShowUnreadOnly((prev) => !prev)}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold border transition-all text-center ${showUnreadOnly ? "bg-amber-500/15 text-amber-600 border-amber-500/30" : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-indigo-500/50"}`}
        >
          {showUnreadOnly ? "Dang loc: Chua doc" : "Loc chi chuong chua doc"}
        </button>
      </div>

      <p className="text-sm font-medium opacity-70 px-1">
        Hiển thị {displayChapters.length}/{chapters.length} chương • Chưa đọc: {Math.max(chapters.length - readChapterIds.length, 0)}
      </p>

      {displayChapters.length === 0 ? (
        <div className="glass-card text-center py-12 rounded-[1.5rem] border border-dashed border-[var(--color-border)]">
          <span className="text-3xl mb-3 block opacity-60">🔎</span>
          <p className="text-base font-bold opacity-80">Không tìm thấy chương phù hợp</p>
        </div>
      ) : displayChapters.map((chapter, index) => {
        const st = STATUS_CONFIG[chapter.status] ?? STATUS_CONFIG.pending;
        const isRead = readChapterIds.includes(chapter.id);
        return (
          <div
            key={chapter.id}
            id={`chapter-item-${chapter.id}`}
            className={`glass-card group flex items-center gap-4 sm:gap-6 px-5 sm:px-6 py-4 rounded-[1.5rem] transition-all duration-300 hover:shadow-hover animate-slide-down relative overflow-hidden ${isRead ? "ring-1 ring-emerald-500/30" : ""}`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-premium opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none" />

            {/* Number badge */}
            <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center text-sm font-extrabold text-white shrink-0 bg-gradient-premium shadow-[0_4px_10px_rgba(99,102,241,0.3)]">
              {chapter.chapter_number}
            </div>

            {/* Title + date — clickable area */}
            <Link
              href={`/chapter/${chapter.id}`}
              className="flex-1 min-w-0 py-1 outline-none"
              onClick={() => markChapterAsRead(chapter.id)}
            >
              <p className={`text-lg font-extrabold truncate hover:text-transparent hover:bg-clip-text hover:bg-gradient-premium transition-all duration-300 mb-1 ${isRead ? "opacity-70" : ""}`}>
                {chapter.title || `Chương ${chapter.chapter_number}`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {new Date(chapter.created_at).toLocaleDateString("vi-VN")}
                </p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.bgClass} ${st.textClass}`}>
                  <span>{st.icon}</span> {chapter.status}
                </span>
                {isRead && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                    ✓ da doc
                  </span>
                )}
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
