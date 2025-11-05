// app/live-chat/[agentId]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Chat from "@/components/Chat";

type Agent = {
    id: string;
    name: string;
    description: string;
    model: string;
};

export default function PublicChatPage() {
    const params = useParams();
    const agentId = params.agentId as string;
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAgent() {
            try {
                const res = await fetch(`/api/public/agents/${agentId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError("Agent not found");
                    } else {
                        setError("Failed to load agent");
                    }
                    return;
                }
                const data = await res.json();
                setAgent(data.agent);
            } catch (err) {
                setError("Failed to load agent");
            } finally {
                setLoading(false);
            }
        }

        if (agentId) {
            fetchAgent();
        }
    }, [agentId]);

    if (loading) {
        return (
            <main className="min-h-[calc(100vh-57px)] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </main>
        );
    }

    if (error || !agent) {
        return (
            <main className="min-h-[calc(100vh-57px)] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 text-lg mb-2">{error || "Agent not found"}</div>
                    <p className="text-white/50 text-sm">Please check the link and try again.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-57px)] p-4">
            {/* Agent Header */}
            <div className="max-w-4xl mx-auto mb-4">
                <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                    <h1 className="text-xl font-semibold text-white mb-1">{agent.name}</h1>
                    {agent.description && (
                        <p className="text-sm text-white/60">{agent.description}</p>
                    )}
                </div>
            </div>

            {/* Chat Interface */}
            <section className="h-[calc(100vh-57px-120px)] max-w-4xl mx-auto">
                <Chat agentId={agentId} isPublic={true} />
            </section>
        </main>
    );
}

