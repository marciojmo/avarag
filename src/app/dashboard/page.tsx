// app/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Chat from "@/components/Chat";
import Uploader from "@/components/Uploader";

type Agent = {
    id: string;
    name: string;
    description: string;
    model: string;
};

export default function DashboardPage() {
    const [tab, setTab] = useState<"files" | "chat">("files");
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [loadingAgents, setLoadingAgents] = useState(true);
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
            {/* Tabs - visible only on mobile/tablet */}
            <div className="border-b border-white/10 mb-4 lg:hidden">
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
                    {/* Mobile/Tablet: Tab-based layout */}
                    <div className="lg:hidden">
                        {tab === "files" ? (
                            <section>
                                <div className="mb-4">
                                    <Uploader agentId={selectedAgentId || undefined} />
                                </div>
                            </section>
                        ) : (
                            <section className="h-[calc(100vh-57px-56px)]">
                                <Chat agentId={selectedAgentId || undefined} />
                            </section>
                        )}
                    </div>

                    {/* Desktop: Two-column layout */}
                    <div className="hidden lg:flex lg:gap-4 h-[calc(100vh-57px-32px)]">
                        {/* Files Section - 1/3 width */}
                        <section className="w-1/3 overflow-y-auto pr-2">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-white mb-3">Files</h2>
                                <Uploader agentId={selectedAgentId || undefined} />
                            </div>
                        </section>

                        {/* Chat Section - 2/3 width */}
                        <section className="w-2/3 border-l border-white/10 pl-4">
                            <h2 className="text-lg font-semibold text-white mb-3">Chat</h2>
                            <div className="h-[calc(100%-40px)]">
                                <Chat agentId={selectedAgentId || undefined} />
                            </div>
                        </section>
                    </div>
                </>
            )}
        </main>
    );
}


