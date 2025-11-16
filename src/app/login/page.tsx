// app/login/page.tsx
"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";

function LoginContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/dashboard");
        }

        // Check for OAuth error and redirect to signup
        const error = searchParams.get("error");
        if (error === "AccessDenied") {
            router.replace("/signup?error=user_not_found");
        }
    }, [status, router, searchParams]);

    return (
        <main className="h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-md text-center">
                <h1 className="text-2xl font-semibold mb-8">Entrar</h1>

                <div className="flex flex-col gap-3">
                    {/* Google official-style button */}
                    <button
                        aria-label="Entrar com o Google"
                        className="w-full h-12 rounded border border-[#747775] bg-white text-[#1f1f1f] hover:bg-[#f8f9fa] active:bg-[#f1f3f4] transition-colors inline-flex items-center justify-center gap-3 hover:cursor-pointer"
                        onClick={() => signIn("google")}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M17.64 9.20455c0-.63909-.0573-1.25182-.1636-1.84091H9v3.48182h4.8445c-.2097 1.1291-.8464 2.085-1.8022 2.7282v2.2673h2.915c1.7059-1.5718 2.6837-3.8882 2.6837-6.63637z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.4673-.8062 5.9568-2.1582l-2.915-2.2673c-.8063.54-1.8373.8591-3.0418.8591-2.3391 0-4.31727-1.5809-5.02455-3.70637H.960938v2.33182C2.44221 15.9832 5.48128 18 9 18z" fill="#34A853" />
                            <path d="M3.97545 10.7273c-.18-.54-.28227-1.1173-.28227-1.72728 0-.61.10227-1.18727.28227-1.72727V4.94091H.960938C.349219 6.14545 0 7.53545 0 9c0 1.4645.349219 2.8545.960938 4.0591l3.014512-2.3318z" fill="#FBBC05" />
                            <path d="M9 3.54545c1.3218 0 2.5118.45546 3.4473 1.3491l2.5855-2.58545C13.4632.847727 11.426 0 9 0 5.48128 0 2.44221 2.01682.960938 4.94091l3.014512 2.33182C4.68273 5.12636 6.66091 3.54545 9 3.54545z" fill="#EA4335" />
                        </svg>
                        <span className="text-[14px] font-medium">Entrar com o Google</span>
                    </button>

                    {/* Apple official-style button */}
                    {/* <button
                        aria-label="Sign in with Apple"
                        className="w-full h-12 rounded bg-black text-white hover:bg-black/90 active:bg-black/80 transition-colors inline-flex items-center justify-center gap-3"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M16.365 1.43c0 1.14-.45 2.2-1.18 2.98-.76.8-2.02 1.42-3.16 1.33-.14-1.11.49-2.25 1.2-3.02.76-.79 2.07-1.38 3.14-1.45.02.05.02.1.02.16zM20.87 17.02c-.6 1.38-.9 2-1.68 3.23-1.09 1.67-2.63 3.76-4.54 3.78-1.03.02-1.74-.68-3.03-.68-1.3 0-2.07.66-3.04.7-1.94.07-3.42-1.8-4.52-3.46-2.46-3.76-2.72-8.17-1.2-10.51 1.09-1.68 2.81-2.66 4.44-2.66 1.65 0 2.69.72 4.05.72 1.33 0 2.14-.72 4.05-.72 1.46 0 3.01.8 4.1 2.16-3.61 1.98-3.03 7.14.57 8.94z" />
                        </svg>
                        <span className="text-[14px] font-semibold">Sign in with Apple</span>
                    </button> */}
                </div>
                <div className="mt-8 text-white/80">
                    <span>Não tem uma conta? </span>
                    <Link href="/signup" className="text-white underline underline-offset-4 hover:text-white/90">
                        Inscreva-se
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <main className="h-screen flex items-center justify-center px-6">
                <div className="w-full max-w-md text-center">
                    <h1 className="text-2xl font-semibold mb-8">Entrar</h1>
                </div>
            </main>
        }>
            <LoginContent />
        </Suspense>
    );
}


