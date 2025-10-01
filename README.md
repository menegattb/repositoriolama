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
```

### Deploy

#### Vercel (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

#### Outras Plataformas
- **Netlify**: Compatível com Next.js
- **Railway**: Para aplicações full-stack
- **Heroku**: Com configuração adicional

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
