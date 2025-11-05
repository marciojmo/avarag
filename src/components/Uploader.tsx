"use client";

import * as React from "react";

type Obj = {
    key: string;
    name: string;
    size: number;
    lastModified: string | null;
    url: string;
    status?: string;
    documentId?: string;
};

export default function Uploader({ agentId }: { agentId?: string }) {
    const [files, setFiles] = React.useState<Obj[]>([]);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [deleting, setDeleting] = React.useState<string | null>(null);

    const refresh = React.useCallback(async () => {
        const res = await fetch("/api/uploads/list");
        if (!res.ok) return;
        const data = await res.json();
        setFiles(data.objects);
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'text/markdown',
            'audio/mpeg',
            'audio/mp3'
        ];

        const allowedExtensions = ['.pdf', '.txt', '.md', '.mp3'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            setError('Only PDF, TXT, Markdown (.md), and MP3 files are allowed');
            if (e.currentTarget) {
                e.currentTarget.value = "";
            }
            return;
        }

        // 1) Ask server for a presigned PUT URL
        const presign = await fetch("/api/uploads/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream", agentId }),
        });

        if (!presign.ok) {
            setError(`Failed to presign: ${await presign.text()}`);
            return;
        }

        const { url, key, agentId: returnedAgentId } = await presign.json();

        // 2) Upload directly to S3
        setBusy(true);
        const put = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
        });

        if (!put.ok) {
            setBusy(false);
            setError(`Upload failed (${put.status})`);
            return;
        }

        // 3) Confirm upload and create DB record + queue for processing
        const confirm = await fetch("/api/uploads/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                s3Key: key,
                filename: file.name,
                contentType: file.type || "application/octet-stream",
                agentId: returnedAgentId,
            }),
        });

        setBusy(false);

        if (!confirm.ok) {
            setError(`Failed to register upload: ${await confirm.text()}`);
            return;
        }

        // 4) Refresh list
        await refresh();
        // Reset input so the same file can be selected again if needed
        if (e.currentTarget) {
            e.currentTarget.value = "";
        }
    }

    async function handleDelete(key: string, name: string) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        setDeleting(key);
        try {
            const res = await fetch("/api/uploads/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
            });

            if (!res.ok) {
                setError(`Failed to delete: ${await res.text()}`);
                return;
            }

            await refresh();
        } catch (err) {
            setError(`Delete error: ${err}`);
        } finally {
            setDeleting(null);
        }
    }

    function formatDate(dateStr: string | null) {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <input
                    type="file"
                    accept=".pdf,.txt,.md,.mp3"
                    onChange={onSelect}
                    disabled={busy}
                    className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:text-white file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-blue-700 hover:cursor-pointer file:transition-colors"
                />
                {busy && <span className="text-sm text-white/70">Uploading…</span>}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {files.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white/5 rounded-lg border border-white/10">
                    <svg className="mx-auto h-12 w-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-sm text-white/50">No files uploaded yet</p>
                    <p className="mt-1 text-xs text-white/30">Upload your first file to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {files.map((f) => (
                        <div
                            key={f.key}
                            className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/[0.07] transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <a
                                    href={f.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-start gap-2 group"
                                >
                                    <svg className="h-4 w-4 text-white/40 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="break-all">{f.name}</span>
                                </a>
                                <button
                                    onClick={() => handleDelete(f.key, f.name)}
                                    disabled={deleting === f.key}
                                    className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete file"
                                >
                                    {deleting === f.key ? (
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-white/60">
                                <span>
                                    {f.size < 1024
                                        ? `${f.size} B`
                                        : f.size < 1024 * 1024
                                            ? `${(f.size / 1024).toFixed(1)} KB`
                                            : `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                                    }
                                </span>
                                <span>•</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${f.status === 'processed'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : f.status === 'failed'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    }`}>
                                    {f.status === 'processed' && (
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {f.status === 'failed' && (
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {f.status === 'pending' && (
                                        <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {f.status ? f.status.charAt(0).toUpperCase() + f.status.slice(1) : 'Unknown'}
                                </span>
                            </div>
                            {f.lastModified && (
                                <div className="mt-2 text-xs text-white/40">
                                    {formatDate(f.lastModified)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
