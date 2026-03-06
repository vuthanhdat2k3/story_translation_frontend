"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchNovel,
  fetchChapters,
  fetchTranslationStatus,
  startNovelTranslation,
  deleteNovel,
  fetchCharacterMaps,
  createCharacterMap,
  deleteCharacterMap,
  uploadChapters,
  pasteChapters,
  deleteChapter,
  retranslateChapter,
} from "@/lib/api";
import { Novel, ChapterListItem, TranslationStatus, CharacterMap } from "@/types";
import ChapterList from "@/components/ChapterList";
import { useRouter } from "next/navigation";

export default function NovelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const novelId = Number(params.id);

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [status, setStatus] = useState<TranslationStatus | null>(null);
  const [characters, setCharacters] = useState<CharacterMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [newCn, setNewCn] = useState("");
  const [newVi, setNewVi] = useState("");
  const [activeTab, setActiveTab] = useState<"chapters" | "characters" | "add_chapters">("chapters");

  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [novelData, chaptersData, statusData, charsData] = await Promise.all([
        fetchNovel(novelId),
        fetchChapters(novelId),
        fetchTranslationStatus(novelId).catch(() => null),
        fetchCharacterMaps(novelId).catch(() => ({ characters: [], total: 0 })),
      ]);
      setNovel(novelData);
      setChapters(chaptersData.chapters);
      setStatus(statusData);
      setCharacters(charsData.characters);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll translation status
  useEffect(() => {
    if (!novel || (novel.status !== "translating")) return;
    const interval = setInterval(async () => {
      try {
        const [s, c] = await Promise.all([
          fetchTranslationStatus(novelId),
          fetchChapters(novelId),
        ]);
        setStatus(s);
        setChapters(c.chapters);
        if (s.status !== "translating") {
          setNovel((prev) => prev ? { ...prev, status: s.status as Novel["status"], translated_chapters: s.translated_chapters } : prev);
          clearInterval(interval);
        }
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [novel, novelId]);

  const handleTranslate = async () => {
    try {
      setTranslating(true);
      await startNovelTranslation(novelId);
      setNovel((prev) => prev ? { ...prev, status: "translating" } : prev);
    } catch {
      // handle error
    } finally {
      setTranslating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa truyện này?")) return;
    try {
      await deleteNovel(novelId);
      router.push("/");
    } catch {
      // handle error
    }
  };

  const handleAddCharacter = async () => {
    if (!newCn.trim() || !newVi.trim()) return;
    try {
      const char = await createCharacterMap(novelId, { cn_name: newCn, vi_name: newVi });
      setCharacters((prev) => [...prev, char]);
      setNewCn("");
      setNewVi("");
    } catch {
      // handle error
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    try {
      await deleteCharacterMap(id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // handle error
    }
  };

  const handleDeleteChapter = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa chương này?")) return;
    try {
      await deleteChapter(id);
      setChapters((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert("Lỗi xóa chương: " + e.message);
    }
  };

  const handleRetranslateChapter = async (id: number) => {
    if (!confirm("Dịch lại chương này? Bản dịch cũ sẽ bị xóa.")) return;
    try {
      await retranslateChapter(id);
      setChapters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "translating" as const } : c))
      );
    } catch (e: any) {
      alert("Lỗi dịch lại chương: " + e.message);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("auto_translate", String(autoTranslate));
      await uploadChapters(novelId, formData);
      setFile(null);
      await loadData();
      setActiveTab("chapters");
    } catch (e: any) {
      alert("Lỗi tải lên: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteUpload = async () => {
    if (!pasteText.trim()) return;
    setIsUploading(true);
    try {
      await pasteChapters(novelId, { text: pasteText, auto_translate: autoTranslate });
      setPasteText("");
      await loadData();
      setActiveTab("chapters");
    } catch (e: any) {
      alert("Lỗi dán văn bản: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-10 w-64 mb-4" />
        <div className="skeleton h-6 w-40 mb-8" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl block mb-4">😢</span>
        <p style={{ color: "var(--color-text-secondary)" }}>Không tìm thấy truyện</p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2 rounded-xl text-sm font-medium"
          style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
        >
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  const progress = novel.total_chapters > 0
    ? Math.round((novel.translated_chapters / novel.total_chapters) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back + header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-medium mb-6 transition-colors hover:text-indigo-500"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← Danh sách truyện
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gradient-premium mb-3 leading-tight"
            >
              {novel.title}
            </h1>
            <p className="text-base sm:text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>
              ✍️ {novel.author}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap mt-2 sm:mt-0">
            {novel.status !== "translating" && (
              <button
                id="translate-btn"
                onClick={handleTranslate}
                disabled={translating}
                className="px-6 py-3 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 bg-gradient-premium shadow-card hover:shadow-hover hover:-translate-y-0.5"
              >
                {translating ? "⏳ Đang bắt đầu..." : "🤖 Dịch tất cả"}
              </button>
            )}
            <button
              id="delete-novel-btn"
              onClick={handleDelete}
              className="px-5 py-3 rounded-xl text-base font-bold transition-all hover:opacity-80 active:scale-95"
              style={{
                background: "rgba(239,68,68,0.08)",
                color: "var(--color-error)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              🗑️ Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="rounded-2xl p-6 mb-10 shadow-card"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold" style={{ color: "var(--color-text)" }}>
            📊 Tiến trình dịch
          </span>
          <span className="text-base font-bold" style={{ color: "var(--color-accent)" }}>
            {status?.translated_chapters ?? novel.translated_chapters} / {novel.total_chapters} ({progress}%)
          </span>
        </div>
        <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--color-bg-secondary)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--color-gradient-start), var(--color-gradient-end))",
            }}
          />
        </div>
        {novel.status === "translating" && status && (
          <p className="text-sm font-medium mt-3 animate-pulse" style={{ color: "var(--color-accent)" }}>
            🔄 Đang dịch... ({status.translating_chapters} chương đang xử lý)
          </p>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 sm:gap-2 mb-8 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto scrollbar-hide"
        style={{ background: "var(--color-bg-secondary)" }}
      >
        {(["chapters", "characters", "add_chapters"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 whitespace-nowrap ${activeTab === tab ? "bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-card" : "bg-transparent text-[var(--color-text-muted)] hover:bg-white/5"}`}
          >
            {tab === "chapters"
              ? `📄 Chương (${chapters.length})`
              : tab === "characters"
              ? `👤 Nhân vật (${characters.length})` // Note: fixed comma
              : `➕ Thêm Chương`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "chapters" ? (
        <ChapterList chapters={chapters} novelId={novelId} onDeleteChapter={handleDeleteChapter} onRetranslateChapter={handleRetranslateChapter} />
      ) : activeTab === "characters" ? (
        <div>
          {/* Add character form */}
          <div
            className="flex flex-col sm:flex-row gap-2 mb-5 p-4 rounded-xl"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <input
              type="text"
              value={newCn}
              onChange={(e) => setNewCn(e.target.value)}
              placeholder="Tên Trung (例: 张三)"
              className="input-base"
            />
            <input
              type="text"
              value={newVi}
              onChange={(e) => setNewVi(e.target.value)}
              placeholder="Tên Việt (例: Trương Tam)"
              className="input-base"
            />
            <button
              onClick={handleAddCharacter}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap bg-gradient-premium shadow-card"
            >
              + Thêm
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ background: "var(--color-bg-secondary)" }}>
              <span className="text-3xl block mb-2">👤</span>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Chưa có tên nhân vật. Thêm thủ công hoặc tự động phát hiện khi dịch.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{char.cn_name}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>→</span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>{char.vi_name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCharacter(char.id)}
                    className="text-sm px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.08)", color: "var(--color-error)" }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-6 md:p-8 rounded-[2rem] space-y-8 animate-fade-in shadow-card border border-[var(--color-border)]">
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-gradient-premium">Thêm hàng loạt bằng File (.txt, .docx)</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="file"
                accept=".txt,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="file-input block w-full sm:flex-1 text-sm file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-500/10 file:text-indigo-500 hover:file:bg-indigo-500/20 transition-all cursor-pointer bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-2"
              />
              <button
                onClick={handleFileUpload}
                disabled={!file || isUploading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:-translate-y-0.5 active:scale-95 bg-gradient-premium shadow-card hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                {isUploading ? "⏳ Đang tải..." : "📤 Tải File"}
              </button>
            </div>
            {file && <p className="text-sm font-medium text-emerald-500 ml-2">✓ Đã chọn: {file.name}</p>}
          </div>

          <div className="h-px w-full bg-slate-200 dark:bg-white/10" />

          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-gradient-premium">Hoặc Copy/Paste nội dung truyện</h3>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Dán nội dung các chương vào đây (AI sẽ tự động chia chương dựa vào các tiêu đề '第xxx章' hoặc 'Chapter N')."
              className="w-full h-80 rounded-[1.5rem] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 text-base font-medium resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-3">
                 <input
                   type="checkbox"
                   id="auto-trans"
                   checked={autoTranslate}
                   onChange={(e) => setAutoTranslate(e.target.checked)}
                   className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
                 />
                 <label htmlFor="auto-trans" className="text-base font-bold cursor-pointer opacity-90 select-none">
                   Tự động dịch nhanh sau khi thêm
                 </label>
              </div>
              <button
                onClick={handlePasteUpload}
                disabled={!pasteText.trim() || isUploading}
                className="px-10 py-3.5 rounded-xl font-bold text-base text-white transition-all disabled:opacity-50 hover:-translate-y-0.5 active:scale-95 bg-indigo-500 shadow-card hover:shadow-indigo-500/40"
              >
                {isUploading ? "⏳ Đang phân tích..." : "📥 Lưu Nội Dung Dán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
