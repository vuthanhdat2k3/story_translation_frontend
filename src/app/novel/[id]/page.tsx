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
  crawlLatestChapter,
  crawlSpecificChapter,
  crawlChapterRange,
  updateNovel,
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
  const [isCrawlingLatest, setIsCrawlingLatest] = useState(false);
  const [crawlChapterNum, setCrawlChapterNum] = useState("");
  const [isCrawlingSpecific, setIsCrawlingSpecific] = useState(false);
  const [crawlStartNum, setCrawlStartNum] = useState("");
  const [crawlEndNum, setCrawlEndNum] = useState("");
  const [isCrawlingRange, setIsCrawlingRange] = useState(false);
  const [crawlSourceUrl, setCrawlSourceUrl] = useState("");
  const [crawlPrefix, setCrawlPrefix] = useState("");
  const [pagesPerChapter, setPagesPerChapter] = useState("2");
  const [isSavingSourceUrl, setIsSavingSourceUrl] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [novelData, chaptersData, statusData, charsData] = await Promise.all([
        fetchNovel(novelId),
        fetchChapters(novelId),
        fetchTranslationStatus(novelId).catch(() => null),
        fetchCharacterMaps(novelId).catch(() => ({ characters: [], total: 0 })),
      ]);
      setNovel(novelData);
      setCrawlSourceUrl(novelData.source_url ?? "");
      setCrawlPrefix(novelData.crawl_prefix ?? "");
      setPagesPerChapter(String(novelData.pages_per_chapter || 2));
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

  const handleCrawlLatest = async () => {
    setIsCrawlingLatest(true);
    try {
      const result = await crawlLatestChapter(novelId, {
        auto_translate: true,
        source_url: crawlSourceUrl.trim() || undefined,
        prefix: crawlPrefix.trim() || undefined,
        pages_per_chapter: Number(pagesPerChapter) > 0 ? Number(pagesPerChapter) : 1,
      });
      await loadData();

      alert(
        `${result.created ? "Da them" : "Da cap nhat"} chuong ${result.chapter_number}. ` +
          `${result.translation_started ? "Da bat dau dich." : ""}`
      );

      const poll = setInterval(async () => {
        try {
          const updated = await fetchChapters(novelId);
          const chapter = updated.chapters.find((c) => c.id === result.chapter_id);
          setChapters(updated.chapters);
          if (chapter && chapter.status !== "translating") {
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 3000);
    } catch (e: any) {
      alert("Loi crawl chuong moi nhat: " + e.message);
    } finally {
      setIsCrawlingLatest(false);
    }
  };

  const handleCrawlSpecific = async () => {
    const num = Number(crawlChapterNum);
    if (!Number.isInteger(num) || num < 1) {
      alert("Vui long nhap so chuong hop le.");
      return;
    }
    setIsCrawlingSpecific(true);
    try {
      const result = await crawlSpecificChapter(novelId, num, {
        auto_translate: true,
        source_url: crawlSourceUrl.trim() || undefined,
        prefix: crawlPrefix.trim() || undefined,
        pages_per_chapter: Number(pagesPerChapter) > 0 ? Number(pagesPerChapter) : 1,
      });
      await loadData();
      alert(
        `${result.created ? "Da them" : "Da cap nhat"} chuong ${result.chapter_number}. ` +
          `${result.translation_started ? "Da bat dau dich." : ""}`
      );
      setCrawlChapterNum("");

      const poll = setInterval(async () => {
        try {
          const updated = await fetchChapters(novelId);
          const chapter = updated.chapters.find((c) => c.id === result.chapter_id);
          setChapters(updated.chapters);
          if (chapter && chapter.status !== "translating") {
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 3000);
    } catch (e: any) {
      alert("Loi crawl chuong: " + e.message);
    } finally {
      setIsCrawlingSpecific(false);
    }
  };

  const handleCrawlRange = async () => {
    const start = Number(crawlStartNum);
    const end = Number(crawlEndNum);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1 || start > end) {
      alert("Vui long nhap khoang chuong hop le (tu <= den, va >= 1).");
      return;
    }

    setIsCrawlingRange(true);
    try {
      const result = await crawlChapterRange(novelId, {
        start_chapter: start,
        end_chapter: end,
        auto_translate: true,
        source_url: crawlSourceUrl.trim() || undefined,
        prefix: crawlPrefix.trim() || undefined,
        pages_per_chapter: Number(pagesPerChapter) > 0 ? Number(pagesPerChapter) : 1,
      });
      await loadData();

      const failedItems = result.results.filter((item) => !item.ok);
      const failedPreview = failedItems
        .slice(0, 3)
        .map((item) => `chuong ${item.chapter_number}: ${item.error}`)
        .join("\n");

      alert(
        `Da crawl xong ${result.start_chapter}-${result.end_chapter}. ` +
          `Thanh cong: ${result.success_count}, that bai: ${result.failed_count}.` +
          (failedPreview ? `\n\nLoi mau:\n${failedPreview}` : "")
      );
      setCrawlStartNum("");
      setCrawlEndNum("");
    } catch (e: any) {
      alert("Loi crawl nhieu chuong: " + e.message);
    } finally {
      setIsCrawlingRange(false);
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

  const handleSaveCrawlSourceUrl = async () => {
    if (!novel) return;
    setIsSavingSourceUrl(true);
    try {
      const updated = await updateNovel(novelId, {
        source_url: crawlSourceUrl.trim() || null,
        crawl_prefix: crawlPrefix.trim() || null,
        pages_per_chapter: Number(pagesPerChapter) > 0 ? Number(pagesPerChapter) : 1,
      });
      setNovel(updated);
      setCrawlSourceUrl(updated.source_url ?? "");
      setCrawlPrefix(updated.crawl_prefix ?? "");
      setPagesPerChapter(String(updated.pages_per_chapter || 2));
      alert("Da luu URL crawl cho tac pham.");
    } catch (e: any) {
      alert("Loi luu URL crawl: " + e.message);
    } finally {
      setIsSavingSourceUrl(false);
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
      // Poll until this chapter finishes translating
      const poll = setInterval(async () => {
        try {
          const updated = await fetchChapters(novelId);
          const chapter = updated.chapters.find((c) => c.id === id);
          if (chapter && chapter.status !== "translating") {
            setChapters(updated.chapters);
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 3000);
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
      <div className="max-w-4xl mx-auto w-full">
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
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
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
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gradient-premium mb-3 leading-tight break-words"
            >
              {novel.title}
            </h1>
            <p className="text-base sm:text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>
              ✍️ {novel.author}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap mt-4 sm:w-auto w-full">
            {novel.status !== "translating" && (
              <button
                id="translate-btn"
                onClick={handleTranslate}
                disabled={translating}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 bg-gradient-premium shadow-card hover:shadow-hover hover:-translate-y-0.5 text-center"
              >
                {translating ? "⏳ Đang bắt đầu..." : "🤖 Dịch tất cả"}
              </button>
            )}
            <button
              id="crawl-latest-btn"
              onClick={handleCrawlLatest}
              disabled={isCrawlingLatest}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-base font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 text-center"
              style={{
                background: "rgba(14,165,233,0.12)",
                color: "#0284c7",
                border: "1px solid rgba(14,165,233,0.3)",
              }}
            >
              {isCrawlingLatest ? "Dang crawl..." : "Crawl chuong moi nhat"}
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <input
                type="number"
                min={1}
                value={crawlChapterNum}
                onChange={(e) => setCrawlChapterNum(e.target.value)}
                placeholder="Số chương"
                className="w-full sm:w-28 px-4 py-3 rounded-xl text-sm font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 min-w-0"
              />
              <button
                onClick={handleCrawlSpecific}
                disabled={isCrawlingSpecific || !crawlChapterNum}
                className="w-full sm:w-auto px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 whitespace-nowrap text-center"
                style={{
                  background: "rgba(14,165,233,0.12)",
                  color: "#0284c7",
                  border: "1px solid rgba(14,165,233,0.3)",
                }}
              >
                {isCrawlingSpecific ? "Đang crawl..." : "Crawl chương này"}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  min={1}
                  value={crawlStartNum}
                  onChange={(e) => setCrawlStartNum(e.target.value)}
                  placeholder="Từ"
                  className="flex-1 sm:w-20 px-4 py-3 rounded-xl text-sm font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 min-w-0"
                />
                <input
                  type="number"
                  min={1}
                  value={crawlEndNum}
                  onChange={(e) => setCrawlEndNum(e.target.value)}
                  placeholder="Đến"
                  className="flex-1 sm:w-20 px-4 py-3 rounded-xl text-sm font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 min-w-0"
                />
              </div>
              <button
                onClick={handleCrawlRange}
                disabled={isCrawlingRange || !crawlStartNum || !crawlEndNum}
                className="w-full sm:w-auto px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 whitespace-nowrap text-center"
                style={{
                  background: "rgba(14,165,233,0.12)",
                  color: "#0284c7",
                  border: "1px solid rgba(14,165,233,0.3)",
                }}
              >
                {isCrawlingRange ? "Đang crawl..." : "Crawl nhiều"}
              </button>
            </div>
            <button
              id="delete-novel-btn"
              onClick={handleDelete}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-base font-bold transition-all hover:opacity-80 active:scale-95 text-center"
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
        className="rounded-2xl p-6 mb-6 shadow-card"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              URL crawl của tác phẩm
            </label>
            <input
              type="url"
              value={crawlSourceUrl}
              onChange={(e) => setCrawlSourceUrl(e.target.value)}
              placeholder="https://www.novel543.com/..."
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <input
                type="text"
                value={crawlPrefix}
                onChange={(e) => setCrawlPrefix(e.target.value)}
                placeholder="Prefix crawl, VD: 8002"
                className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
              <input
                type="number"
                min={1}
                value={pagesPerChapter}
                onChange={(e) => setPagesPerChapter(e.target.value)}
                placeholder="So trang / chapter"
                className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
          </div>
          <button
            onClick={handleSaveCrawlSourceUrl}
            disabled={isSavingSourceUrl}
            className="w-full md:w-auto px-5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 whitespace-nowrap text-center"
            style={{
              background: "rgba(14,165,233,0.12)",
              color: "#0284c7",
              border: "1px solid rgba(14,165,233,0.3)",
            }}
          >
            {isSavingSourceUrl ? "Dang luu..." : "Luu URL crawl"}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          Nút crawl sẽ dùng URL, prefix và so trang/chapter theo tung truyen. Co the de trong URL/prefix de backend tu detect.
        </p>
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
