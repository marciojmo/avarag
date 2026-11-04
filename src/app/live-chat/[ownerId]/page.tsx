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
            <header className="px-4 pt-4 max-w-3xl w-full mx-auto">
                <h1 className="text-lg font-semibold text-white">
                    {ownerName ? `Documentos de ${ownerName}` : "Chat com documentos"}
                </h1>
                <p className="text-sm text-white/60">
                    Faça perguntas e as respostas virão dos arquivos compartilhados.
                </p>
            </header>
            <div className="flex-1 min-h-0">
                <Chat
                    endpoint="/api/public/chat"
                    extraBody={{ ownerId }}
                    storageKey={`public_chat_history_${ownerId}`}
                    emptyTitle="Pergunte sobre estes documentos"
                    emptyDescription="As respostas são baseadas apenas nos arquivos compartilhados."
                />
            </div>
        </main>
    );
}
