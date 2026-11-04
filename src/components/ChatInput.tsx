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
            className="flex items-end gap-2 rounded-[28px] bg-surface-container-high pl-6 pr-2 py-2 m-4 mt-2 outline-2 outline-transparent focus-within:outline-primary transition-[outline-color] duration-150"
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
                placeholder="Ask anything"
                aria-label="Message"
                className="flex-1 resize-none bg-transparent body-large text-on-surface placeholder:text-on-surface-variant outline-none py-2 max-h-48 field-sizing-content"
            />
            <button
                type="submit"
                className="md-state md-icon-button md-icon-button--filled"
                aria-label="Send"
                disabled={disabled || !text.trim()}
            >
                <span className="md-icon" aria-hidden="true">
                    arrow_upward
                </span>
            </button>
        </form>
    );
}
