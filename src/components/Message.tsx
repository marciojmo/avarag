export type ChatMessage = {
    role: "user" | "assistant";
    text: string;
    sources?: string[];
    error?: boolean;
};

export default function Message({ message }: { message: ChatMessage }) {
    if (message.role === "user") {
        return (
            <div className="my-4 max-w-[80%] self-end rounded-2xl bg-[#303030] px-4 py-3 text-white whitespace-pre-wrap">
                {message.text}
            </div>
        );
    }

    return (
        <div className="my-4 self-start w-full">
            <div className={`whitespace-pre-wrap leading-relaxed ${message.error ? "text-red-400" : "text-white"}`}>
                {message.text}
            </div>
            {message.sources && message.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {message.sources.map((source) => (
                        <span
                            key={source}
                            className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-full px-2 py-0.5"
                        >
                            {source}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
