"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

// M3 small top app bar.
export default function NavBar() {
    const { data: session, status } = useSession();

    return (
        <header className="h-16 shrink-0 flex items-center justify-between gap-2 px-2 sm:px-4 bg-surface-container text-on-surface">
            <Link
                href="/"
                className="md-state flex items-center gap-2 h-12 px-3 rounded-full title-large text-on-surface"
                aria-label="AYDA home"
            >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand text-on-brand">
                    <span className="md-icon md-icon--filled md-icon--sm" aria-hidden="true">
                        forum
                    </span>
                </span>
                <span className="font-medium tracking-tight">AYDA</span>
            </Link>

            {status === "loading" ? null : session?.user ? (
                <nav className="flex items-center gap-1 min-w-0" aria-label="Account">
                    <Link href="/dashboard" className="md-state md-button md-button--text hidden sm:inline-flex">
                        Dashboard
                    </Link>
                    <div className="flex items-center gap-2 min-w-0 pl-2 pr-1">
                        {session.user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={session.user.image}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <span
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container label-large"
                                aria-hidden="true"
                            >
                                {session.user.name?.[0]?.toUpperCase() ?? "?"}
                            </span>
                        )}
                        <span className="hidden md:block body-medium text-on-surface-variant max-w-[180px] truncate">
                            {session.user.name}
                        </span>
                    </div>
                    <button
                        className="md-state md-icon-button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <span className="md-icon" aria-hidden="true">
                            logout
                        </span>
                    </button>
                </nav>
            ) : (
                <nav className="flex items-center gap-2" aria-label="Account">
                    <Link href="/signup" className="md-state md-button md-button--text hidden sm:inline-flex">
                        Sign up
                    </Link>
                    <Link href="/login" className="md-state md-button md-button--filled">
                        Sign in
                    </Link>
                </nav>
            )}
        </header>
    );
}
