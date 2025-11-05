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
        <nav className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
            <Link href="/" className="text-sm sm:text-base font-medium hover:underline underline-offset-4">
                AVA - Assistente Virtual de Atendimento
            </Link>
            <div className="flex items-center gap-3" ref={menuRef} suppressHydrationWarning>
                {!mounted ? null : session?.user?.name ? (
                    <div className="relative">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10"
                            onClick={() => setMenuOpen((v) => !v)}
                        >
                            {/* Avatar */}
                            <img
                                src={session.user.image || "/vercel.svg"}
                                alt={session.user.name || "Avatar"}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                            {/* Name */}
                            <span className="text-sm sm:text-base max-w-[160px] truncate">
                                {session.user.name}
                            </span>
                            {/* Three dots */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-80">
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="19" cy="12" r="2" />
                            </svg>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-40 rounded border border-white/10 bg-[#2a2a2a] shadow-lg">
                                <Link
                                    href="/dashboard"
                                    className="block px-3 py-2 hover:bg-white/10"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    className="w-full text-left px-3 py-2 hover:bg-white/10"
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
                        <Link href="/signup" className="px-3 py-1.5 hover:text-white/60">Inscrever-se</Link>
                        <Link href="/login" className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">Entrar</Link>
                    </>
                )}
            </div>
        </nav>
    );
}


