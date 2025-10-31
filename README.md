# Biblioteca Digital de Mídia - CEBB YouTube

Uma plataforma web moderna para hospedar, catalogar e reproduzir coleções de gravações de áudio e vídeo com metadados e transcrições pesquisáveis. Inspirada na "Chögyam Trungpa Digital Library at Naropa University" e integrada com dados reais do YouTube do CEBB (Centro de Estudos Budistas Bodisatva).

## 🚀 Funcionalidades Implementadas

### ✅ Integração com YouTube
- **Dados Reais**: Integração com playlists reais do YouTube do CEBB
- **Player Integrado**: Reprodução de vídeos do YouTube diretamente na plataforma
- **Links Externos**: Botões para abrir conteúdo diretamente no YouTube
- **Thumbnails**: Imagens reais das playlists do YouTube
- **Metadados**: Extração automática de informações dos títulos

### ✅ Sistema de Filtros Avançados
- **Filtro por Ano**: Explore conteúdo por período (2009-2025)
- **Filtro por Localização**: Filtre por cidade/região (SP, Rio, BH, Curitiba, etc.)
- **Filtro por Tipo**: Separe vídeos por formato
- **Busca Textual**: Pesquise em títulos e descrições
- **Estatísticas**: Contadores dinâmicos de playlists, anos e localizações

### ✅ Interface Moderna
- **Design Responsivo**: Adaptável para desktop, tablet e mobile
- **Badges Visuais**: Indicadores para conteúdo do YouTube e destaques
- **Skeleton Loading**: Carregamento suave com indicadores visuais
- **Navegação Intuitiva**: Menu hambúrguer para dispositivos móveis

### ✅ Páginas Implementadas
- **Homepage**: Página inicial com informações do projeto
- **Playlists**: Grid de playlists com filtros e estatísticas
- **Detalhes da Playlist**: Página completa com player e sidebar
- **Sobre**: Informações sobre o projeto e links externos
- **Recursos**: Descrição das funcionalidades da plataforma
- **Coleções**: Organização temática do conteúdo

## 📊 Dados Reais Integrados

### Playlists do YouTube (20+ playlists)
- **Retiros**: Retiros de inverno, meditação, elementos
- **Palestras**: Ensinamentos sobre meditação, sabedoria, relações
- **Cursos**: Estudos de aprofundamento, sutras, práticas
- **Eventos**: Mini-retiros, encontros, workshops

### Metadados Extraídos Automaticamente
- **Temas**: Meditação, Retiro, Estudo, Palestra, Curso, Sutras
- **Localizações**: SP, Rio, BH, Curitiba, Londrina, Paris, Lisboa
- **Anos**: 2009-2025 (conteúdo histórico e atual)
- **Tipos de Evento**: Retiro, Palestra, Curso, Estudo de Aprofundamento

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15**: Framework React com App Router
- **TypeScript**: Tipagem estática para JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **React Player**: Biblioteca para reprodução de mídia (YouTube)
- **Lucide React**: Ícones modernos e consistentes

### Dados
- **YouTube API**: Integração com playlists reais
- **TypeScript Interfaces**: Tipos bem definidos
- **Conversão Automática**: Transformação de dados do YouTube para formato da aplicação

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal com Header
│   ├── page.tsx           # Página inicial (Sobre)
│   ├── globals.css        # Estilos globais
│   ├── playlists/         # Página de playlists com filtros
│   ├── playlist/[id]/     # Página de detalhes da playlist
│   ├── sobre/             # Página sobre
│   ├── recursos/          # Página de recursos
│   └── colecoes/          # Página de coleções
├── components/            # Componentes React
│   ├── Header.tsx         # Cabeçalho da aplicação
│   ├── PlaylistCard.tsx   # Cartão de playlist com dados do YouTube
│   ├── SkeletonCard.tsx   # Loading skeleton
│   ├── MediaPlayer.tsx    # Player de mídia (YouTube)
│   └── Sidebar.tsx        # Sidebar da playlist
├── data/                  # Dados e conversões
│   ├── youtubeData.ts     # Dados reais do YouTube convertidos
│   └── mockData.ts        # Dados de exemplo (transcrições)
├── types/                 # Definições TypeScript
│   └── index.ts           # Interfaces e tipos
└── lib/                   # Utilitários (preparado para futuras funcionalidades)
```

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd repositoriolama
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute o projeto em modo de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar build de produção
npm start

# Linting
npm run lint
```

## 🎨 Funcionalidades da Interface

### Página de Playlists
- **Grid Responsivo**: Layout adaptável para diferentes telas
- **Filtros Avançados**: Por ano, localização e tipo
- **Estatísticas**: Contadores dinâmicos de conteúdo
- **Busca**: Pesquisa em tempo real
- **Badges**: Indicadores visuais para YouTube e destaques

### Página de Detalhes
- **Player Integrado**: Reprodução de vídeos do YouTube
- **Sidebar Interativa**: Abas para playlist e informações
- **Metadados Completos**: Informações detalhadas de cada vídeo
- **Links Externos**: Acesso direto ao YouTube
- **Compartilhamento**: Funcionalidade de compartilhar playlists

### Design System
- **Cores**: Paleta consistente com azul primário e vermelho do YouTube
- **Tipografia**: Hierarquia clara de textos
- **Espaçamentos**: Sistema de espaçamento consistente
- **Componentes**: Componentes reutilizáveis e modulares

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px (menu hambúrguer, layout em coluna)
- **Tablet**: 768px - 1024px (layout híbrido)
- **Desktop**: > 1024px (layout completo com sidebar)

