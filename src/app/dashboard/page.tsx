"use client";
import { useEffect, useState } from "react";
import Chat from "@/components/Chat";
import ShareLink from "@/components/ShareLink";
import Uploader from "@/components/Uploader";

// Access is enforced by src/middleware.ts.
export default function DashboardPage() {
    const [filesOpen, setFilesOpen] = useState(false);

    // Escape closes the modal file sheet on compact screens.
    useEffect(() => {
        if (!filesOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFilesOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [filesOpen]);

    return (
        <main className="flex h-full">
            {/* Scrim for the modal sheet on compact screens */}
            {filesOpen && (
                <div
                    className="md:hidden absolute inset-0 z-10 bg-scrim/32"
                    onClick={() => setFilesOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Standard side sheet on medium+, modal sheet on compact */}
            <aside
                aria-label="Your files"
                className={`${filesOpen ? "flex" : "hidden"} md:flex flex-col w-[min(360px,calc(100%-56px))] md:w-80 shrink-0 bg-surface-container-low p-4 absolute md:static inset-y-0 left-0 z-20 rounded-r-[16px] md:rounded-none`}
            >
                <div className="flex items-center justify-between h-10 mb-3 pl-1">
                    <h2 className="title-medium text-on-surface-variant">Your files</h2>
                    <button
                        className="md-state md-icon-button md:hidden"
                        onClick={() => setFilesOpen(false)}
                        aria-label="Close files"
                    >
                        <span className="md-icon" aria-hidden="true">
                            close
                        </span>
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    <Uploader />
                </div>
                <div className="pt-4">
                    <ShareLink />
                </div>
            </aside>

            <section className="flex-1 flex flex-col min-w-0">
                <Chat
                    toolbarStart={
                        <button
                            className="md-state md-button md-button--tonal md:hidden"
                            onClick={() => setFilesOpen(true)}
                        >
                            <span className="md-icon" aria-hidden="true">
                                folder_open
                            </span>
                            Files
                        </button>
                    }
                />
            </section>
        </main>
    );
}
