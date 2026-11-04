"use client";
import { useState } from "react";
import Chat from "@/components/Chat";
import ShareLink from "@/components/ShareLink";
import Uploader from "@/components/Uploader";

// Access is enforced by src/middleware.ts.
export default function DashboardPage() {
    const [filesOpen, setFilesOpen] = useState(false);

    return (
        <main className="flex h-full">
            <aside
                className={`${filesOpen ? "flex" : "hidden"} md:flex flex-col w-full md:w-72 shrink-0 border-r border-white/10 bg-[#181818] p-3 absolute md:static inset-0 z-20`}
            >
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-white/80">Seus arquivos</h2>
                    <button
                        className="md:hidden text-sm text-white/60 hover:text-white px-2 py-1"
                        onClick={() => setFilesOpen(false)}
                    >
                        Fechar
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    <Uploader />
                </div>
                <div className="pt-3">
                    <ShareLink />
                </div>
            </aside>

            <section className="flex-1 flex flex-col min-w-0">
                <button
                    className="md:hidden self-start m-3 mb-0 text-sm text-white/70 border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/5"
                    onClick={() => setFilesOpen(true)}
                >
                    Arquivos
                </button>
                <Chat />
            </section>
        </main>
    );
}
