"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Trang chủ" },
    { href: "/upload", label: "Upload" },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 p-4 sm:p-6 transition-all duration-300 pointer-events-none">
      <div className="max-w-5xl mx-auto w-full pointer-events-auto">
        <div className="glass-card rounded-2xl sm:rounded-full px-4 sm:px-6 h-16 flex items-center justify-between shadow-premium transition-all duration-500 animate-slide-down">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-card transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-premium">
              <span className="animate-float" style={{ animationDuration: '4s' }}>📖</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-extrabold tracking-tight leading-none text-gradient-premium">StoryTrans</p>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] mt-1 opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                AI Studio
              </p>
            </div>
          </Link>

          {/* Nav links + toggle */}
          <div className="flex items-center gap-1 sm:gap-3">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-bold transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden ${
                    active ? "text-white shadow-md shadow-indigo-500/20" : "hover:bg-indigo-500/10"
                  }`}
                  style={{ color: active ? "#ffffff" : "var(--color-text-secondary)" }}
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-premium -z-10 animate-fade-in" />
                  )}
                  {link.label}
                </Link>
              );
            })}
            <div className="w-px h-6 mx-1 sm:mx-2 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

