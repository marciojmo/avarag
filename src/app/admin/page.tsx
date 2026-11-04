import Chat from "@/components/Chat";

// Access is enforced by src/middleware.ts.
export default function AdminPage() {
    return (
        <main className="h-full grid grid-cols-12">
            <aside className="col-span-3 border-r border-white/10" />
            <section className="col-span-9 min-h-0">
                <Chat />
            </section>
        </main>
    );
}
