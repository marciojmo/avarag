// components/NavBar.tsx
"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export default function NavBar() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        function onDocClick(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between gap-3 px-6 py-4 bg-black/80 backdrop-blur-lg border-b border-white/10">
            <Link href="/" className="text-lg sm:text-xl font-bold hover:opacity-80 transition-opacity bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AVA
            </Link>
            <div className="flex items-center gap-3" ref={menuRef} suppressHydrationWarning>
                {!mounted ? null : session?.user?.name ? (
                    <div className="relative">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                            onClick={() => setMenuOpen((v) => !v)}
                        >
                            {/* Avatar */}
                            <img
                                src={session.user.image || "/vercel.svg"}
                                alt={session.user.name || "Avatar"}
                                className="w-7 h-7 rounded-full object-cover border border-white/20"
                            />
                            {/* Name */}
                            <span className="text-sm sm:text-base max-w-[160px] truncate font-medium">
                                {session.user.name}
                            </span>
                            {/* Three dots */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-60">
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="19" cy="12" r="2" />
                            </svg>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-gray-900/95 backdrop-blur-lg shadow-xl overflow-hidden">
                                <Link
                                    href="/dashboard"
                                    className="block px-4 py-3 hover:bg-white/10 transition-colors font-medium"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors font-medium border-t border-white/10"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        signOut({ callbackUrl: "/" });
                                    }}
                                >
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Link href="/signup" className="px-4 py-2 font-medium hover:text-white/70 transition-colors hidden sm:block">
                            Inscrever-se
                        </Link>
                        <Link href="/login" className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all font-semibold shadow-lg shadow-violet-500/30">
                            Entrar
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}


