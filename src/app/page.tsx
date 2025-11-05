// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-57px)] flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl text-center px-6">
          <h1 className="text-3xl font-semibold mb-4">Transforme seu atendimento em uma operação autônoma</h1>
          <p className="text-white/80 mb-8">
            A AVA é uma assistente virtual inteligente que cuida do seu atendimento 24h por dia, todos os dias.
            Ela responde, informa e resolve, enquanto você reduz drasticamente os custos operacionais.
            Sem complexidade. Sem vínculos. Cancele quando quiser.
          </p>
          <Link href="/live-chat" className="inline-block px-6 py-3 rounded bg-white text-black font-medium hover:bg-white/90">Fale com a Ava</Link>
        </div>
      </div>
    </main>
  );
}
