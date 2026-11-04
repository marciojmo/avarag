// app/page.tsx
import Link from "next/link";

const STEPS = [
    {
        icon: "upload_file",
        title: "Upload your files",
        description: "Add PDF, TXT, Markdown or MP3 files. Audio is transcribed automatically.",
    },
    {
        icon: "chat",
        title: "Ask questions",
        description: "Chat with your documents. Every answer comes from your files and shows its sources.",
    },
    {
        icon: "share",
        title: "Share a link",
        description: "Get a public chat link so anyone can ask about your documents, no sign-in needed.",
    },
];

export default function Home() {
    return (
        <main className="min-h-full">
            {/* What it is */}
            <section className="px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="display-medium sm:display-large text-on-surface mb-6 text-balance">
                        Ask your documents anything.
                    </h1>

                    <p className="title-large text-on-surface-variant mb-10 max-w-2xl mx-auto text-pretty">
                        AYDA reads the files you upload and answers questions about them in a chat,
                        using only what&apos;s in your documents.
                    </p>

                    <div className="flex gap-3 justify-center flex-wrap">
                        <Link href="/signup" className="md-state md-button md-button--filled md-button--large">
                            Try it for free
                        </Link>
                        <Link href="#how-it-works" className="md-state md-button md-button--outlined md-button--large">
                            See how it works
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section
                id="how-it-works"
                className="px-4 sm:px-6 py-16 sm:py-20 bg-surface-container-low rounded-t-[28px] scroll-mt-4"
            >
                <div className="max-w-5xl mx-auto">
                    <h2 className="headline-large text-on-surface text-center mb-10">How it works</h2>

                    <ol className="grid md:grid-cols-3 gap-4">
                        {STEPS.map((step, i) => (
                            <li key={step.title} className="md-card md-card--filled p-6 flex flex-col">
                                <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand text-on-brand mb-6">
                                    <span className="md-icon" aria-hidden="true">
                                        {step.icon}
                                    </span>
                                </span>
                                <span className="label-large text-primary mb-1">Step {i + 1}</span>
                                <h3 className="title-large text-on-surface mb-2">{step.title}</h3>
                                <p className="body-medium text-on-surface-variant">{step.description}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>
        </main>
    );
}
