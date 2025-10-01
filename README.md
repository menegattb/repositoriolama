# Biblioteca Digital de Mídia

Uma plataforma web moderna para hospedar, catalogar e reproduzir coleções de gravações de áudio e vídeo com metadados e transcrições pesquisáveis. Inspirada na "Chögyam Trungpa Digital Library at Naropa University".

## 🚀 Funcionalidades

### Estrutura Geral e Navegação
- **Header Fixo**: Logo, navegação (Playlists, Recursos, Coleções, Sobre), botões de Doação e Login
- **Design Responsivo**: Interface adaptável para desktop, tablet e mobile
- **Navegação Intuitiva**: Menu hambúrguer para dispositivos móveis

### Página "Sobre" (Homepage)
- Página estática com descrição do projeto
- Links externos para organizações relacionadas
- Seção de recursos e funcionalidades
- Call-to-action para explorar playlists

### Página de "Playlists"
- Grade de cartões de playlists com thumbnails
- Efeito de skeleton loading durante carregamento
- Sistema de busca e filtros
- Metadados resumidos (número de talks, ano, local, formato)
- Selos de "Destaque" para playlists especiais

### Página de Detalhes da Playlist / Player de Mídia
- **Coluna Esquerda (Conteúdo Principal)**:
  - Informações detalhadas da série
  - Player de áudio/vídeo integrado com controles customizados
  - Botão de compartilhamento
- **Coluna Direita (Sidebar Interativa)**:
  - Aba "Playlist": Lista completa de faixas com busca
  - Aba "Ouvindo Agora": Informações detalhadas da faixa atual
  - Sub-abas "Descrição" e "Transcrição"
  - Sincronização de transcrição com a mídia
  - Timestamps clicáveis para navegação

### Funcionalidade de Pesquisa
- Pesquisa na transcrição da faixa atual
- Pesquisa/filtro na playlist
- Busca global na biblioteca (estrutura preparada)

### Autenticação e Usuários
- Sistema de login básico (estrutura implementada)
- Preparado para expansão futura com gerenciamento de playlists pessoais

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15**: Framework React com App Router
- **TypeScript**: Tipagem estática para JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **React Player**: Biblioteca para reprodução de mídia
- **Lucide React**: Ícones modernos e consistentes

### Estrutura de Dados
- **TypeScript Interfaces**: Tipos bem definidos para MediaItem, Playlist, Transcript, User
- **Dados Mock**: Estrutura de dados de exemplo para desenvolvimento
- **Preparado para Backend**: Estrutura pronta para integração com API

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal com Header
│   ├── page.tsx           # Página inicial (Sobre)
│   ├── globals.css        # Estilos globais
│   ├── playlists/         # Página de playlists
│   ├── playlist/[id]/     # Página de detalhes da playlist
│   ├── sobre/             # Página sobre
│   ├── recursos/           # Página de recursos
│   └── colecoes/          # Página de coleções
├── components/            # Componentes React
│   ├── Header.tsx         # Cabeçalho da aplicação
│   ├── PlaylistCard.tsx   # Cartão de playlist
│   ├── SkeletonCard.tsx   # Loading skeleton
│   ├── MediaPlayer.tsx    # Player de mídia
│   └── Sidebar.tsx        # Sidebar da playlist
├── types/                 # Definições TypeScript
│   └── index.ts           # Interfaces e tipos
├── data/                  # Dados mock
│   └── mockData.ts        # Dados de exemplo
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

## 🎨 Design e UX

### Características do Design
- **Design System Consistente**: Cores, tipografia e espaçamentos padronizados
- **Interface Limpa**: Foco no conteúdo com navegação intuitiva
- **Responsividade**: Adaptável a todos os tamanhos de tela
- **Acessibilidade**: Contraste adequado e navegação por teclado
- **Performance**: Carregamento rápido com skeleton loading

### Paleta de Cores
- **Primária**: Azul (#3B82F6)
- **Secundária**: Roxo (#8B5CF6)
- **Sucesso**: Verde (#10B981)
- **Aviso**: Amarelo (#F59E0B)
- **Erro**: Vermelho (#EF4444)
- **Neutros**: Escala de cinzas para textos e backgrounds

## 📱 Funcionalidades Implementadas

### ✅ Completas
- [x] Header responsivo com navegação
- [x] Página inicial com informações do projeto
- [x] Página de playlists com grid e busca
- [x] Página de detalhes da playlist
- [x] Player de mídia integrado
- [x] Sidebar com abas Playlist e Ouvindo Agora
- [x] Sistema de transcrições com timestamps
- [x] Busca em playlists e transcrições
- [x] Design responsivo
- [x] Skeleton loading
- [x] Páginas adicionais (Sobre, Recursos, Coleções)

### 🔄 Em Desenvolvimento
- [ ] Sistema de autenticação completo
- [ ] Backend com API
- [ ] Banco de dados
- [ ] Upload de arquivos de mídia
- [ ] Busca global avançada
- [ ] Sistema de favoritos
- [ ] Analytics e métricas

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

## 📄 Licença

Este projeto é desenvolvido como uma réplica educacional da "Chögyam Trungpa Digital Library at Naropa University". 

## 🔗 Links Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Player](https://github.com/cookpete/react-player)
- [Lucide Icons](https://lucide.dev/)

## 📞 Suporte

Para dúvidas ou sugestões sobre o projeto, abra uma issue no repositório GitHub.

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e Tailwind CSS**
