// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        {/* Gradient shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-500/20 to-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-6xl mx-auto text-center">

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Atendimento inteligente e descomplicado para sua empresa.
          </h1>

          <p className="text-xl text-gray-300 mb-10 max-w-4xl mx-auto">
            Aumente a qualidade do seu atendimento com Inteligência Artificial disponível 24/7
            sem a necessidade de configurações ultra complexas.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg font-semibold hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-violet-500/50"
            >
              Teste grátis
            </Link>
            <Link
              href="#plans"
              className="px-8 py-4 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Ver planos 💜
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-blue-900/20 to-violet-900/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">95%</div>
            <div className="text-gray-300">IA resolve até 95% dos atendimentos</div>
          </div>
          <div>
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">3x</div>
            <div className="text-gray-300">IA aumenta até 3x as taxas de conversão</div>
          </div>
          <div>
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">80%</div>
            <div className="text-gray-300">IA economiza até 80% nos custos operacionais</div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Crie um Agente de IA e conecte no WhatsApp em menos de 5 minutos
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Nossos Funcionários de IA operam em múltiplos canais, 24/7, sem descanso.
            Eles pensam, tomam decisões e executam tarefas com precisão.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg font-semibold hover:from-blue-700 hover:to-violet-700 transition-all"
          >
            Começar agora
          </Link>
        </div>
      </section>

      {/* For Who */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-violet-400 mb-4">PARA QUEM FAZ ACONTECER</div>
            <h2 className="text-4xl font-bold">A Ava é ideal para</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-900/30 to-violet-900/30 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-bold mb-4">Agências que querem vender automação como serviço para outras empresas</h3>
            </div>
            <div className="bg-gradient-to-br from-violet-900/30 to-blue-900/30 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-bold mb-4">Profissionais que querem escalar o suporte e vendas da empresa onde atuam com Funcionários de IA</h3>
            </div>
            <div className="bg-gradient-to-br from-blue-900/30 to-violet-900/30 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-bold mb-4">Empreendedores que querem transformar ideias em produtos e serviços inovadores com IA</h3>
            </div>
          </div>
        </div>
      </section>

      {/* What is AI Employee */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-violet-400 mb-4">AI AGENTS</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">O que é um funcionário de IA?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              <strong>Funcionários de IA</strong> são como ter um "ChatGPT" da sua empresa.
              Eles entendem e respondem aos clientes, executam tarefas e trabalham 24/7 para o seu negócio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Age como se fosse um humano</h3>
              <p className="text-gray-300">Transforme a experiência do seu cliente com um atendimento natural e humanizado, que está sempre disponível.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Realiza tarefas automáticas</h3>
              <p className="text-gray-300">Deixe os processos repetitivos por conta do IA e libere sua equipe para focar no que realmente importa.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Busca informações em tempo real</h3>
              <p className="text-gray-300">Responda aos clientes com precisão e velocidade, com informações da sua empresa e produtos sempre atualizadas.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Toma decisões e resolve problemas</h3>
              <p className="text-gray-300">Permita que a IA decida o que fazer, resolvendo problemas sem necessidade de intervenção e aumentando a eficiência.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg font-semibold hover:from-blue-700 hover:to-violet-700 transition-all"
            >
              Criar funcionário IA
            </Link>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-violet-400 mb-4">FUNÇÕES</div>
            <h2 className="text-4xl font-bold">Se um já é bom, imagine um time de funcionários de IA</h2>
            <p className="text-gray-300 mt-4">Conheça alguns dos cargos que os Funcionários de IA da Ava podem ocupar:</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-900/40 to-violet-900/40 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Responde dúvidas</li>
                <li>• Resolve problemas</li>
                <li>• Orienta usuários</li>
                <li>• Envia links e instruções</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-violet-900/40 to-blue-900/40 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Atendente</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Agenda reuniões</li>
                <li>• Envia lembretes</li>
                <li>• Coleta informações</li>
                <li>• Passa para humano</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-900/40 to-violet-900/40 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Vendedor</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Qualifica leads</li>
                <li>• Faz ofertas diretas</li>
                <li>• Recupera compras</li>
                <li>• Fecha vendas</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-violet-900/40 to-blue-900/40 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <h3 className="text-2xl font-bold mb-4">Social Media</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Responde DMs</li>
                <li>• Responde comentários</li>
                <li>• Gerencia interações</li>
                <li>• Atende em segundos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-violet-400 mb-4">COMO USAR</div>
            <h2 className="text-4xl font-bold">Crie seu primeiro funcionário de IA sem escrever 1 linha de código</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-12">
              <div>
                <div className="text-violet-400 text-sm mb-2">1º PASSO</div>
                <h3 className="text-2xl font-bold mb-3">1. Defina o cargo</h3>
                <p className="text-gray-300">Escolha um nome, descreva o objetivo do Funcionário de IA, como faria em uma vaga de emprego, defina tom de voz, e instruções gerais.</p>
              </div>

              <div>
                <div className="text-violet-400 text-sm mb-2">2º PASSO</div>
                <h3 className="text-2xl font-bold mb-3">2. Ensine sobre seus produtos/serviços</h3>
                <p className="text-gray-300">Suba arquivos, adicione links do seu site e coloque perguntas e respostas para treinar seu Funcionário de IA.</p>
              </div>
            </div>

            <div className="space-y-12">
              <div>
                <div className="text-violet-400 text-sm mb-2">3º PASSO</div>
                <h3 className="text-2xl font-bold mb-3">3. Ensine os processos</h3>
                <p className="text-gray-300">Diga ao Funcionário de IA o que ele precisa fazer e como. Integre as ferramentas necessárias, e ele seguirá suas instruções com precisão.</p>
              </div>

              <div>
                <div className="text-violet-400 text-sm mb-2">4º PASSO</div>
                <h3 className="text-2xl font-bold mb-3">4. Dê feedback e evolua</h3>
                <p className="text-gray-300">Monitore o desempenho, inspecione as respostas, encontre o problema e ajuste conforme necessário para melhorar continuamente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="plans" className="py-20 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-violet-400 mb-4">PLANOS</div>
            <h2 className="text-4xl font-bold">Contrate o melhor funcionário da sua empresa por menos que um estagiário</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-blue-900/30 to-violet-900/30 rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-2">PRO</h3>
              <div className="text-4xl font-bold mb-6">R$299<span className="text-xl text-gray-400">/mês</span></div>
              <div className="text-violet-400 mb-6">Grátis para testar</div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>10 funcionários de Inteligência Artificial</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>5.000 créditos no workspace</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>4 usuários</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>Academy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>Comunidade</span>
                </li>
              </ul>

              <Link
                href="/signup"
                className="block w-full text-center px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg font-semibold hover:from-blue-700 hover:to-violet-700 transition-all"
              >
                Começar agora
              </Link>
            </div>

            <div className="bg-gradient-to-br from-violet-900/30 to-blue-900/30 rounded-2xl p-8 border-2 border-violet-500/50 relative">
              <div className="absolute -top-4 right-8 bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-1 rounded-full text-sm font-semibold">
                EXCLUSIVO
              </div>

              <h3 className="text-2xl font-bold mb-2">AGENCY</h3>
              <div className="text-4xl font-bold mb-6">R$899<span className="text-xl text-gray-400">/mês</span></div>
              <div className="text-violet-400 mb-6">Grátis para testar</div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>Funcionários de IA ilimitados</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>20.000 créditos no workspace</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>20 usuários</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>Academy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>Comunidade</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>Suporte premium</span>
                </li>
                <li className="flex items-start">
                  <span className="text-violet-400 mr-2">✓</span>
                  <span>Whitelabel</span>
                </li>
              </ul>

              <Link
                href="/signup"
                className="block w-full text-center px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg font-semibold hover:from-violet-700 hover:to-blue-700 transition-all"
              >
                Começar agora
              </Link>
            </div>
          </div>

          <div className="text-center mt-12 text-gray-400 space-y-2">
            <p>✓ Teste gratuito</p>
            <p>✓ Cancele quando quiser</p>
            <p>✓ Cursos técnico e de gestão inclusos</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Por que agora é o melhor momento para você dominar os "Funcionários de Inteligência Artificial"
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            A revolução da IA já começou. Empresas que adotam agentes de IA agora estão na frente da concorrência.
          </p>
          <Link
            href="/signup"
            className="inline-block px-12 py-5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-violet-500/50"
          >
            Comece agora gratuitamente
          </Link>
        </div>
      </section>
    </main>
  );
}
