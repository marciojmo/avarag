import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ensureUser, getUserByEmail } from "@/lib/db";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async signIn({ user }) {
            if (!user.email) return false;
            try {
                await ensureUser(user.email, user.name || "User");
                return true;
            } catch (error) {
                console.error("Error during sign in:", error);
                return false;
            }
        },
        async session({ session }) {
            if (session.user?.email) {
                try {
                    const user = await getUserByEmail(session.user.email);
                    if (user) session.user.id = user.id;
                } catch (error) {
                    console.error("Error fetching user:", error);
                }
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            try {
                if (new URL(url).origin === baseUrl) return url;
            } catch {
                // fall through
            }
            return `${baseUrl}/dashboard`;
        },
    },
};
