# Configuração de Sincronização Automática com YouTube

## Visão Geral

O sistema agora sincroniza automaticamente com o YouTube Data API 2 vezes por dia (13h e 18h UTC), buscando todas as playlists e vídeos do canal e salvando o JSON atualizado no Google Drive na pasta das transcrições.

## Variáveis de Ambiente Necessárias

### No Vercel

Configure as seguintes variáveis de ambiente no painel do Vercel:

1. **YOUTUBE_API_KEY** (já existe)
   - Chave da API do YouTube Data API v3
   - Exemplo: `AIzaSyDl_8EPAngkktSNXRrMMIrD7CSAF4RXXkY`

2. **YOUTUBE_CHANNEL_ID** (opcional - tem valor padrão)
   - ID do canal do YouTube (formato: `UC...`)
   - Valor padrão: `UCz3WPsPTwekahMtKoz9YdmA` (Canal Ação Paramita)
   - Pode ser sobrescrito pela variável de ambiente se necessário
   - Como encontrar: Execute `node scripts/find-channel-id.js` ou acesse o canal no YouTube

3. **GOOGLE_OAUTH_CLIENT_ID** (já existe)
   - Client ID do OAuth 2.0 do Google

4. **GOOGLE_OAUTH_CLIENT_SECRET** (já existe)
   - Client Secret do OAuth 2.0 do Google

5. **GOOGLE_OAUTH_REFRESH_TOKEN** (já existe)
   - Refresh Token do OAuth 2.0 do Google

## Como Funciona

### Cron Jobs

Os cron jobs estão configurados no arquivo `vercel.json`:

- **13h UTC** (10h Brasília no horário padrão, 11h no horário de verão)
- **18h UTC** (15h Brasília no horário padrão, 16h no horário de verão)

### Fluxo de Execução

1. O cron job dispara no horário agendado
2. Chama o endpoint `/api/youtube/sync`
3. Busca todas as playlists do canal usando YouTube Data API v3
4. Busca vídeos standalone (não em playlists)
5. Gera JSON estruturado no formato `youtube-data.json`
6. Faz upload do JSON para Google Drive na pasta `1SKEAfJ8oC0dOq0LGxUt6UtxQXjuvykwg`
7. Sobrescreve o arquivo existente (sem versionamento)

### Estrutura do JSON Gerado

```json
{
  "version": "1.1",
  "generatedAt": "2025-12-08T13:00:00.000Z",
  "playlists": [
    {
      "id": "PLO_7Zoueaxd...",
      "title": "Título da Playlist",
      "description": "...",
      "publishedAt": "2025-09-30T20:32:33.611267Z",
      "itemCount": 10
    }
  ],
  "standaloneVideos": [
    {
      "id": "abc123xyz",
      "title": "Título do Vídeo",
      "description": "...",
      "publishedAt": "2025-09-30T20:32:33.611267Z",
      "thumbnail": "https://..."
    }
  ],
  "updatedAt": "2025-12-08T13:00:00.000Z"
}
```

## Testando Manualmente

### Via Script NPM

Execute a sincronização manualmente usando o script:

```bash
npm run sync:youtube
```

Ou diretamente:

```bash
node scripts/sync-youtube.js
```

### Via URL Direta

Você pode testar a sincronização manualmente acessando:

```
https://repositorio.acaoparamita.com.br/api/youtube/sync
```

Ou localmente (com servidor rodando):

```bash
npm run dev
# Em outro terminal:
curl http://localhost:3000/api/youtube/sync
```

## Logs e Monitoramento

Os logs detalhados estão disponíveis no Vercel:

1. Acesse o painel do Vercel
2. Vá em "Deployments"
3. Clique no deployment mais recente
4. Vá em "Functions" > `/api/youtube/sync`
5. Veja os logs em tempo real

### Logs Esperados

```
[YOUTUBE SYNC] 🚀 Iniciando sincronização com YouTube...
[YOUTUBE SYNC] 📋 Configurações:
[YOUTUBE SYNC]   - Channel ID: UC...
[YOUTUBE SYNC]   - API Key: AIzaSyDl_8...
[YOUTUBE SYNC] 🔍 Buscando playlists do canal: UC...
[YOUTUBE SYNC] ✅ Encontradas X playlists nesta página (total: Y)
[YOUTUBE SYNC] ✅ Total de playlists encontradas: Y
[YOUTUBE SYNC] 🔍 Buscando vídeos standalone do canal: UC...
[YOUTUBE SYNC] ✅ Total de vídeos standalone encontrados: Z
[YOUTUBE SYNC] 📊 Dados coletados:
[YOUTUBE SYNC]   - Playlists: Y
[YOUTUBE SYNC]   - Vídeos standalone: Z
[YOUTUBE SYNC] 🔐 Iniciando autenticação OAuth 2.0...
[YOUTUBE SYNC] ✅ Autenticação OAuth concluída
[YOUTUBE SYNC] 📤 Criando novo arquivo no Drive...
[YOUTUBE SYNC] ✅ Arquivo criado no Drive
[YOUTUBE SYNC] ✅ Upload concluído! ID: ...
[YOUTUBE SYNC] 🔗 Link: https://drive.google.com/...
[YOUTUBE SYNC] ✅ Sincronização concluída em Xms
```

## Tratamento de Erros

### Erro: YOUTUBE_CHANNEL_ID não configurada

**Solução**: Adicione a variável `YOUTUBE_CHANNEL_ID` no Vercel com o ID do canal.

### Erro: YouTube API error: 403

**Causa**: API key inválida ou sem permissões.

**Solução**: 
1. Verifique se a API key está correta
2. Verifique se a YouTube Data API v3 está habilitada no Google Cloud Console
3. Verifique se a API key tem permissões para acessar o canal

### Erro: Rate limiting

**Causa**: Muitas requisições em pouco tempo.

**Solução**: O código já implementa delays entre requisições. Se persistir, aumente os delays no código.

### Erro: OAuth não configurado

**Solução**: Configure as variáveis `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` e `GOOGLE_OAUTH_REFRESH_TOKEN` no Vercel.

## Limitações

1. **Vídeos Standalone**: A busca de vídeos standalone está limitada aos 200 vídeos mais recentes do canal para evitar timeout.

2. **Rate Limiting**: A API do YouTube tem limites de quota. O código implementa delays, mas em canais muito grandes pode ser necessário ajustar.

3. **Horário**: Os cron jobs usam horário UTC. Ajuste conforme necessário no `vercel.json`.

## Próximos Passos

Após configurar as variáveis de ambiente:

1. Faça um deploy no Vercel
2. Aguarde o primeiro cron job (13h ou 18h UTC)
3. Verifique os logs no Vercel
4. Verifique se o arquivo `youtube-data.json` foi criado/atualizado no Google Drive

