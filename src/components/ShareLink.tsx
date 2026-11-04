"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Public link that lets anyone chat with the signed-in user's documents.
export default function ShareLink() {
    const { data: session } = useSession();
    const [url, setUrl] = useState("");
    const [copied, setCopied] = useState(false);

    const userId = session?.user?.id;
    useEffect(() => {
        if (userId) setUrl(`${window.location.origin}/live-chat/${userId}`);
    }, [userId]);

    if (!url) return null;

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard blocked: the link stays visible to copy by hand.
        }
    }

    return (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-medium text-white/80">Public chat link</p>
            <p className="text-[11px] text-white/50 mt-0.5 mb-2">
                Anyone with the link can ask questions about your files.
            </p>
            <div className="flex items-center gap-2">
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-0 truncate text-[11px] text-white/70 hover:text-white underline-offset-2 hover:underline"
                    title={url}
                >
                    {url}
                </a>
                <button
                    onClick={copy}
                    className="shrink-0 text-xs font-medium rounded-md bg-white/10 hover:bg-white/15 text-white px-2.5 py-1"
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>
    );
}
