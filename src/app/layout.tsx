// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Aya Tecnologia",
  description: "Fala com a Ava.",
};

// fundo da página: #212121
// fundo usuário: #303030
// cor do texto: #fff
// cor do input de texto: #303030



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#212121] flex flex-col">
        <AuthProvider>
          <NavBar />
          <div className="flex-1">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
