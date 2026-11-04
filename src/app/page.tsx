// app/page.tsx
import Link from "next/link";

const STEPS = [
    {
        title: "Upload your files",
        description: "Add PDF, TXT, Markdown or MP3 files. Audio is transcribed automatically.",
    },
    {
        title: "Ask questions",
        description: "Chat with your documents. Every answer comes from your files and shows its sources.",
    },
    {
        title: "Share a link",
        description: "Get a public chat link so anyone can ask about your documents, no sign-in needed.",
    },
];

export default function Home() {
    return (
        <main className="min-h-full bg-gradient-to-b from-black to-gray-900">
            {/* What it is */}
            <section className="relative overflow-hidden pt-20 pb-28 px-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-500/20 to-blue-500/20 rounded-full blur-3xl"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
                        Ask your documents anything.
                    </h1>

                    <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
                        AVA reads the files you upload and answers questions about them in a chat,
                        using only what&apos;s in your documents.
                    </p>

                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            href="/signup"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg font-semibold hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-violet-500/50"
                        >
                            Try it for free
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="px-8 py-4 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-all backdrop-blur-sm"
                        >
                            See how it works
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-20 px-6 bg-white/5">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12">How it works</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {STEPS.map((step, i) => (
                            <div
                                key={step.title}
                                className="bg-gradient-to-br from-blue-900/30 to-violet-900/30 rounded-2xl p-8 backdrop-blur-sm border border-white/10"
                            >
                                <div className="text-violet-400 text-sm mb-2">STEP {i + 1}</div>
                                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                                <p className="text-gray-300">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
