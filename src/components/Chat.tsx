// components/Chat.tsx - State Machine Based Chat
"use client";
import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import ChatInput from "./ChatInput";

type ChatMessage = { role: "user" | "bot"; text: string };

// ========== LOCAL STORAGE HELPERS ==========
const STORAGE_KEY_PREFIX = "chat_history_";
const STATE_KEY_PREFIX = "chat_state_";

function getStorageKey(agentId: string): string {
    return `${STORAGE_KEY_PREFIX}${agentId}`;
}

function getStateKey(agentId: string): string {
    return `${STATE_KEY_PREFIX}${agentId}`;
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

function loadCurrentState(agentId: string): number {
    if (typeof window === "undefined") return 0;

    try {
        const stored = localStorage.getItem(getStateKey(agentId));
        if (!stored) return 0;

        const stateIndex = parseInt(stored);
        return isNaN(stateIndex) ? 0 : stateIndex;
    } catch (error) {
        console.error("Failed to load current state:", error);
        return 0;
    }
}

function saveCurrentState(agentId: string, stateIndex: number): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(getStateKey(agentId), stateIndex.toString());
    } catch (error) {
        console.error("Failed to save current state:", error);
    }
}

function clearChatHistory(agentId: string): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(getStorageKey(agentId));
        localStorage.removeItem(getStateKey(agentId));
    } catch (error) {
        console.error("Failed to clear chat history:", error);
    }
}

