"use client";
import { useEffect, useRef, useState } from "react";
import Message, { type ChatMessage } from "./Message";
import ChatInput from "./ChatInput";

function loadHistory(storageKey: string): ChatMessage[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveHistory(storageKey: string, messages: ChatMessage[]) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
        // Storage unavailable (private mode, quota): history just isn't kept.
    }
}

type ChatProps = {
    /** API route that answers; it must stream text and may set X-Sources. */
    endpoint?: string;
    /** Extra fields sent with every question (e.g. the share-link owner). */
    extraBody?: Record<string, string>;
    /** localStorage key for this conversation's history. */
    storageKey?: string;
    emptyTitle?: string;
    emptyDescription?: string;
};

export default function Chat({
    endpoint = "/api/chat",
    extraBody,
    storageKey = "chat_history",
    emptyTitle = "Pergunte sobre seus documentos",
    emptyDescription = "Envie arquivos PDF, TXT, Markdown ou MP3 e faça perguntas sobre o conteúdo.",
}: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages(loadHistory(storageKey));
        setLoaded(true);
    }, [storageKey]);

    // Persist once a reply has finished streaming.
    useEffect(() => {
        if (loaded && !loading) saveHistory(storageKey, messages);
    }, [loaded, loading, messages, storageKey]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    function updateLast(update: (m: ChatMessage) => ChatMessage) {
        setMessages((prev) => [...prev.slice(0, -1), update(prev[prev.length - 1])]);
    }

    async function handleSend(text: string) {
        const history = messages
            .filter((m) => m.text && !m.error)
            .map((m) => ({ role: m.role, content: m.text }));

        setMessages((prev) => [...prev, { role: "user", text }, { role: "assistant", text: "" }]);
        setLoading(true);

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...extraBody, message: text, history }),
            });
            if (!res.ok || !res.body) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || `Erro ${res.status}`);
            }

            const sourcesHeader = res.headers.get("X-Sources");
            const sources: string[] = sourcesHeader
                ? JSON.parse(decodeURIComponent(sourcesHeader))
                : [];

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                updateLast((m) => ({ ...m, text: m.text + chunk }));
            }
            updateLast((m) => ({ ...m, sources }));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            updateLast((m) => ({ ...m, text: `Não foi possível responder: ${message}`, error: true }));
        } finally {
            setLoading(false);
        }
    }

    function handleClear() {
        if (!confirm("Apagar o histórico desta conversa?")) return;
        setMessages([]);
    }

    const waitingFirstToken = loading && messages[messages.length - 1]?.text === "";

    return (
        <div className="flex flex-col h-full w-full">
            {messages.length > 0 && (
                <div className="flex justify-end px-4 py-2">
                    <button
                        onClick={handleClear}
                        disabled={loading}
                        className="text-xs text-white/50 hover:text-white/80 px-2 py-1 rounded hover:bg-white/5 disabled:opacity-50"
                    >
                        Nova conversa
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-4" ref={scrollRef}>
                <div className="max-w-3xl mx-auto flex flex-col">
                    {messages.length === 0 ? (
                        <div className="text-center text-white/60 mt-24">
                            <h2 className="text-2xl font-semibold text-white mb-2">{emptyTitle}</h2>
                            <p className="text-sm">{emptyDescription}</p>
                        </div>
                    ) : (
                        messages.map((msg, i) =>
                            waitingFirstToken && i === messages.length - 1 ? (
                                <div key={i} className="my-4 text-white/60 text-sm animate-pulse">
                                    Pensando…
                                </div>
                            ) : (
                                <Message key={i} message={msg} />
                            )
                        )
                    )}
                </div>
            </div>

            <div className="max-w-3xl w-full mx-auto">
                <ChatInput onSend={handleSend} disabled={loading} />
            </div>
        </div>
    );
}
