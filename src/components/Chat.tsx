"use client";
import { useEffect, useRef, useState } from "react";
import Message, { type ChatMessage } from "./Message";
import ChatInput from "./ChatInput";
import { useConfirm } from "./ConfirmDialog";

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
    /** Extra controls shown at the start of the chat's toolbar row. */
    toolbarStart?: React.ReactNode;
};

export default function Chat({
    endpoint = "/api/chat",
    extraBody,
    storageKey = "chat_history",
    emptyTitle = "Ask about your documents",
    emptyDescription = "Upload PDF, TXT, Markdown or MP3 files and ask questions about their content.",
    toolbarStart,
}: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { confirm, dialog } = useConfirm();

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
                throw new Error(data?.error || `Error ${res.status}`);
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
            updateLast((m) => ({ ...m, text: `Couldn't answer: ${message}`, error: true }));
        } finally {
            setLoading(false);
        }
    }

    async function handleClear() {
        const ok = await confirm({
            icon: "add_comment",
            title: "Start a new chat?",
            body: "This clears the current conversation's history.",
            confirmLabel: "New chat",
        });
        if (ok) setMessages([]);
    }

    const waitingFirstToken = loading && messages[messages.length - 1]?.text === "";

    return (
        <div className="flex flex-col h-full w-full">
            {(toolbarStart || messages.length > 0) && (
                <div className="flex items-center justify-between gap-2 max-w-3xl w-full mx-auto px-4 pt-3">
                    <div>{toolbarStart}</div>
                    {messages.length > 0 && (
                        <button onClick={handleClear} disabled={loading} className="md-state md-button md-button--text">
                            <span className="md-icon" aria-hidden="true">
                                add_comment
                            </span>
                            New chat
                        </button>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-4" ref={scrollRef}>
                <div className="max-w-3xl mx-auto flex flex-col">
                    {messages.length === 0 ? (
                        <div className="text-center mt-20 sm:mt-28 px-4">
                            <span className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-[20px] bg-brand text-on-brand">
                                <span className="md-icon" aria-hidden="true">
                                    chat
                                </span>
                            </span>
                            <h2 className="headline-small text-on-surface mb-2">{emptyTitle}</h2>
                            <p className="body-medium text-on-surface-variant max-w-md mx-auto">{emptyDescription}</p>
                        </div>
                    ) : (
                        messages.map((msg, i) =>
                            waitingFirstToken && i === messages.length - 1 ? (
                                <div key={i} className="my-4 w-full max-w-xs" role="status">
                                    <p className="body-medium text-on-surface-variant mb-2">Thinking…</p>
                                    <div className="md-linear-progress" aria-hidden="true" />
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
            {dialog}
        </div>
    );
}
