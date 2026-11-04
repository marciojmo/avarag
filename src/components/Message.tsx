export type ChatMessage = {
    role: "user" | "assistant";
    text: string;
    sources?: string[];
    error?: boolean;
};

export default function Message({ message }: { message: ChatMessage }) {
    if (message.role === "user") {
        return (
            <div className="my-3 max-w-[85%] self-end rounded-[20px] rounded-br-[4px] bg-primary-container text-on-primary-container px-4 py-3 body-large whitespace-pre-wrap break-words">
                {message.text}
            </div>
        );
    }

    if (message.error) {
        return (
            <div
                role="alert"
                className="my-3 self-start flex items-start gap-3 rounded-xl bg-error-container text-on-error-container px-4 py-3 body-medium"
            >
                <span className="md-icon md-icon--sm mt-px" aria-hidden="true">
                    error
                </span>
                <span className="whitespace-pre-wrap break-words">{message.text}</span>
            </div>
        );
    }

    return (
        <div className="my-3 self-start w-full">
            <div className="body-large text-on-surface whitespace-pre-wrap break-words">{message.text}</div>
            {message.sources && message.sources.length > 0 && (
                <div className="mt-3">
                    <p className="label-medium text-on-surface-variant mb-2">Sources</p>
                    <ul className="flex flex-wrap gap-2">
                        {message.sources.map((source) => (
                            <li key={source} className="md-chip max-w-full" title={source}>
                                <span className="md-icon" aria-hidden="true">
                                    description
                                </span>
                                <span className="truncate">{source}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
