// app/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Chat from "@/components/Chat";
import Uploader from "@/components/Uploader";
import ScriptEditor from "@/components/ScriptEditor";

type Agent = {
    id: string;
    name: string;
    description: string;
    model: string;
};

export default function DashboardPage() {
    const [tab, setTab] = useState<"files" | "chat" | "script">("files");
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [loadingAgents, setLoadingAgents] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchAgents();
        }
    }, [status]);

    async function fetchAgents() {
        try {
            const res = await fetch("/api/agents");
            if (!res.ok) {
                console.error("Failed to fetch agents");
                return;
            }
            const data = await res.json();
            setAgents(data.agents);

            // Auto-select the first agent
            if (data.agents.length > 0) {
                setSelectedAgentId(data.agents[0].id);
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoadingAgents(false);
        }
    }

    async function copyShareableLink() {
        if (!selectedAgentId) return;

        const url = `${window.location.origin}/live-chat/${selectedAgentId}`;
        
        try {
            await navigator.clipboard.writeText(url);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error("Failed to copy link:", error);
        }
    }

    if (status === "loading" || loadingAgents) {
        return (
            <main className="min-h-[calc(100vh-57px)] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </main>
        );
    }

    if (status === "unauthenticated") {
        return null; // Will redirect via useEffect
    }

    return (
        <main className="min-h-[calc(100vh-57px)] p-4">
            {/* Shareable Link Section */}
            {selectedAgentId && (
                <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-blue-400 mb-1 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Public Chat Link
                            </h3>
                            <p className="text-xs text-white/60 mb-2">Share this link to let others chat with your agent</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-black/20 px-3 py-2 rounded text-white/80 break-all">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/live-chat/${selectedAgentId}` : ''}
                                </code>
                                <button
                                    onClick={copyShareableLink}
                                    className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-2"
                                >
                                    {copySuccess ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy Link
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs - visible on all screen sizes */}
            <div className="border-b border-white/10 mb-4">
                <div className="flex gap-2">
                    <button
                        className={`px-3 py-2 rounded-t ${tab === "files" ? "bg-white/10" : "hover:bg-white/10"}`}
                        onClick={() => setTab("files")}
                    >
                        Files
                    </button>
                    <button
                        className={`px-3 py-2 rounded-t ${tab === "chat" ? "bg-white/10" : "hover:bg-white/10"}`}
                        onClick={() => setTab("chat")}
                    >
                        Chat
                    </button>
                    <button
                        className={`px-3 py-2 rounded-t ${tab === "script" ? "bg-white/10" : "hover:bg-white/10"}`}
                        onClick={() => setTab("script")}
                    >
                        Script
                    </button>
                </div>
            </div>

            {agents.length === 0 ? (
                <section className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-white/70">No agent found.</p>
                        <p className="text-white/50 text-sm mt-2">Please contact support to create an agent.</p>
                    </div>
                </section>
            ) : (
                <>
                    {/* Full-width tab content for all screen sizes */}
                    {tab === "files" ? (
                        <section>
                            <div className="mb-4">
                                <Uploader agentId={selectedAgentId || undefined} />
                            </div>
                        </section>
                    ) : tab === "chat" ? (
                        <section className="h-[calc(100vh-57px-180px)]">
                            <Chat agentId={selectedAgentId || undefined} />
                        </section>
                    ) : (
                        <section className="h-[calc(100vh-57px-180px)]">
                            <ScriptEditor agentId={selectedAgentId || undefined} />
                        </section>
                    )}
                </>
            )}
        </main>
    );
}