### Adaptações
- **Menu**: Hambúrguer em mobile, horizontal em desktop
- **Grid**: 1 coluna em mobile, 2-3 colunas em desktop
- **Player**: Altura adaptável conforme dispositivo
- **Sidebar**: Colapso em mobile, fixa em desktop

## 🔧 Configuração para Produção

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# URLs de mídia (exemplo)
NEXT_PUBLIC_MEDIA_BASE_URL=https://your-cdn.com/media/

# Configurações de autenticação (futuro)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Supadata API Key para transcrições automáticas
# Obtenha sua chave em: https://dash.supadata.ai/
# Plano gratuito oferece 100 requisições/mês
SUPADATA_API_KEY=your_supadata_api_key_here
```

### Transcrições Automáticas

O projeto integra com a [Supadata YouTube Transcript API](https://supadata.ai/) para gerar transcrições automáticas de vídeos do YouTube.

#### Configuração

1. **Obter chave de API:**
   - Acesse https://dash.supadata.ai/
   - Crie uma conta (plano gratuito disponível)
   - Copie sua chave de API

2. **Configurar variável de ambiente:**
   - Adicione `SUPADATA_API_KEY` no arquivo `.env.local`
   - Para produção, configure a variável no seu provedor de hosting

#### Funcionalidades

- **Geração automática de transcrições** usando legendas do YouTube
- **Cache inteligente** - transcrições são salvas em `public/transcripts/` e reutilizadas
- **Suporte a múltiplos idiomas** - detecta automaticamente o idioma (PT/EN)
- **Download em formato .srt** - transcrições podem ser baixadas
- **Tratamento de erros** - mensagens amigáveis para vídeos sem transcrição, rate limits, etc.

#### Limites

- **Plano gratuito:** 100 requisições/mês
- **Rate limits:** A API retornará erro 429 quando o limite for atingido
- **Vídeos sem legendas:** Apenas vídeos com legendas disponíveis no YouTube podem ser transcritos

#### Uso

1. Navegue até uma playlist
2. Selecione um vídeo
3. Clique na aba "Transcrição"
4. Clique em "Gerar Transcrição Automática"
5. Aguarde o processamento (pode levar alguns segundos)
6. Baixe ou visualize a transcrição gerada

#### Armazenamento

As transcrições são salvas em `public/transcripts/{videoId}.srt` e servidas como arquivos estáticos. O diretório `public/transcripts/` é criado automaticamente na primeira transcrição.

**Configuração no Servidor (Primeira vez):**
- O diretório é criado automaticamente pelo código quando necessário
- O script de deploy (`deploy.sh`) garante que o diretório existe antes e depois do deploy
- O diretório `public/transcripts/` é preservado entre deploys (excluído do rsync delete)
- Permissões: O código tenta criar o diretório com permissões adequadas (755)

**Persistência:**
- Arquivos `.srt` são preservados entre deploys
- O script de deploy exclui `public/transcripts/` do rsync `--delete` para manter os arquivos
- Se o diretório for deletado, será recriado automaticamente na próxima transcrição

**Nota:** Removemos `output: 'export'` do `next.config.ts` para habilitar API routes server-side. Isso muda a estratégia de deploy de estático para server-side. Verifique se seu hosting suporta Next.js server-side antes de fazer deploy.

### Deploy

#### Vercel (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente (incluindo `SUPADATA_API_KEY`)
3. Deploy automático a cada push
4. **Importante:** Vercel suporta Next.js server-side e API routes por padrão

#### Outras Plataformas
- **Netlify**: Compatível com Next.js (requer configuração para API routes)
- **Railway**: Para aplicações full-stack (recomendado para server-side)
- **Heroku**: Com configuração adicional
- **VPS/Server próprio**: Requer Node.js e configuração de servidor

**Atenção:** Com a remoção de `output: 'export'`, o projeto agora requer um ambiente que suporte Next.js server-side para que as API routes funcionem corretamente.

## 📈 Estatísticas do Conteúdo

### Playlists Disponíveis
- **Total**: 20+ playlists ativas
- **Período**: 2009-2025 (16 anos de conteúdo)
- **Localizações**: 10+ cidades brasileiras e internacionais
- **Temas**: 8+ categorias temáticas

### Tipos de Conteúdo
- **Retiros**: Meditação, elementos, práticas espirituais
- **Palestras**: Ensinamentos públicos e abertos
- **Cursos**: Estudos aprofundados e especializados
- **Eventos**: Mini-retiros e workshops

## 🤝 Contribuição

### Fluxo de Trabalho Git
1. **Branches**: Use branches para features (`feature/nome-da-feature`)
2. **Commits**: Commits atômicos e descritivos
3. **Pull Requests**: Todo código deve passar por PR
4. **Code Review**: Revisão obrigatória antes do merge

### Padrões de Código
- **TypeScript**: Tipagem obrigatória
- **ESLint**: Linting automático
- **Prettier**: Formatação consistente
- **Conventional Commits**: Padrão de mensagens de commit

## 🔗 Links Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Player](https://github.com/cookpete/react-player)
- [Lucide Icons](https://lucide.dev/)
- [CEBB - Centro de Estudos Budistas Bodisatva](https://cebb.org.br)

## 📞 Suporte

Para dúvidas ou sugestões sobre o projeto, abra uma issue no repositório GitHub.

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e Tailwind CSS**

**Integrado com dados reais do YouTube do CEBB - Centro de Estudos Budistas Bodisatva**
