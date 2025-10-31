# Configuração: JSON do YouTube na Hostinger

Este documento explica como configurar o arquivo JSON na Hostinger para que o Vercel busque os dados.

## 📋 Passo a Passo

### 1. Gerar o JSON

O arquivo JSON já foi gerado automaticamente em:
```
public/youtube-data.json
```

### 2. Fazer Upload para a Hostinger

**Via File Manager (hPanel):**
1. Acesse o File Manager da Hostinger
2. Navegue até: `public_html/repositorio/`
3. Crie a pasta `api` se não existir
4. Faça upload do arquivo `youtube-data.json` para:
   ```
   public_html/repositorio/api/youtube-data.json
   ```

**Via FTP/SSH:**
```bash
# Via rsync
rsync -avz public/youtube-data.json \
  u670352471@45.14.88.221:/home/u670352471/domains/acaoparamita.com.br/public_html/repositorio/api/

# Ou via SCP
scp -P 65002 public/youtube-data.json \
  u670352471@45.14.88.221:/home/u670352471/domains/acaoparamita.com.br/public_html/repositorio/api/
```

### 3. Verificar Acesso

Após o upload, teste se o arquivo está acessível:
```
https://repositorio.acaoparamita.com.br/api/youtube-data.json
```

Deve retornar um JSON válido com a estrutura:
```json
{
  "version": "1.0",
  "generatedAt": "2025-01-XX...",
  "playlists": [...]
}
```

### 4. Configurar Variável de Ambiente (Opcional)

Se quiser usar uma URL diferente, configure no Vercel:
- Variável: `NEXT_PUBLIC_YOUTUBE_DATA_URL`
- Valor: `https://repositorio.acaoparamita.com.br/api/youtube-data.json`

## 🔄 Atualizar os Dados

Quando precisar atualizar os dados:

1. **Regenerar o JSON localmente:**
   ```bash
   node scripts/generate-youtube-json.js
   ```

2. **Fazer upload do novo arquivo:**
   - Substitua o arquivo `api/youtube-data.json` na Hostinger
   - O Vercel buscará os dados atualizados automaticamente

## 🔒 Segurança

- O arquivo JSON é público na Hostinger
- Para adicionar autenticação, use a **Opção 2 (API PHP)** do documento principal
- O arquivo contém apenas IDs de playlists do YouTube (não são dados sensíveis)

## 📝 Estrutura do JSON

```json
{
  "version": "1.0",
  "generatedAt": "ISO 8601 timestamp",
  "playlists": [
    {
      "id": "PLO_...",
      "title": "Título da Playlist",
      "description": "...",
      "publishedAt": "2025-09-30T20:32:33.611267Z",
      "itemCount": 1
    }
  ]
}
```

## ✅ Teste

Após configurar, teste:
1. Acesse o site no Vercel
2. Verifique se as playlists aparecem
3. Verifique o console do navegador para logs
4. Teste a busca e filtros

