import Chat from "@/components/Chat";

// Access is enforced by src/middleware.ts.
export default function AdminPage() {
    return (
        <main className="h-full flex">
            <aside className="hidden md:block w-80 shrink-0 bg-surface-container-low" aria-label="Admin" />
            <section className="flex-1 min-w-0 min-h-0">
                <Chat />
            </section>
        </main>
    );
}
