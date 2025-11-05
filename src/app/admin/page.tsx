// app/admin/page.tsx
import Chat from "@/components/Chat";

export default function AdminPage() {
    return (
        <main className="h-screen grid grid-cols-12">
            <aside className="col-span-3 border-r border-white/10" />
            <section className="col-span-9">
                <Chat />
            </section>
        </main>
    );
}


