import {
  ArrowRight,
  Flower2 as LotusIcon,
  Globe2,
  Headphones,
  PlayCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';

const features = [
  {
    title: 'Busca nos Ensinamentos',
    description:
      'Encontre palestras e séries específicas pesquisando por temas, palavras ou títulos.',
    icon: Search,
  },
  {
    title: 'Reprodução de Vídeos',
    description:
      'Assista aos ensinamentos diretamente no navegador com player integrado do YouTube.',
    icon: PlayCircle,
  },
  {
    title: 'Áudios e Transcrições (em breve)',
    description:
      'Em breve, cada ensinamento terá versão em áudio e transcrição completa sincronizada.',
    icon: Headphones,
  },
  {
    title: 'Acesso Aberto e Gratuito',
    description:
      'Todo o conteúdo é livre e aberto, dedicado à difusão dos ensinamentos budistas.',
    icon: Globe2,
  },
];


export default function Home() {
  return (
    <main className="flex flex-col bg-white text-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-sky-50">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-12 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]"></div>
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-16 sm:px-6 lg:px-8 lg:flex-row lg:py-20">
          {/* Conteúdo de texto - Esquerda */}
          <div className="w-full max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100 backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden />
              Um cuidado da rede CEBB
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Repositório Lama Padma Samten
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-700 sm:text-xl">
              Ensinamentos, palestras e retiros oferecidos pelo Lama Padma Samten  —
              agora reunidos em um só lugar.
            </p>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Este repositório é uma extensão viva da Ação Paramita, uma plataforma para o estudo,
              prática e contemplação do Darma. Aqui você encontra centenas de gravações, playlists e
              séries, com recursos que em breve incluirão áudios e transcrições completas.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href="/playlists"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-sky-500/40"
              >
                <LotusIcon className="h-5 w-5" aria-hidden />
                🕊️ Explorar Ensinamentos
              </a>
              <a
                href="#acao-paramita"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600"
              >
                <ArrowRight className="h-5 w-5" aria-hidden />
                📚 Saiba Mais sobre a Ação Paramita
              </a>
            </div>
          </div>

          {/* Foto do Lama Padma Samten - Direita */}
          <div className="mt-8 lg:mt-0 lg:ml-16 lg:flex-shrink-0">
            <div className="relative h-80 w-80 mx-auto lg:mx-0">
              <Image
                src="/lama.png"
                alt="Lama Padma Samten"
                fill
                className="rounded-full object-cover shadow-2xl ring-4 ring-white/50"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20" id="sobre">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-100">
            🎧 O que é o Repositório
          </span>
          <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">
            Um espaço para o estudo e<br />contemplação do Darma
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-700">
            O Repositório do Lama Padma Samten reúne ensinamentos oferecidos ao longo de décadas em
            retiros, palestras e transmissões do CEBB – Centro de Estudos Budistas Bodisatva.
            Organizados em playlists temáticas, os conteúdos permitem acompanhar o percurso dos
            ensinamentos e navegar por temas como meditação, compaixão, sabedoria e ação no mundo.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            👉 Explore os conteúdos disponíveis e aprofunde-se nos ensinamentos do Buda no mundo
            contemporâneo.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-100 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Recursos do Repositório</h2>
            <p className="mt-3 text-base text-slate-600">
              Ferramentas que apoiam sua jornada de estudo, prática e contemplação.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
                  <feature.icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-base text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20" id="lama">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Seção sobre Lama Padma Samten - Tela toda */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100 via-white to-rose-100 p-8 sm:p-12 shadow-lg">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-indigo-200/40 blur-2xl"></div>
            <div className="absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-rose-200/40 blur-2xl"></div>
            
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:gap-12">
              {/* Conteúdo de texto */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-indigo-700 shadow ring-1 ring-indigo-100 backdrop-blur">
                  Sobre Lama Padma Samten
                </span>
                <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 lg:text-4xl">
                  Mestre budista e fundador do CEBB
                </h2>
                <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-700">
                  Lama Padma Samten é mestre budista e fundador do CEBB. Físico pela UFRGS, encontrou
                  na física quântica pontes para dialogar com a visão budista e, desde então, dedica-se
                  ao ensinamento do Darma como um caminho de lucidez, equilíbrio e compaixão. Por meio de
                  suas palestras e livros, inspira pessoas a transformarem suas vidas e redes de
                  convivência.
                </p>
                <a
                  href="https://cebb.org.br/agenda-lama-padma-samten/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
                >
                  📅 Ver Agenda e Ensinamentos Recentes
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>

              {/* Foto do Lama Padma Samten */}
              <div className="mt-8 lg:mt-0 lg:flex-shrink-0">
                <div className="relative h-64 w-64 sm:h-80 sm:w-80 mx-auto lg:mx-0">
                  <Image
                    src="/lama2.png"
                    alt="Lama Padma Samten"
                    fill
                    className="object-cover rounded-lg"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção da rede Ação Paramita - Maior */}
          <div className="mt-12 sm:mt-16 rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 lg:text-4xl text-center lg:text-left">Parte da rede Ação Paramita</h3>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600">
              A Ação Paramita é uma plataforma de educação e ação em rede, inspirada pelo Lama Padma
              Samten. Seu propósito é o reencantamento da realidade — fortalecendo redes de cooperação
              e auto-organização social através da lucidez, da prática e da convivência.
            </p>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
              O Repositório faz parte dessa grande teia de iniciativas dedicadas ao florescimento do
              Darma no mundo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Image
                src="/ap-logo.webp"
                alt="Ação Paramita"
                width={160}
                height={64}
                className="mx-auto sm:mx-0"
              />
              <a
                id="acao-paramita"
                href="https://acaoparamita.com.br"
                target="_blank"
                rel="noreferrer"
                className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto text-center"
              >
                Acessar Ação Paramita
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Receba as novidades do Repositório <br />e da Ação Paramita
          </h2>
          <p className="mt-4 text-base text-white/80">
            Inscreva-se para receber atualizações sobre novos ensinamentos, transcrições e retiros com
            o Lama Padma Samten.
          </p>
          <a
            href="https://cebb.us3.list-manage.com/subscribe/post?u=c55340ec5081732ed81eff58b&id=7915b02cf2"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-emerald-300"
          >
            📧 Inscreva-se na nossa newsletter
          </a>
          <p className="mt-6 text-xs uppercase tracking-wider text-white/60">
            Newsletter oficial do CEBB
          </p>
        </div>
      </section>
    </main>
  );
}
