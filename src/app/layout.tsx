import "./globals.css";
import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
    title: "AVA",
    description: "Upload your documents and ask questions about them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="h-dvh flex flex-col overflow-hidden">
                <AuthProvider>
                    <NavBar />
                    <div className="flex-1 min-h-0 overflow-y-auto relative">{children}</div>
                </AuthProvider>
            </body>
        </html>
    );
}
