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
        <div className="md-card md-card--outlined p-4 bg-transparent">
            <div className="flex items-center gap-2 mb-1">
                <span className="md-icon md-icon--sm text-primary" aria-hidden="true">
                    link
                </span>
                <p className="title-small text-on-surface">Public chat link</p>
            </div>
            <p className="body-small text-on-surface-variant mb-3">
                Anyone with the link can ask questions about your files.
            </p>
            <div className="flex items-center gap-1 rounded-lg bg-surface-container-highest pl-3 pr-1 py-1">
                <span className="flex-1 min-w-0 truncate body-small text-on-surface-variant" title={url}>
                    {url}
                </span>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="md-state md-icon-button w-8 h-8"
                    aria-label="Open public chat in a new tab"
                    title="Open"
                >
                    <span className="md-icon md-icon--sm" aria-hidden="true">
                        open_in_new
                    </span>
                </a>
            </div>
            <button onClick={copy} className="md-state md-button md-button--filled w-full mt-3" aria-live="polite">
                <span className="md-icon" aria-hidden="true">
                    {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied" : "Copy link"}
            </button>
        </div>
    );
}
