# Verificar se YouTube API está funcionando

## ⚠️ IMPORTANTE: Reiniciar o Servidor

Após adicionar `YOUTUBE_API_KEY` ao `.env.local`, você **DEVE** reiniciar o servidor:

1. **Pare o servidor atual**: Pressione `Ctrl+C` no terminal onde está rodando
2. **Inicie novamente**:
   ```bash
   cd repositoriolama
   npm run dev
   ```

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar Logs do Servidor

Após reiniciar, ao acessar uma playlist, você deve ver nos logs do terminal:

```
[API /api/youtube/playlist/[id]/videos] ✅ YouTube API key encontrada
[API /api/youtube/playlist/[id]/videos] 🔍 Buscando vídeos da playlist: PLAYLIST_ID
[API /api/youtube/playlist/[id]/videos] ✅ Retornando X vídeos
```

### 2. Verificar Console do Navegador

No console do navegador (F12), você deve ver:

```
[PlaylistDetailClient] ✅ Vídeos reais encontrados da API: X
[PlaylistDetailClient] ✅ Usando vídeos reais da API do YouTube
```

### 3. Verificar se os Vídeos Têm IDs Válidos

Os vídeos devem ter:
- IDs com 11 caracteres (ex: `dQw4w9WgXcQ`)
- URLs como `https://www.youtube.com/watch?v=VIDEO_ID`
- **NÃO** devem ter IDs como `playlist-id-1` ou `playlist-id-2`

## ❌ Se Ainda Não Funcionar

### Erro: "YouTube API key not configured"

**Causa**: Servidor não foi reiniciado ou variável não está no `.env.local`

**Solução**:
1. Verifique se `.env.local` contém:
   ```bash
   YOUTUBE_API_KEY=AIzaSyDl_8EPAngkktSNXRrMMIrD7CSAF4RXXkY
   ```
2. Reinicie o servidor completamente (pare e inicie novamente)

### Erro: "YouTube API error: 403"

**Causa**: API key inválida ou sem permissões

**Solução**:
1. Verifique se a API key está correta
2. Verifique se a API do YouTube está habilitada no Google Cloud Console
3. Verifique se a API key tem permissões para acessar YouTube Data API v3

### Erro: "YouTube API error: 400"

**Causa**: Playlist ID inválido ou API key sem acesso

**Solução**: Verifique se o ID da playlist está correto

## 🧪 Teste Manual da API

Você pode testar diretamente no navegador:

```
http://localhost:3000/api/youtube/playlist/PLO_7Zoueaxd5830FzaNUvkkIO5BG2z04n/videos
```

Deve retornar um JSON com `videos` array contendo os vídeos da playlist.

## 📝 Checklist

- [ ] `YOUTUBE_API_KEY` adicionada ao `.env.local`
- [ ] Servidor reiniciado após adicionar a variável
- [ ] Logs mostram "✅ YouTube API key encontrada"
- [ ] Vídeos têm IDs válidos (11 caracteres)
- [ ] Transcrição funciona sem erros

