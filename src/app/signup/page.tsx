import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthCard from "@/components/AuthCard";

// The account is created on the first Google sign-in (see lib/auth.ts).
export default async function SignupPage() {
    if (await getServerSession(authOptions)) redirect("/dashboard");

    return (
        <AuthCard
            title="Create account"
            buttonLabel="Sign up with Google"
            footer={{ prompt: "Already have an account?", href: "/login", linkLabel: "Sign in" }}
        />
    );
}
