import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    if (await getServerSession(authOptions)) redirect("/dashboard");
    const { error } = await searchParams;

    return (
        <main className="h-full flex items-center justify-center px-6">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-2xl font-semibold text-white mb-2">Sign in</h1>
                <p className="text-sm text-white/60 mb-8">
                    Upload your documents and chat with them.
                </p>
                {error && (
                    <p className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md p-2">
                        Couldn&apos;t sign in. Please try again.
                    </p>
                )}
                <GoogleSignInButton />
                <p className="mt-8 text-sm text-white/70">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-white underline underline-offset-4 hover:text-white/90">
                        Sign up
                    </Link>
                </p>
            </div>
        </main>
    );
}
