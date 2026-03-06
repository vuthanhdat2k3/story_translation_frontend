import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "StoryTrans - AI Novel Translation",
  description:
    "Dịch truyện Trung Quốc sang tiếng Việt bằng AI Gemini. Đọc truyện online miễn phí với chất lượng dịch tự nhiên.",
  keywords: ["dịch truyện", "trung việt", "AI translation", "gemini", "novel reader"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen selection:bg-indigo-500/30">
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 flex flex-col relative z-0">
          {children}
        </main>
        
        <footer className="w-full border-t border-white/5 mt-auto py-10 relative z-10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-sm font-medium tracking-wide opacity-60 flex items-center justify-center gap-2">
              Built with <span className="animate-pulse">💜</span> using Next.js &amp; Gemini
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
