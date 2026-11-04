import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});

export const config = {
    // API routes check the session themselves and answer 401 (no HTML redirect).
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};
