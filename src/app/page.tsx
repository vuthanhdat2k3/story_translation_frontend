"use client";

import { useEffect, useState } from "react";
import { fetchNovels } from "@/lib/api";
import { Novel } from "@/types";
import NovelCard from "@/components/NovelCard";
import Link from "next/link";

export default function HomePage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadNovels(); }, []);

  const loadNovels = async () => {
    try {
      setLoading(true);
      const data = await fetchNovels();
      setNovels(data.novels);
    } catch {
      setError("Không thể tải danh sách truyện. Kiểm tra kết nối backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 -translate-y-[20%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none opacity-50 dark:opacity-30" />
      <div className="absolute top-40 right-0 -z-10 translate-x-1/3 w-[400px] h-[400px] bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none opacity-40 dark:opacity-20 translate-y-20 animate-float" style={{ animationDuration: '8s' }} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="text-center w-full max-w-4xl mb-20 sm:mb-28 pt-8">
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-8 border border-indigo-500/20 bg-indigo-500/5 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] animate-pulse-glow">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Powered by Gemini AI
        </span>

        <h1 className="text-5xl sm:text-6xl md:text-[5rem] font-extrabold tracking-tight mb-8 leading-[1.1] drop-shadow-sm">
          Welcome to <br />
          <span className="text-gradient-premium">StoryTrans</span>
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl mb-12 leading-relaxed opacity-80 max-w-2xl mx-auto px-4 font-medium" style={{ color: "var(--color-text)" }}>
          Dịch truyện Trung Quốc sang tiếng Việt tự động bằng Trí Tuệ Nhân Tạo. Nhanh chóng, tự nhiên, giữ nguyên phong thái.
        </p>

        <Link
          href="/upload"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-white text-lg transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-premium shadow-premium hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] group"
        >
          <span className="group-hover:-translate-y-1 transition-transform duration-300">📤</span> 
          Upload tác phẩm mới
        </Link>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      {!loading && novels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20 w-full max-w-4xl px-4 animate-slide-down" style={{ animationDelay: "150ms" }}>
          {[
            { value: novels.length,                                               label: "Tổng truyện",  icon: "📚" },
            { value: novels.reduce((a, n) => a + n.total_chapters, 0),           label: "Tổng chương",  icon: "📄" },
            { value: novels.filter((n) => n.status === "completed").length,       label: "Đã hoàn thành",icon: "✨" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="glass-card text-center py-8 px-6 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-hover relative overflow-hidden group"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-premium opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{s.icon}</div>
              <div className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 text-gradient-premium">
                {s.value}
              </div>
              <div className="text-sm font-bold uppercase tracking-widest opacity-70">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Novel grid ────────────────────────────────────── */}
      <div className="w-full">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-3xl" />)}
          </div>
        ) : error ? (
          <div className="glass-card text-center py-20 px-6 max-w-2xl mx-auto rounded-3xl shadow-card border border-rose-500/20">
            <span className="text-6xl mb-6 block animate-bounce">⚠️</span>
            <p className="text-lg font-medium mb-8 text-rose-500">{error}</p>
            <button
              onClick={loadNovels}
              className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white"
            >
              Thử lại ngay
            </button>
          </div>
        ) : novels.length === 0 ? (
          <div className="glass-card text-center py-24 sm:py-32 px-6 rounded-[2.5rem] max-w-3xl mx-auto transition-colors duration-300 flex flex-col items-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center mb-8 bg-[var(--color-bg-secondary)] shadow-inner">
              <span className="text-5xl sm:text-6xl drop-shadow-sm">📚</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Thư viện trống</h2>
            <p className="text-base sm:text-lg mb-10 max-w-md mx-auto opacity-70 font-medium">
              Chưa có truyện nào trong hệ thống. Upload tác phẩm tiếng Trung đầu tiên để trải nghiệm công nghệ AI dịch siêu tốc.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 bg-[var(--color-accent)] text-white shadow-md hover:shadow-lg"
            >
              📤 Bắt đầu ngay
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Thư Viện Tác Phẩm</h2>
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500">Mới cập nhật</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
              {novels.map((novel, index) => (
                <NovelCard key={novel.id} novel={novel} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
