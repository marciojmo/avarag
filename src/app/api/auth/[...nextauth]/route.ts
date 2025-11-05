// api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createUser, getUserByEmail } from "@/lib/db";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/signup?error=user_not_found",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    // Check if user exists
                    const existingUser = await getUserByEmail(user.email!);

                    if (!existingUser) {
                        // User doesn't exist - create new user and agent
                        await createUser(user.email!, user.name || "User");
                    }

                    return true;
                } catch (error) {
                    console.error("Error during sign in:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user?.email) {
                try {
                    const user = await getUserByEmail(session.user.email);
                    if (user) {
                        session.user.id = user.id;
                    }
                } catch (error) {
                    console.error("Error fetching user:", error);
                }
            }
            return session;
        },
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            try {
                const parsed = new URL(url, baseUrl);
                if (parsed.pathname.startsWith("/api/auth/callback")) {
                    return "/dashboard";
                }
                if (url.startsWith("/")) return `${baseUrl}${url}`;
                if (parsed.origin === baseUrl) return url;
                return baseUrl;
            } catch {
                return baseUrl;
            }
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


