import { notFound } from "next/navigation";
import Chat from "@/components/Chat";
import { query } from "@/lib/db";
import { UUID_PATTERN } from "@/lib/rag";

// Public chat over the documents of the user who shared this link.
export default async function PublicChatPage({ params }: { params: Promise<{ ownerId: string }> }) {
    const { ownerId } = await params;
    if (!UUID_PATTERN.test(ownerId)) notFound();

    const result = await query("SELECT name FROM users WHERE id = $1", [ownerId]);
    if (result.rows.length === 0) notFound();
    const ownerName: string | null = result.rows[0].name;

    return (
        <main className="h-full flex flex-col">
            <header className="px-4 pt-6 pb-2 max-w-3xl w-full mx-auto flex items-center gap-4">
                <span className="flex items-center justify-center w-12 h-12 shrink-0 rounded-2xl bg-brand text-on-brand">
                    <span className="md-icon" aria-hidden="true">
                        description
                    </span>
                </span>
                <div className="min-w-0">
                    <h1 className="title-large text-on-surface truncate">
                        {ownerName ? `${ownerName}'s documents` : "Document chat"}
                    </h1>
                    <p className="body-medium text-on-surface-variant">
                        Ask questions and get answers from the shared files.
                    </p>
                </div>
            </header>
            <div className="flex-1 min-h-0">
                <Chat
                    endpoint="/api/public/chat"
                    extraBody={{ ownerId }}
                    storageKey={`public_chat_history_${ownerId}`}
                    emptyTitle="Ask about these documents"
                    emptyDescription="Answers are based only on the shared files."
                />
            </div>
        </main>
    );
}
