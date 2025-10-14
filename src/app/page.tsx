import {
  ArrowRight,
  Flower2 as LotusIcon,
  Globe2,
  Headphones,
  Infinity as InfinityIcon,
  PlayCircle,
  Search,
  Sparkles,
} from 'lucide-react';

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

const stats = [
  { label: 'playlists de ensinamentos', value: '300+' },
  { label: 'horas de conteúdo disponível', value: '1000+' },
  { label: 'conteúdo pesquisável', value: '100%' },
  { label: 'possibilidades de prática e contemplação', value: '∞' },
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

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-24 sm:px-6 lg:px-8 lg:flex-row lg:py-32">
          <div className="w-full max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100 backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden />
              Um cuidado da rede CEBB
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Repositório Lama Padma Samten
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-700 sm:text-xl">
              Ensinamentos, palestras e retiros oferecidos pelo Lama Padma Samten e pela rede CEBB —
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
        </div>
      </section>

      <section className="bg-white py-20" id="sobre">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-100">
            🎧 O que é o Repositório
          </span>
          <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">
            Um espaço para o estudo e contemplação do Darma
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
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="relative flex-1 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100 via-white to-rose-100 p-10 shadow-lg">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-indigo-200/40 blur-2xl"></div>
            <div className="absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-rose-200/40 blur-2xl"></div>
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-indigo-700 shadow ring-1 ring-indigo-100 backdrop-blur">
                Sobre Lama Padma Samten
              </span>
              <p className="mt-6 text-lg leading-relaxed text-slate-700">
                Lama Padma Samten é mestre budista e fundador do CEBB. Físico pela UFRGS, encontrou
                na física quântica pontes para dialogar com a visão budista e, desde então, dedica-se
                ao ensinamento do Darma como um caminho de lucidez, equilíbrio e compaixão. Por meio de
                suas palestras e livros, inspira pessoas a transformarem suas vidas e redes de
                convivência.
              </p>
              <a
                href="https://acaoparamita.org/agenda"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
              >
                📅 Ver Agenda e Ensinamentos Recentes
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          <div className="flex-1 rounded-3xl border border-slate-200 p-10 shadow-sm">
            <h3 className="text-2xl font-semibold text-slate-900">Parte da rede Ação Paramita</h3>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              A Ação Paramita é uma plataforma de educação e ação em rede, inspirada pelo Lama Padma
              Samten. Seu propósito é o reencantamento da realidade — fortalecendo redes de cooperação
              e auto-organização social através da lucidez, da prática e da convivência.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              O Repositório faz parte dessa grande teia de iniciativas dedicadas ao florescimento do
              Darma no mundo.
            </p>
            <a
              id="acao-paramita"
              href="https://acaoparamita.org"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500/20"
            >
              🌍 Conheça a Ação Paramita
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-600 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">O Repositório em Números</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl bg-white/10 p-8 text-center shadow-lg backdrop-blur transition hover:bg-white/15"
              >
                <div className="text-5xl font-extrabold">
                  {stat.value === '∞' ? (
                    <InfinityIcon className="mx-auto h-14 w-14" aria-hidden />
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="mt-4 text-sm font-medium uppercase tracking-wide text-white/80">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Um convite à escuta e à transformação
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-700">
            Os ensinamentos aqui reunidos são um convite à escuta profunda e ao cultivo da lucidez.
            Que cada palavra e cada silêncio possam inspirar o florescimento de sabedoria, compaixão e
            alegria em todos os seres.
          </p>
          <a
            href="/playlists"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-10 py-4 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            🌼 Comece a Explorar Agora
            <ArrowRight className="h-5 w-5" aria-hidden />
          </a>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Receba as novidades do Repositório e da Ação Paramita
          </h2>
          <p className="mt-4 text-base text-white/80">
            Inscreva-se para receber atualizações sobre novos ensinamentos, transcrições e retiros com
            o Lama Padma Samten.
          </p>
          <form className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <label htmlFor="newsletter-email" className="sr-only">
              E-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Seu e-mail"
              className="h-12 w-full max-w-sm rounded-full border border-white/20 bg-white/10 px-6 text-base text-white placeholder:text-white/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-400 px-8 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
            >
              Inscrever-se
            </button>
          </form>
          <p className="mt-6 text-xs uppercase tracking-wider text-white/60">
            Integração futura:{' '}
            <code className="rounded bg-white/10 px-2 py-1">[fluentform id=&quot;3&quot;]</code>
          </p>
        </div>
      </section>
    </main>
  );
}
