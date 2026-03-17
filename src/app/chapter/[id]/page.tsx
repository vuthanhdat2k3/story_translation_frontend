"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchChapterNavigation, startChapterTranslation, retranslateChapter } from "@/lib/api";
import { ChapterNavigation } from "@/types";
import Reader from "@/components/Reader";

export default function ChapterPage() {
  const params = useParams();
  const chapterId = Number(params.id);

  const [data, setData] = useState<ChapterNavigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [retranslating, setRetranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      const nav = await fetchChapterNavigation(chapterId);
      setData(nav);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const pollUntilDone = (setter: (v: boolean) => void) => {
    const poll = setInterval(async () => {
      try {
        const nav = await fetchChapterNavigation(chapterId);
        setData(nav);
        if (nav.current.status !== "translating") {
          clearInterval(poll);
          setter(false);
        }
      } catch {
        clearInterval(poll);
        setter(false);
      }
    }, 3000);
  };

  const handleTranslate = async () => {
    try {
      setTranslating(true);
      await startChapterTranslation(chapterId);
      pollUntilDone(setTranslating);
    } catch {
      setTranslating(false);
    }
  };

  const handleRetranslate = async () => {
    if (!confirm("Dịch lại chương này? Bản dịch cũ sẽ bị xóa và thay bằng bản dịch mới.")) return;
    try {
      setRetranslating(true);
      setShowOriginal(false);
      await retranslateChapter(chapterId);
      // Clear old translation immediately so user knows it's being replaced
      setData((prev) => prev ? { ...prev, current: { ...prev.current, content_vi: null, status: "translating" as const } } : prev);
      pollUntilDone(setRetranslating);
    } catch {
      setRetranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <div className="skeleton h-8 w-48 mx-auto mb-10" />
        <div className="space-y-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton h-5 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl block mb-4">😢</span>
        <p style={{ color: "var(--color-text-secondary)" }}>Không tìm thấy chương</p>
      </div>
    );
  }

  const { current, prev_id, next_id } = data;
  const hasTranslation = !!current.content_vi;

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Translation status bar */}
      {!hasTranslation && (
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl mb-8 animate-fade-in"
          style={{
            background: "var(--color-accent-light)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          <div>
            <p className="text-base font-bold mb-1" style={{ color: "var(--color-accent)" }}>
              {(translating || retranslating) ? "🔄 Đang dịch chương này..." : "📝 Chương chưa được dịch"}
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
              {(translating || retranslating) ? "Gemini AI đang xử lý, vui lòng chờ" : "Bấm nút bên phải để bắt đầu"}
            </p>
          </div>
          {(translating || retranslating) ? (
            <span className="text-2xl">⏳</span>
          ) : (
            <button
              onClick={handleTranslate}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 active:scale-95 bg-gradient-premium shadow-card hover:-translate-y-0.5 hover:shadow-hover text-center"
            >
              🤖 Dịch ngay
            </button>
          )}
        </div>
      )}

      {/* View toggle + retranslate */}
      {hasTranslation && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="flex w-full sm:w-auto gap-2 p-1.5 rounded-2xl" style={{ background: "var(--color-bg-secondary)" }}>
            {[{ label: "🇻🇳 Bản dịch", orig: false }, { label: "🇨🇳 Nguyên bản", orig: true }].map(({ label, orig }) => {
              const active = showOriginal === orig;
              return (
                 <button
                   key={label}
                   onClick={() => setShowOriginal(orig)}
                   className="flex-1 sm:flex-none w-full px-6 py-2.5 rounded-xl text-base font-bold transition-all duration-200"
                   style={{
                     background: active ? "var(--color-bg-card)" : "transparent",
                     color: active ? "var(--color-text)" : "var(--color-text-muted)",
                     boxShadow: active ? "var(--shadow-card)" : "none",
                   }}
                 >
                   {label}
                 </button>
              );
            })}
          </div>
          <button
            onClick={handleRetranslate}
            disabled={retranslating}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 text-center"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-muted)" }}
          >
            {retranslating ? "🔄 Đang dịch lại..." : "🔁 Dịch lại"}
          </button>
        </div>
      )}

      {/* Reader */}
      <Reader
        content={showOriginal ? current.content_cn : (hasTranslation ? current.content_vi! : current.content_cn)}
        chapterTitle={current.title || `Chương ${current.chapter_number}`}
        novelId={current.novel_id}
        prevId={prev_id}
        nextId={next_id}
      />
    </div>
  );
}
