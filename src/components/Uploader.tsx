"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACCEPT_ATTRIBUTE, resolveContentType } from "@/lib/uploads";
import { useConfirm } from "./ConfirmDialog";

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
    pending: "bg-secondary-container text-on-secondary-container",
    processed: "bg-success-container text-on-success-container",
    failed: "bg-error-container text-on-error-container",
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
    const { confirm, dialog } = useConfirm();

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
        const ok = await confirm({
            icon: "delete",
            title: "Delete file?",
            body: `"${doc.name}" will be removed and can no longer be used to answer questions.`,
            confirmLabel: "Delete",
        });
        if (!ok) return;
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
        <div className="flex flex-col h-full">
            <label
                className={`md-state md-button md-button--filled w-full ${uploading ? "pointer-events-none" : ""} has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-secondary has-[:focus-visible]:outline-offset-2`}
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
                <span className="md-icon" aria-hidden="true">
                    upload_file
                </span>
                <span className="truncate">{uploading ? `Uploading ${uploading}…` : "Upload file"}</span>
            </label>
            {uploading ? (
                <div className="md-linear-progress mt-3" role="progressbar" aria-label="Uploading" />
            ) : (
                <p className="body-small text-on-surface-variant mt-2 px-4">PDF, TXT, Markdown or MP3</p>
            )}

            {error && (
                <p
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-xl bg-error-container text-on-error-container body-small p-3"
                >
                    <span className="md-icon md-icon--sm" aria-hidden="true">
                        error
                    </span>
                    <span className="min-w-0 break-words">{error}</span>
                </p>
            )}

            <ul className="flex-1 overflow-y-auto mt-3 -mx-3">
                {docs.length === 0 && (
                    <li className="flex flex-col items-center text-center py-10 px-4 text-on-surface-variant">
                        <span className="md-icon mb-2" aria-hidden="true">
                            folder_open
                        </span>
                        <span className="body-medium">No files uploaded yet.</span>
                    </li>
                )}
                {docs.map((doc) => (
                    <li key={doc.id} className="group md-list-item rounded-2xl mx-1 transition-colors hover:bg-surface-container-highest">
                        <span className="md-icon text-on-surface-variant" aria-hidden="true">
                            description
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="body-large text-on-surface truncate" title={doc.name}>
                                {doc.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`label-small rounded-full px-2 py-0.5 ${STATUS_CLASS[doc.status]}`}>
                                    {STATUS_LABEL[doc.status]}
                                </span>
                                <span className="body-small text-on-surface-variant">{formatSize(doc.size)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => remove(doc)}
                            disabled={deleting === doc.id}
                            aria-label={`Delete ${doc.name}`}
                            title="Delete"
                            className="md-state md-icon-button md:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                            <span className="md-icon" aria-hidden="true">
                                delete
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
            {dialog}
        </div>
    );
}
