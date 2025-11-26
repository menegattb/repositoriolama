# 🔄 Atualizar JSON na Hostinger

## ⚠️ Problema Atual

O site está mostrando apenas **8 playlists em inglês** porque o JSON na Hostinger está desatualizado. O JSON local tem **22 itens** com tag "English" ou "Inglês".

## ✅ Solução: Fazer Upload do JSON Atualizado

### Opção 1: Via File Manager (Mais Fácil)

1. **Acesse o hPanel da Hostinger**
   - Faça login no painel de controle da Hostinger

2. **Abra o File Manager**
   - Navegue até: `public_html/repositorio/api/`

3. **Faça Upload do Arquivo**
   - Baixe o arquivo local: `repositoriolama/public/youtube-data.json`
   - Faça upload substituindo o arquivo existente: `youtube-data.json`

4. **Verifique**
   - Acesse: https://acaoparamita.com.br/repositorio/api/youtube-data.json
   - Deve mostrar o JSON atualizado com 22+ itens em inglês

### Opção 2: Via SSH/SCP (Se tiver acesso)

```bash
cd repositoriolama
./scripts/upload-json-to-hostinger.sh
```

Ou manualmente:
```bash
scp -P 65002 public/youtube-data.json \
  u670352471@45.14.88.221:/home/u670352471/domains/acaoparamita.com.br/public_html/repositorio/api/
```

## 📊 O que foi adicionado

- ✅ **6 vídeos standalone** em inglês com prefixo "English -"
- ✅ **14 playlists** atualizadas com prefixo "English -"
- ✅ **1 playlist** já tinha "em Inglês" no título (detectada automaticamente)

**Total: 22 itens** que devem aparecer no filtro "Ensinamentos em Inglês"

## 🔍 Verificar após upload

1. Acesse o site
2. Vá para a página de Playlists
3. Selecione o filtro "Ensinamentos em Inglês"
4. Deve mostrar **22+ itens** (15 playlists + 6 vídeos standalone + outras que já existiam)

## 🐛 Se ainda mostrar apenas 8

1. **Limpe o cache do navegador** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Verifique o console do navegador** para ver se há erros
3. **Confirme que o JSON foi atualizado** acessando diretamente:
   https://acaoparamita.com.br/repositorio/api/youtube-data.json
4. **Verifique a data de atualização** no JSON (`updatedAt`)

