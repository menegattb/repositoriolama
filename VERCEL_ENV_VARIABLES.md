# Variáveis de Ambiente para Vercel

Este documento lista todas as variáveis de ambiente necessárias para configurar o projeto no Vercel.

## 📋 Variáveis Obrigatórias

### 🔵 Google OAuth 2.0 (Para upload no Google Drive)
Essas variáveis são **obrigatórias** para que as transcrições sejam salvas no Google Drive.

```
GOOGLE_OAUTH_CLIENT_ID=seu_client_id_aqui
GOOGLE_OAUTH_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_OAUTH_REFRESH_TOKEN=seu_refresh_token_aqui
```

**Como obter:**
- `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET`: Obtidos no Google Cloud Console (veja `OAUTH_SETUP.md`)
- `GOOGLE_OAUTH_REFRESH_TOKEN`: Obtido através do fluxo OAuth (veja `OAUTH_SETUP.md`)

**⚠️ IMPORTANTE:** 
- Para gerar um novo refresh token, acesse: `https://repositorio.acaoparamita.com.br/api/auth/google` (após configurar as outras variáveis)
- Veja `OAUTH_SETUP.md` para mais detalhes

---

### 🔵 Google Drive API Key (Para leitura de arquivos públicos)
Essa variável é **obrigatória** para buscar transcrições do Google Drive.

```
GOOGLE_DRIVE_API_KEY=sua_chave_api_do_google_drive
```

**Como obter:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em "APIs & Services" > "Credentials"
3. Crie uma "API Key" ou use uma existente
4. Ative a "Google Drive API" para este projeto

**⚠️ IMPORTANTE:** Esta chave é apenas para **leitura** de arquivos públicos. O upload usa OAuth 2.0.

---

### 🔵 Supadata API (Para geração de transcrições)
Essa variável é **obrigatória** para gerar transcrições automáticas.

```
SUPADATA_API_KEY=sua_chave_supadata_aqui
```

**Como obter:**
- Acesse o painel da Supadata
- Crie uma nova API key ou use uma existente

---

### 🔵 YouTube Data API (Para buscar vídeos das playlists)
Essa variável é **obrigatória** para buscar informações dos vídeos do YouTube.

```
YOUTUBE_API_KEY=sua_chave_youtube_api_aqui
```

**Como obter:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em "APIs & Services" > "Credentials"
3. Crie uma "API Key" ou use uma existente
4. Ative a "YouTube Data API v3" para este projeto

---

## 📋 Variáveis Opcionais

### 🟡 Hostinger API URL (Opcional)
Usado para upload de arquivos SRT para o servidor Hostinger (funcionalidade legada).

```
HOSTINGER_API_URL=https://acaoparamita.com.br
```

**Padrão:** `https://acaoparamita.com.br` (já configurado como padrão no código)

---

## 📝 Como Configurar no Vercel

### Passo 1: Acessar o Painel do Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Selecione o projeto `repositoriolama` ou `repositorio`

### Passo 2: Adicionar Variáveis de Ambiente
1. Vá em **Settings** > **Environment Variables**
2. Adicione cada variável uma por uma:

#### Variáveis Obrigatórias (substitua os valores pelos seus):

```
GOOGLE_OAUTH_CLIENT_ID=seu_client_id_aqui
GOOGLE_OAUTH_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_OAUTH_REFRESH_TOKEN=seu_refresh_token_aqui
GOOGLE_DRIVE_API_KEY=sua_chave_api_do_google_drive
SUPADATA_API_KEY=sua_chave_supadata_aqui
YOUTUBE_API_KEY=sua_chave_youtube_api_aqui
```

**⚠️ IMPORTANTE:** Substitua todos os valores `seu_*_aqui` pelas chaves reais que você tem no `.env.local` ou que obteve seguindo os guias de configuração.

#### Variáveis Opcionais:

```
HOSTINGER_API_URL=https://acaoparamita.com.br
```

