import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthCard from "@/components/AuthCard";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    if (await getServerSession(authOptions)) redirect("/dashboard");
    const { error } = await searchParams;

    return (
        <AuthCard
            title="Sign in"
            error={error ? "Couldn't sign in. Please try again." : undefined}
            footer={{ prompt: "Don't have an account?", href: "/signup", linkLabel: "Sign up" }}
        />
    );
}
