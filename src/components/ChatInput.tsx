"use client";
import { useState } from "react";

type ChatInputProps = {
    onSend: (text: string) => void;
    disabled?: boolean;
};

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [text, setText] = useState("");

    function submit() {
        const value = text.trim();
        if (!value || disabled) return;
        onSend(value);
        setText("");
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
            className="flex items-end rounded-3xl bg-[#303030] px-3 py-2 m-4"
        >
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        submit();
                    }
                }}
                rows={1}
                placeholder="Pergunte alguma coisa"
                aria-label="Mensagem"
                className="flex-1 resize-none bg-transparent text-white outline-none ml-2 py-2 max-h-48 field-sizing-content"
            />
            <button
                type="submit"
                className="p-2.5 rounded-full bg-white text-black disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Enviar"
                disabled={disabled || !text.trim()}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z" />
                </svg>
            </button>
        </form>
    );
}
