// components/Chat.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import ChatInput from "./ChatInput";

type ChatMessage = { role: "user" | "bot"; text: string };

// ========== LOCAL STORAGE HELPERS ==========
const STORAGE_KEY_PREFIX = "chat_history_";

function getStorageKey(agentId: string): string {
    return `${STORAGE_KEY_PREFIX}${agentId}`;
}

function loadChatHistory(agentId: string): ChatMessage[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(getStorageKey(agentId));
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Failed to load chat history:", error);
        return [];
    }
}

function saveChatHistory(agentId: string, messages: ChatMessage[]): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(getStorageKey(agentId), JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save chat history:", error);
    }
}

function clearChatHistory(agentId: string): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(getStorageKey(agentId));
    } catch (error) {
        console.error("Failed to clear chat history:", error);
    }
}

// ========== COMPONENT ==========
export default function Chat({ agentId }: { agentId?: string }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load chat history when agentId changes
    useEffect(() => {
        if (agentId) {
            const history = loadChatHistory(agentId);
            setMessages(history);
        } else {
            setMessages([]);
        }
    }, [agentId]);

    // Save chat history whenever messages change
    useEffect(() => {
        if (agentId && messages.length > 0) {
            saveChatHistory(agentId, messages);
        }
    }, [agentId, messages]);

    async function handleSend(text: string) {
        if (!agentId) {
            setMessages((prev) => [...prev, {
                role: "bot",
                text: "Error: No agent selected. Please select an agent first."
            }]);
            return;
        }

        // Add user message immediately
        setMessages((prev) => [...prev, { role: "user", text }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, agentId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to get response");
            }

            const data = await response.json();

            // Add bot response
            setMessages((prev) => [...prev, {
                role: "bot",
                text: data.response
            }]);
        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, {
                role: "bot",
                text: `Sorry, I encountered an error: ${error.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleClearHistory() {
        if (!agentId) return;

        if (confirm("Are you sure you want to clear the chat history?")) {
            clearChatHistory(agentId);
            setMessages([]);
        }
    }

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            })
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header with clear button */}
            {messages.length > 0 && (
                <div className="flex justify-end px-4 py-2 border-b border-white/10">
                    <button
                        onClick={handleClearHistory}
                        disabled={isLoading}
                        className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clear chat history"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear History
                    </button>
                </div>
            )}

            <div className="flex-1 p-2 w-full overflow-y-scroll" ref={chatContainerRef}>
                <div className="max-w-xl mx-auto flex flex-col">
                    {messages.length === 0 && (
                        <div className="flex items-center justify-center h-full text-white/50 text-sm">
                            Start a conversation by typing a message below
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <Message key={idx} role={msg.role} text={msg.text} />
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 p-4 text-white/70 text-sm">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Thinking...
                        </div>
                    )}
                </div>
            </div>

            <div className="relative isolate z-10 w-full basis-auto content-fade single-line">
                <div className="max-w-xl mx-auto flex flex-col">
                    <ChatInput onSend={handleSend} disabled={isLoading} />
                </div>
            </div>
        </div>
    );
}
