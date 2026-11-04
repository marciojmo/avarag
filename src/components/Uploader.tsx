"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACCEPT_ATTRIBUTE, resolveContentType } from "@/lib/uploads";

type Doc = {
    id: string;
    name: string;
    size: number;
    status: "pending" | "processed" | "failed";
    createdAt: string;
};

const POLL_INTERVAL_MS = 4000;

const STATUS_LABEL: Record<Doc["status"], string> = {
    pending: "Processing",
    processed: "Ready",
    failed: "Failed",
};

const STATUS_CLASS: Record<Doc["status"], string> = {
    pending: "bg-yellow-500/15 text-yellow-300",
    processed: "bg-green-500/15 text-green-300",
    failed: "bg-red-500/15 text-red-300",
};

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function errorMessage(res: Response) {
    const data = await res.json().catch(() => null);
    return data?.error || `Error ${res.status}`;
}

export default function Uploader() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [uploading, setUploading] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch("/api/uploads");
            if (res.ok) setDocs((await res.json()).documents);
        } catch {
            // Transient network error: the next poll or action retries.
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Processing happens in the background: poll while anything is pending.
    const hasPending = docs.some((d) => d.status === "pending");
    useEffect(() => {
        if (!hasPending) return;
        const timer = setInterval(refresh, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [hasPending, refresh]);

    async function upload(file: File) {
        setError(null);
        const contentType = resolveContentType(file.name);
        if (!contentType) {
            setError("Only PDF, TXT, Markdown (.md) or MP3 files are supported.");
            return;
        }

        setUploading(file.name);
        try {
            const presign = await fetch("/api/uploads/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name }),
            });
            if (!presign.ok) throw new Error(await errorMessage(presign));
            const { url, key } = await presign.json();

            const put = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": contentType },
                body: file,
            });
            if (!put.ok) throw new Error(`Upload to S3 failed (${put.status})`);

            const register = await fetch("/api/uploads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, filename: file.name }),
            });
            if (!register.ok) throw new Error(await errorMessage(register));

            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setUploading(null);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    async function remove(doc: Doc) {
        if (!confirm(`Delete "${doc.name}"?`)) return;
        setDeleting(doc.id);
        try {
            const res = await fetch(`/api/uploads/${doc.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await errorMessage(res));
            setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setDeleting(null);
        }
    }

    return (
        <div className="flex flex-col gap-3 h-full">
            <label
                className={`flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/80 hover:bg-white/5 cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT_ATTRIBUTE}
                    className="sr-only"
                    disabled={!!uploading}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) upload(file);
                    }}
                />
                {uploading ? `Uploading ${uploading}…` : "+ Upload file"}
            </label>
            <p className="text-xs text-white/40 -mt-1">PDF, TXT, Markdown or MP3</p>

            {error && (
                <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-md p-2">
                    {error}
                </p>
            )}

            <ul className="flex-1 overflow-y-auto space-y-1">
                {docs.length === 0 && (
                    <li className="text-xs text-white/40 py-4 text-center">No files uploaded yet.</li>
                )}
                {docs.map((doc) => (
                    <li key={doc.id} className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate" title={doc.name}>
                                {doc.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[11px] rounded-full px-1.5 ${STATUS_CLASS[doc.status]}`}>
                                    {STATUS_LABEL[doc.status]}
                                </span>
                                <span className="text-[11px] text-white/40">{formatSize(doc.size)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => remove(doc)}
                            disabled={deleting === doc.id}
                            aria-label={`Delete ${doc.name}`}
                            className="p-1.5 rounded text-white/40 hover:text-red-300 hover:bg-red-500/10 opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
