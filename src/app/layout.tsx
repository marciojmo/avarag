import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Roboto_Flex } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";

const robotoFlex = Roboto_Flex({
    subsets: ["latin"],
    variable: "--font-roboto-flex",
    display: "swap",
});

// Only the icons the app uses, to keep the icon font small (names must stay sorted).
const ICON_NAMES = [
    "add_comment",
    "arrow_upward",
    "chat",
    "check",
    "close",
    "content_copy",
    "delete",
    "description",
    "error",
    "folder_open",
    "forum",
    "link",
    "logout",
    "open_in_new",
    "share",
    "upload_file",
].join(",");

export const metadata: Metadata = {
    title: "AYDA - Ask Your Documents Anything",
    description: "Upload your documents and ask questions about them.",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#efede5" },
        { media: "(prefers-color-scheme: dark)", color: "#211f1a" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={robotoFlex.variable}>
            <head>
                <link
                    rel="stylesheet"
                    href={`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&icon_names=${ICON_NAMES}&display=block`}
                />
            </head>
            <body className="h-dvh flex flex-col overflow-hidden bg-surface text-on-surface">
                <AuthProvider>
                    <NavBar />
                    <div className="flex-1 min-h-0 overflow-y-auto relative">{children}</div>
                </AuthProvider>
            </body>
        </html>
    );
}
