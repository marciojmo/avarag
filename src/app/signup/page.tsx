import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";

// The account is created on the first Google sign-in (see lib/auth.ts).
export default async function SignupPage() {
    if (await getServerSession(authOptions)) redirect("/dashboard");

    return (
        <main className="h-full flex items-center justify-center px-6">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-2xl font-semibold text-white mb-2">Criar conta</h1>
                <p className="text-sm text-white/60 mb-8">
                    Envie seus documentos e converse com eles.
                </p>
                <GoogleSignInButton label="Inscrever-se com o Google" />
                <p className="mt-8 text-sm text-white/70">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="text-white underline underline-offset-4 hover:text-white/90">
                        Entrar
                    </Link>
                </p>
            </div>
        </main>
    );
}
