// File types accepted for upload. Shared by the uploader UI and the API.

export const ALLOWED_TYPES: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    mp3: "audio/mpeg",
};

export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_TYPES).map((ext) => `.${ext}`).join(",");

/** Resolves the MIME type from the file extension, or null if not allowed. */
export function resolveContentType(filename: string): string | null {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return ALLOWED_TYPES[ext] ?? null;
}
