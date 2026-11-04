"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function NavBar() {
    const { data: session, status } = useSession();

    return (
        <nav className="h-14 shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-white/10 bg-[#212121]">
            <Link href="/" className="text-lg font-bold text-white hover:opacity-80">
                AVA
            </Link>

            {status === "loading" ? null : session?.user ? (
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href="/dashboard"
                        className="text-sm text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10"
                    >
                        Dashboard
                    </Link>
                    {session.user.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={session.user.image}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-white/20"
                        />
                    )}
                    <span className="hidden sm:block text-sm text-white/80 max-w-[180px] truncate">
                        {session.user.name}
                    </span>
                    <button
                        className="text-sm text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10"
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        Sair
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Link
                        href="/signup"
                        className="hidden sm:block text-sm font-medium text-white/80 hover:text-white px-3 py-1.5"
                    >
                        Inscrever-se
                    </Link>
                    <Link
                        href="/login"
                        className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                    >
                        Entrar
                    </Link>
                </div>
            )}
        </nav>
    );
}
