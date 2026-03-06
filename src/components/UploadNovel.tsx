"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNovel } from "@/lib/api";

export default function CreateNovel() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title) { setError("Vui lòng nhập tên truyện"); return; }
    setCreating(true);
    setError("");
    try {
      const payload = {
        title: title,
        author: author || "Unknown",
        description: ""
      };
      const novel = await createNovel(payload);
      router.push(`/novel/${novel.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo mới thất bại. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in py-10 relative">
      {/* Background glow for this specific page component */}
      <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/20 rounded-[100%] blur-[120px] pointer-events-none opacity-50 dark:opacity-20" />

      {/* Header */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 text-gradient-premium">
          Tạo Tác Phẩm Mới
        </h1>
        <p className="text-lg sm:text-xl max-w-md mx-auto opacity-70 font-medium">
          Khởi tạo một bộ truyện mới vào thu viện. Sau đó, bạn có thể tải lên hoặc dán trực tiếp danh sách chương vào.
        </p>
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 sm:p-12 mb-8 shadow-card relative z-10">
        <div className="space-y-8 relative z-10">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-3 ml-2 opacity-70">
              Tên truyện <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vd: Ngạo Thế Cửu Trọng Thiên"
              className="input-base text-lg font-medium p-6"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-3 ml-2 opacity-70">
              Tác giả
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Vd: Phong Lăng Thiên Hạ"
              className="input-base text-lg font-medium p-6"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8 p-5 rounded-2xl text-base font-bold animate-slide-down bg-rose-500/10 text-rose-500 border border-rose-500/20 text-center">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={handleCreate}
        disabled={creating || !title}
        className="w-full py-5 sm:py-6 rounded-full font-extrabold tracking-wide text-white text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] bg-gradient-premium shadow-card hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] relative z-10 overflow-hidden group"
      >
        {creating ? (
          <>
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            ĐANG KHỞI TẠO TÁC PHẨM...
          </>
        ) : (
          <>
            <span className="group-hover:-translate-y-1 transition-transform duration-300 block">✦</span>
            TẠO TÁC PHẨM VÀ TIẾP TỤC
          </>
        )}
      </button>
    </div>
  );
}
