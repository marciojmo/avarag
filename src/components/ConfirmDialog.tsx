"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type ConfirmOptions = {
    title: string;
    body?: string;
    confirmLabel?: string;
    icon?: string;
};

// M3 basic dialog built on <dialog>. `confirm()` resolves true when the action is confirmed.
export function useConfirm() {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const settle = useCallback((value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setOptions(null);
    }, []);

    const dialog = options ? <ConfirmDialog {...options} onSettle={settle} /> : null;
    return { confirm, dialog };
}

function ConfirmDialog({
    title,
    body,
    confirmLabel = "Confirm",
    icon,
    onSettle,
}: ConfirmOptions & { onSettle: (value: boolean) => void }) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        ref.current?.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            className="md-dialog"
            aria-labelledby="confirm-dialog-title"
            onCancel={(e) => {
                e.preventDefault();
                onSettle(false);
            }}
            onClick={(e) => {
                // Clicking the scrim (outside the dialog box) dismisses it.
                if (e.target === e.currentTarget) onSettle(false);
            }}
        >
            <div className={icon ? "text-center" : undefined}>
                {icon && (
                    <span className="md-icon text-secondary mb-4" aria-hidden="true">
                        {icon}
                    </span>
                )}
                <h2 id="confirm-dialog-title" className="headline-small text-on-surface">
                    {title}
                </h2>
            </div>
            {body && <p className="body-medium text-on-surface-variant mt-4">{body}</p>}
            <div className="flex justify-end gap-2 mt-6">
                <button className="md-state md-button md-button--text" onClick={() => onSettle(false)}>
                    Cancel
                </button>
                <button className="md-state md-button md-button--text" onClick={() => onSettle(true)} autoFocus>
                    {confirmLabel}
                </button>
            </div>
        </dialog>
    );
}
