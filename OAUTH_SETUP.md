# Configuração OAuth 2.0 para Google Drive

Este guia explica como configurar OAuth 2.0 para fazer upload de arquivos no Google Drive usando uma conta de usuário real (não Service Account).

## ✅ Por que OAuth 2.0?

Service Accounts não têm quota de armazenamento própria. OAuth 2.0 permite usar a quota de uma conta de usuário real do Google, resolvendo o problema de upload.

## 📋 Pré-requisitos

1. Credenciais OAuth 2.0 criadas no Google Cloud Console
2. Client ID e Client Secret
3. Refresh Token (obtido após primeira autorização)

## 🔧 Passo 1: Obter Refresh Token

### 1.1 Configurar variáveis de ambiente temporárias

Adicione ao `.env.local`:

```env
GOOGLE_OAUTH_CLIENT_ID=seu_client_id_aqui
GOOGLE_OAUTH_CLIENT_SECRET=seu_client_secret_aqui
```

### 1.2 Iniciar servidor de desenvolvimento

```bash
npm run dev
```

### 1.3 Obter Refresh Token

1. Acesse no navegador: `http://localhost:3000/api/auth/google`
2. Você será redirecionado para o Google para autorizar o acesso
3. Autorize o acesso ao Google Drive
4. Você será redirecionado para `/api/auth/google/callback`
5. A resposta JSON conterá o `refreshToken`
6. **Copie o `refreshToken`** da resposta

### 1.4 Configurar Refresh Token

Adicione ao `.env.local`:

```env
GOOGLE_OAUTH_REFRESH_TOKEN=seu_refresh_token_aqui
```

## 🔧 Passo 2: Configurar no Vercel (Produção)

1. Acesse o **Dashboard do Vercel**
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `GOOGLE_OAUTH_CLIENT_ID` | `seu_client_id_aqui` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | `seu_client_secret_aqui` |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | `[o refresh token obtido no passo 1.3]` |

4. Selecione os ambientes: **Production**, **Preview**, **Development**
5. Clique em **Save**

## 📝 Arquivo .env.local completo

```env
# OAuth 2.0 Credentials
GOOGLE_OAUTH_CLIENT_ID=seu_client_id_aqui
GOOGLE_OAUTH_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_OAUTH_REFRESH_TOKEN=seu_refresh_token_aqui

# Outras variáveis existentes...
SUPADATA_API_KEY=sua_chave_aqui
YOUTUBE_API_KEY=sua_chave_aqui
```

## ✅ Testar

1. Reinicie o servidor de desenvolvimento
2. Gere uma transcrição
3. Verifique os logs - devem mostrar:
   ```
   [DRIVE UPLOAD] ✅ Autenticação OAuth concluída
   [DRIVE UPLOAD SUCCESS] ✅ DOCX enviado com sucesso
   ```

## 🔄 Renovar Refresh Token

Se o refresh token expirar ou você precisar renovar:

1. Revogue o acesso em: https://myaccount.google.com/permissions
2. Repita os passos 1.3 e 1.4 para obter um novo refresh token

## ⚠️ Segurança

- **NUNCA** commite o `.env.local` no Git
- **NUNCA** compartilhe o `GOOGLE_OAUTH_CLIENT_SECRET` ou `GOOGLE_OAUTH_REFRESH_TOKEN`
- Use variáveis de ambiente no Vercel para produção
- O refresh token dá acesso completo ao Google Drive da conta autorizada

## 🆘 Problemas Comuns

### "Refresh Token não configurado"
- Verifique se `GOOGLE_OAUTH_REFRESH_TOKEN` está no `.env.local`
- Certifique-se de ter obtido o refresh token seguindo o passo 1.3

### "Invalid Grant"
- O refresh token pode ter expirado
- Revogue o acesso e obtenha um novo refresh token

### "Access Denied"
- Verifique se autorizou todos os escopos necessários
- Tente revogar e reautorizar