### Passo 3: Configurar Ambientes
Para cada variável, selecione os ambientes onde ela será usada:
- ✅ **Production** (obrigatório)
- ✅ **Preview** (recomendado para testar)
- ✅ **Development** (opcional, se usar Vercel CLI)

### Passo 4: Fazer Deploy
1. Após adicionar todas as variáveis, faça um novo deploy:
   - Vá em **Deployments**
   - Clique em **Redeploy** no último deployment
   - Ou faça push para a branch `main` no GitHub

---

## ✅ Checklist de Configuração

Antes de fazer deploy, verifique se todas as variáveis estão configuradas:

- [ ] `GOOGLE_OAUTH_CLIENT_ID` ✅
- [ ] `GOOGLE_OAUTH_CLIENT_SECRET` ✅
- [ ] `GOOGLE_OAUTH_REFRESH_TOKEN` ✅
- [ ] `GOOGLE_DRIVE_API_KEY` ⚠️ (precisa configurar)
- [ ] `SUPADATA_API_KEY` ✅
- [ ] `YOUTUBE_API_KEY` ✅
- [ ] `HOSTINGER_API_URL` (opcional) ✅

---

## 🔍 Verificação Pós-Deploy

Após o deploy, teste as seguintes funcionalidades:

1. **Buscar vídeos de playlist:**
   - Acesse uma playlist
   - Verifique se os vídeos são carregados corretamente
   - Se não carregar, verifique `YOUTUBE_API_KEY`

2. **Gerar transcrição:**
   - Clique em "Solicitar Transcrição" em um vídeo
   - Verifique se a transcrição é gerada
   - Se falhar, verifique `SUPADATA_API_KEY`

3. **Salvar no Google Drive:**
   - Após gerar uma transcrição, verifique se aparece no Drive
   - Acesse: https://drive.google.com/drive/folders/1SKEAfJ8oC0dOq0LGxUt6UtxQXjuvykwg
   - Se não salvar, verifique as variáveis OAuth (`GOOGLE_OAUTH_*`)

4. **Buscar transcrição do Drive:**
   - Acesse um vídeo que já tem transcrição no Drive
   - Verifique se a transcrição é carregada automaticamente
   - Se não carregar, verifique `GOOGLE_DRIVE_API_KEY`

---

## 🆘 Troubleshooting

### Erro: "OAuth credentials not configured"
- **Causa:** Variáveis `GOOGLE_OAUTH_*` não configuradas
- **Solução:** Adicione todas as 3 variáveis OAuth no Vercel

### Erro: "YouTube API key not configured"
- **Causa:** `YOUTUBE_API_KEY` não configurada
- **Solução:** Adicione a variável no Vercel

### Erro: "SUPADATA_API_KEY não configurada"
- **Causa:** `SUPADATA_API_KEY` não configurada
- **Solução:** Adicione a variável no Vercel

### Erro: "Acesso negado à API do Google Drive"
- **Causa:** `GOOGLE_DRIVE_API_KEY` inválida ou não configurada
- **Solução:** Verifique se a chave está correta e se a API está ativada

### Transcrições não aparecem no Drive após gerar
- **Causa:** Problema com OAuth ou refresh token expirado
- **Solução:** 
  1. Verifique se todas as variáveis OAuth estão configuradas
  2. Se necessário, gere um novo refresh token acessando `/api/auth/google`

---

## 📚 Documentação Adicional

- `OAUTH_SETUP.md` - Guia completo de configuração OAuth 2.0
- `ADICIONAR_TESTADOR_OAUTH.md` - Como adicionar testadores ao OAuth
- `PUBLICAR_APP_OAUTH.md` - Como publicar o app OAuth para produção
- `VERIFICAR_YOUTUBE_API.md` - Troubleshooting da API do YouTube

---

## 🔐 Segurança

⚠️ **IMPORTANTE:** 
- Nunca commite arquivos `.env.local` ou `.env` no Git
- As variáveis de ambiente no Vercel são seguras e não aparecem nos logs públicos
- Mantenha as chaves de API privadas e não compartilhe publicamente

