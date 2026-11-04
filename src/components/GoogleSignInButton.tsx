"use client";
import { signIn } from "next-auth/react";

export default function GoogleSignInButton({ label = "Entrar com o Google" }: { label?: string }) {
    return (
        <button
            className="w-full h-12 rounded border border-[#747775] bg-white text-[#1f1f1f] hover:bg-[#f8f9fa] active:bg-[#f1f3f4] transition-colors inline-flex items-center justify-center gap-3 cursor-pointer"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.20455c0-.63909-.0573-1.25182-.1636-1.84091H9v3.48182h4.8445c-.2097 1.1291-.8464 2.085-1.8022 2.7282v2.2673h2.915c1.7059-1.5718 2.6837-3.8882 2.6837-6.63637z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.4673-.8062 5.9568-2.1582l-2.915-2.2673c-.8063.54-1.8373.8591-3.0418.8591-2.3391 0-4.31727-1.5809-5.02455-3.70637H.960938v2.33182C2.44221 15.9832 5.48128 18 9 18z" fill="#34A853" />
                <path d="M3.97545 10.7273c-.18-.54-.28227-1.1173-.28227-1.72728 0-.61.10227-1.18727.28227-1.72727V4.94091H.960938C.349219 6.14545 0 7.53545 0 9c0 1.4645.349219 2.8545.960938 4.0591l3.014512-2.3318z" fill="#FBBC05" />
                <path d="M9 3.54545c1.3218 0 2.5118.45546 3.4473 1.3491l2.5855-2.58545C13.4632.847727 11.426 0 9 0 5.48128 0 2.44221 2.01682.960938 4.94091l3.014512 2.33182C4.68273 5.12636 6.66091 3.54545 9 3.54545z" fill="#EA4335" />
            </svg>
            <span className="text-[14px] font-medium">{label}</span>
        </button>
    );
}