// ========== COMPONENT ==========
export default function Chat({ agentId, isPublic = false }: { agentId?: string; isPublic?: boolean }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStateIndex, setCurrentStateIndex] = useState(0);
    const [currentStateName, setCurrentStateName] = useState("Initial");
    const [isConversationEnded, setIsConversationEnded] = useState(false);
    const [reengageAttempts, setReengageAttempts] = useState(0); // Track re-engagement attempts
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const MAX_REENGAGE_ATTEMPTS = 3;

    // Load chat history and state when agentId changes
    useEffect(() => {
        if (agentId) {
            const history = loadChatHistory(agentId);
            const stateIndex = loadCurrentState(agentId);
            setMessages(history);
            setCurrentStateIndex(stateIndex);
            setIsConversationEnded(false);
            setReengageAttempts(0); // Reset re-engage attempts for new agent
        } else {
            setMessages([]);
            setCurrentStateIndex(0);
            setIsConversationEnded(false);
            setReengageAttempts(0);
        }
    }, [agentId]);

    // Save chat history whenever messages change
    useEffect(() => {
        if (agentId && messages.length > 0) {
            saveChatHistory(agentId, messages);
        }
    }, [agentId, messages]);

    // Save current state whenever it changes
    useEffect(() => {
        if (agentId) {
            saveCurrentState(agentId, currentStateIndex);
        }
    }, [agentId, currentStateIndex]);

    // Auto-retry mechanism: Send a contextual follow-up message if user doesn't respond
    useEffect(() => {
        // Clear any existing timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }

        // Don't set retry if:
        // - No agent selected
        // - Conversation has ended
        // - Currently loading
        // - No messages yet
        // - Maximum re-engage attempts reached
        const lastMessage = messages[messages.length - 1];
        if (!agentId || isConversationEnded || isLoading || messages.length === 0 || reengageAttempts >= MAX_REENGAGE_ATTEMPTS) {
            if (reengageAttempts >= MAX_REENGAGE_ATTEMPTS) {
                console.log(`🛑 Maximum re-engagement attempts (${MAX_REENGAGE_ATTEMPTS}) reached. Waiting for user input.`);
            }
            return;
        }

        // Only set retry after bot messages (waiting for user response)
        if (lastMessage?.role !== 'bot') {
            return;
        }

        // Calculate dynamic retry delay with exponential backoff
        const calculateRetryDelay = (messageText: string, attemptNumber: number): number => {
            const sentenceCount = (messageText.match(/[.!?]+/g) || []).length;

            // Base delay: 15 seconds
            // Add 2 seconds per sentence (up to max 30 seconds)
            const baseDelay = 15000;
            const sentenceDelay = Math.min(sentenceCount * 2000, 30000);
            const messageDelay = baseDelay + sentenceDelay;

            // Exponential backoff: multiply by 2^attemptNumber
            // Attempt 0: 1x, Attempt 1: 2x, Attempt 2: 4x
            const backoffMultiplier = Math.pow(2, attemptNumber);

            return messageDelay * backoffMultiplier;
        };

        const retryDelay = calculateRetryDelay(lastMessage.text, reengageAttempts);
        console.log(`⏱️ Setting retry delay: ${retryDelay / 1000}s (attempt ${reengageAttempts + 1}/${MAX_REENGAGE_ATTEMPTS}, backoff: ${Math.pow(2, reengageAttempts)}x)`);

        retryTimeoutRef.current = setTimeout(async () => {
            console.log("🔄 Auto-retry: Generating contextual re-engagement message...");

            try {
                // Build conversation history
                const conversationHistory = messages.map(msg => ({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.text
                }));

                // Use public or private endpoint based on mode
                const endpoint = isPublic ? "/api/public/chat/reengage" : "/api/chat/reengage";

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        agentId,
                        currentStateIndex,
                        conversationHistory
                    }),
                });

                if (response.ok) {
                    const data = await response.json();

                    // Add contextual re-engagement message
                    setMessages((prev) => [...prev, {
                        role: "bot",
                        text: data.message
                    }]);

                    // Increment re-engage attempts
                    setReengageAttempts((prev) => prev + 1);

                    console.log(`✅ Contextual re-engagement sent (attempt ${reengageAttempts + 1}/${MAX_REENGAGE_ATTEMPTS})`);
                } else {
                    // Fallback to simple re-engagement
                    console.warn("⚠️ Re-engagement API failed, using fallback");
                    setMessages((prev) => [...prev, {
                        role: "bot",
                        text: "Alguma dúvida sobre o que falamos?"
                    }]);

                    // Still increment attempts even on fallback
                    setReengageAttempts((prev) => prev + 1);
                }
            } catch (error) {
                console.error("❌ Error generating re-engagement:", error);
                // Don't increment on error - will retry on next cycle
            }

        }, retryDelay);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [agentId, messages, isConversationEnded, isLoading, currentStateIndex, isPublic, reengageAttempts, MAX_REENGAGE_ATTEMPTS]);

    async function handleSend(text: string) {
        if (!agentId) {
            setMessages((prev) => [...prev, {
                role: "bot",
                text: "Error: No agent selected. Please select an agent first."
            }]);
            return;
        }

        if (isConversationEnded) {
            setMessages((prev) => [...prev, {
                role: "bot",
                text: "This conversation has ended. Please clear the history to start a new conversation."
            }]);
            return;
        }

        // Add user message immediately
        const userMessage = { role: "user" as const, text };
        setMessages((prev) => [...prev, userMessage]);

        // Reset re-engage attempts when user sends a message
        setReengageAttempts(0);

        setIsLoading(true);

        try {
            // Build conversation history for API
            const conversationHistory = messages.map(msg => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.text
            }));

            // Use public endpoint if in public mode
            const endpoint = isPublic ? "/api/public/chat" : "/api/chat";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    agentId,
                    currentStateIndex,
                    conversationHistory
                }),
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

            // Update state
            if (data.nextStateIndex !== undefined) {
                setCurrentStateIndex(data.nextStateIndex);
            }
            if (data.stateName) {
                setCurrentStateName(data.stateName);
            }
            if (data.isFinal) {
                setIsConversationEnded(true);
            }

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

        if (confirm("Are you sure you want to clear the chat history? This will reset the conversation.")) {
            clearChatHistory(agentId);
            setMessages([]);
            setCurrentStateIndex(0);
            setCurrentStateName("Initial");
            setIsConversationEnded(false);
            setReengageAttempts(0); // Reset re-engage attempts
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
            {/* Header with state info and clear button */}
            {messages.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">Current State:</span>
                        <span className="text-xs font-medium text-blue-400">{currentStateName}</span>
                        {isConversationEnded && (
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">
                                Completed
                            </span>
                        )}
                    </div>
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
                    {!isLoading && reengageAttempts >= MAX_REENGAGE_ATTEMPTS && messages[messages.length - 1]?.role === 'bot' && (
                        <div className="flex items-center justify-center gap-2 p-3 mx-4 my-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Aguardando sua resposta...</span>
                        </div>
                    )}
                    {isConversationEnded && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                            <p className="text-sm text-green-400">Conversation completed</p>
                            <p className="text-xs text-white/50 mt-1">Clear history to start a new conversation</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative isolate z-10 w-full basis-auto content-fade single-line">
                <div className="max-w-xl mx-auto flex flex-col">
                    <ChatInput onSend={handleSend} disabled={isLoading || isConversationEnded} />
                </div>
            </div>
        </div>
    );
}
