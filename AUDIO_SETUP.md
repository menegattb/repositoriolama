# Configuração de Áudio - Local e Google Drive

Este documento descreve como configurar o sistema de áudio para funcionar localmente e depois migrar para Google Drive.

## Fase 1: Configuração Local

### Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env.local`:

```env
# Configuração de Áudio
AUDIO_SOURCE=local
AUDIO_LOCAL_PATH=/Users/bno/Documents/downloadYOUTUBE/downloads/audio
```

### Estrutura de Pastas Esperada

Os arquivos de áudio devem estar organizados da seguinte forma:

```
/Users/bno/Documents/downloadYOUTUBE/downloads/audio/
├── PLO_7Zoueaxd763b5-ssGoQb6.../
│   ├── 0zwynjvZl1g.mp3  ← videoId do YouTube
│   ├── 888Uk_LX79Q.mp3
│   └── ...
├── PLO_7Zoueaxd{outroId}/
│   └── ...
```

**Observações:**
- Cada pasta deve ter o ID completo da playlist do YouTube
- Os arquivos de áudio devem ser nomeados com o `videoId` do YouTube (ex: `{videoId}.mp3`)
- Apenas arquivos `.mp3` são suportados

### Como Funciona

1. **Listagem de Áudios**: Quando o usuário abre a aba "Áudio" em uma playlist, o sistema busca os arquivos na pasta correspondente ao ID da playlist.

2. **Reprodução**: Os arquivos são servidos através da API route `/api/audio/{playlistId}/{videoId}`, que suporta Range requests para navegação eficiente.

3. **Requisição de Áudio**: Para vídeos sem áudio disponível, há um botão "Requerir áudio deste ensinamento" que abre o WhatsApp com uma mensagem pré-formatada.

## Fase 2: Migração para Google Drive (Futuro)

Quando estiver pronto para migrar para Google Drive, você precisará:

### 1. Configurar Google Drive API

1. Criar projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Google Drive API
3. Criar credenciais (Service Account recomendado para acesso programático)
4. Obter API Key ou arquivo de credenciais JSON

### 2. Atualizar Variáveis de Ambiente

```env
# Configuração de Áudio
AUDIO_SOURCE=google_drive
GOOGLE_DRIVE_API_KEY=sua_api_key_aqui
GOOGLE_DRIVE_FOLDER_ID=id_da_pasta_raiz_no_drive
```

### 3. Estrutura no Google Drive

A estrutura deve ser a mesma que local:
- Pasta raiz: `{GOOGLE_DRIVE_FOLDER_ID}`
- Subpastas: `{playlistId}/` (mesmo formato que local)
- Arquivos: `{videoId}.mp3`

### 4. Instalar Dependências

```bash
npm install googleapis
```

## API Routes

### GET `/api/audio/list/[playlistId]`

Lista todos os arquivos de áudio disponíveis para uma playlist.

**Resposta:**
```json
{
  "audioFiles": [
    {
      "videoId": "0zwynjvZl1g",
      "filename": "0zwynjvZl1g.mp3",
      "url": "/api/audio/{playlistId}/0zwynjvZl1g",
      "size": 12345678,
      "exists": true
    }
  ]
}
```

### GET `/api/audio/[playlistId]/[videoId]`

Serve o arquivo de áudio com suporte a Range requests (HTTP 206).

**Headers suportados:**
- `Range: bytes=start-end` - Para navegação no áudio

## Componentes

### Sidebar

A aba "Áudio" no Sidebar mostra:
- Lista de todos os vídeos da playlist
- Player inline para vídeos com áudio disponível
- Botão "Reproduzir no Player Principal" para áudios disponíveis
- Botão "Requerir áudio deste ensinamento" (WhatsApp) para vídeos sem áudio

### MediaPlayer

O MediaPlayer detecta automaticamente quando um `MediaItem` é um áudio local e renderiza um player HTML5 customizado ao invés do iframe do YouTube.

## Troubleshooting

### Arquivos não aparecem

1. Verifique se a pasta da playlist existe em `AUDIO_LOCAL_PATH`
2. Verifique se os arquivos estão nomeados corretamente (`{videoId}.mp3`)
3. Verifique os logs do servidor para erros

### Erro 404 ao reproduzir

1. Verifique se o arquivo existe fisicamente
2. Verifique se o `videoId` está correto (11 caracteres, sem espaços)
3. Verifique permissões do arquivo

### Range requests não funcionam

Certifique-se de que o servidor Next.js está configurado corretamente. Range requests são essenciais para navegação em áudios grandes.

