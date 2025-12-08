# Configuração OAuth 2.0 para YouTube

## Objetivo

Configurar OAuth 2.0 do YouTube para permitir que a sincronização busque playlists e vídeos **privados** além dos públicos.

## Diferença entre Google Drive OAuth e YouTube OAuth

- **Google Drive OAuth**: Usado para upload/download de arquivos no Google Drive
  - Variáveis: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`
  
- **YouTube OAuth**: Usado para acessar dados privados do YouTube (playlists privadas, etc.)
  - Variáveis: `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, `YOUTUBE_OAUTH_REFRESH_TOKEN`

## Passo 0: Configurar Redirect URIs no Google Cloud Console

**IMPORTANTE:** Antes de começar, você precisa adicionar os redirect URIs no Google Cloud Console:

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Selecione o projeto "audioslama"
3. Clique no OAuth 2.0 Client ID do YouTube (projeto "audioslama")
4. Em "Authorized redirect URIs", adicione:
   - `http://localhost:3000/api/auth/youtube/callback` (para desenvolvimento)
   - `https://repositorio.acaoparamita.com.br/api/auth/youtube/callback` (para produção)
5. Clique em "Save"

## Passo 1: Configurar Variáveis de Ambiente Locais

Adicione as seguintes variáveis ao arquivo `.env.local` na raiz do projeto:

```bash
# OAuth do YouTube (para playlists privadas)
YOUTUBE_OAUTH_CLIENT_ID=seu_client_id_youtube_aqui
YOUTUBE_OAUTH_CLIENT_SECRET=seu_client_secret_youtube_aqui
YOUTUBE_OAUTH_REFRESH_TOKEN=seu_refresh_token_aqui
```

**Nota:** Os valores reais estão disponíveis no arquivo `YOUTUBE_OAUTH_CREDENTIALS.local.json` (não versionado) ou no Google Cloud Console no projeto "audioslama".

**Nota:** O `YOUTUBE_OAUTH_REFRESH_TOKEN` será obtido no próximo passo.

## Passo 2: Obter o Refresh Token

### 2.1. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 2.2. Acessar o Endpoint OAuth

Abra seu navegador e acesse:

```
http://localhost:3000/api/auth/youtube
```

Isso redirecionará você para a página de autorização do Google.

### 2.3. Autorizar o Acesso

1. Faça login com sua conta Google (a mesma que tem acesso às playlists privadas)
2. Revise os escopos solicitados:
   - `https://www.googleapis.com/auth/youtube.readonly` (leitura apenas)
3. Clique em "Permitir" ou "Allow"

### 2.4. Copiar o Refresh Token

Após autorizar, você será redirecionado para uma página que mostra:
- ✅ Refresh Token (se recebido)
- ⚠️ Instruções caso não receba

**Se recebeu o refresh token:**
1. Clique no botão "📋 Copiar Token"
2. Cole no arquivo `.env.local` na variável `YOUTUBE_OAUTH_REFRESH_TOKEN`
3. Salve o arquivo

**Se NÃO recebeu o refresh token:**
1. Acesse: https://myaccount.google.com/permissions
2. Encontre o app "audioslama" ou seu projeto
3. Clique em "Remover acesso"
4. Volte e acesse novamente: `http://localhost:3000/api/auth/youtube`
5. Agora o refresh token deve aparecer

### 2.5. Reiniciar o Servidor

Após adicionar o refresh token ao `.env.local`, reinicie o servidor:

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

## Passo 3: Configurar no Vercel (Produção)

No painel do Vercel, adicione as mesmas variáveis de ambiente:

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - `YOUTUBE_OAUTH_CLIENT_ID` = (obtenha no Google Cloud Console, projeto "audioslama")
   - `YOUTUBE_OAUTH_CLIENT_SECRET` = (obtenha no Google Cloud Console, projeto "audioslama")
   - `YOUTUBE_OAUTH_REFRESH_TOKEN` = (o refresh token obtido no passo 2)

**Nota:** Para obter o refresh token em produção, você pode:
- Usar o mesmo refresh token obtido localmente (funciona para a mesma conta)
- Ou acessar `https://repositorio.acaoparamita.com.br/api/auth/youtube` em produção

## Passo 4: Verificar Funcionamento

Após configurar, execute a sincronização:

```bash
npm run sync:youtube
```

Você deve ver nos logs:
```
[YOUTUBE SYNC] 🔐 Usando OAuth do YouTube para buscar playlists (incluindo privadas)...
```

Se aparecer:
```
[YOUTUBE SYNC] 📝 Usando API Key apenas (playlists públicas)...
```

Significa que as variáveis de ambiente não estão configuradas corretamente.

## Endpoints Criados

- **GET `/api/auth/youtube`**: Inicia o fluxo OAuth do YouTube
- **GET `/api/auth/youtube/callback`**: Recebe o callback e exibe o refresh token

## Escopos Utilizados

- `https://www.googleapis.com/auth/youtube.readonly`: Permite leitura de dados do YouTube (playlists, vídeos, etc.)

## Troubleshooting

### Erro: "YouTube OAuth credentials not configured"
- Verifique se as variáveis `YOUTUBE_OAUTH_CLIENT_ID` e `YOUTUBE_OAUTH_CLIENT_SECRET` estão no `.env.local`
- Reinicie o servidor após adicionar as variáveis

### Refresh Token não aparece
- Revogue o acesso em https://myaccount.google.com/permissions
- Tente autorizar novamente
- Certifique-se de usar `prompt=consent` no fluxo OAuth (já está configurado)

### Sincronização ainda busca apenas playlists públicas
- Verifique se `YOUTUBE_OAUTH_REFRESH_TOKEN` está configurado
- Verifique os logs da sincronização para ver qual método está sendo usado
- Certifique-se de que as variáveis estão no ambiente correto (local vs Vercel)
