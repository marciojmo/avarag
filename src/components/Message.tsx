// components/Message.tsx
type MessageProps = {
    role: "user" | "bot";
    text: string;
};

export default function Message({ role, text }: MessageProps) {
    const isUser = role === "user";
    return (
        <div
            className={`my-4 max-w-md rounded-2xl text-white ${isUser ? "bg-[#303030] self-end px-4 py-3 " : "self-start"
                }`}
        >
            {text}
        </div>
    );
}
