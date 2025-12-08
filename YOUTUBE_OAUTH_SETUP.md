# Configuração OAuth 2.0 para YouTube

## Credenciais OAuth do YouTube

As credenciais OAuth 2.0 do YouTube devem ser configuradas no Vercel.

## Variáveis de Ambiente para Vercel

Adicione as seguintes variáveis de ambiente no Vercel:

```
YOUTUBE_OAUTH_CLIENT_ID=seu_client_id_youtube_aqui
YOUTUBE_OAUTH_CLIENT_SECRET=seu_client_secret_youtube_aqui
```

**Nota:** As credenciais reais estão disponíveis no Google Cloud Console no projeto "audioslama".

**Nota:** O refresh token do YouTube será obtido quando necessário através do fluxo OAuth.

## Diferença entre Google Drive OAuth e YouTube OAuth

- **Google Drive OAuth**: Usado para upload/download de arquivos no Google Drive
  - Variáveis: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`
  
- **YouTube OAuth**: Usado para acessar dados privados do YouTube (playlists privadas, etc.)
  - Variáveis: `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, `YOUTUBE_OAUTH_REFRESH_TOKEN` (quando necessário)

## Uso Atual

Atualmente, a sincronização usa apenas `YOUTUBE_API_KEY` para buscar informações de playlists/vídeos por ID. Isso funciona para playlists e vídeos públicos.

Se no futuro precisar acessar playlists privadas, será necessário usar OAuth do YouTube com escopos:
- `https://www.googleapis.com/auth/youtube.readonly`
- `https://www.googleapis.com/auth/youtube`

