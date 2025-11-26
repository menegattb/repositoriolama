#!/bin/bash

# Script para fazer upload do youtube-data.json para a Hostinger
# Requer: rsync ou scp configurado

JSON_FILE="public/youtube-data.json"
HOSTINGER_HOST="u670352471@45.14.88.221"
HOSTINGER_PATH="/home/u670352471/domains/acaoparamita.com.br/public_html/repositorio/api/youtube-data.json"
SSH_PORT="65002"

echo "📤 Fazendo upload do youtube-data.json para Hostinger..."
echo ""

# Verificar se o arquivo existe
if [ ! -f "$JSON_FILE" ]; then
    echo "❌ Arquivo não encontrado: $JSON_FILE"
    exit 1
fi

# Tentar via rsync primeiro
if command -v rsync &> /dev/null; then
    echo "✅ Usando rsync..."
    rsync -avz -e "ssh -p $SSH_PORT" "$JSON_FILE" "$HOSTINGER_HOST:$HOSTINGER_PATH"
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Upload concluído com sucesso!"
        echo "🌐 Arquivo disponível em: https://acaoparamita.com.br/repositorio/api/youtube-data.json"
        exit 0
    fi
fi

# Tentar via scp como fallback
if command -v scp &> /dev/null; then
    echo "✅ Usando scp..."
    scp -P $SSH_PORT "$JSON_FILE" "$HOSTINGER_HOST:$HOSTINGER_PATH"
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Upload concluído com sucesso!"
        echo "🌐 Arquivo disponível em: https://acaoparamita.com.br/repositorio/api/youtube-data.json"
        exit 0
    fi
fi

echo ""
echo "❌ Erro: Não foi possível fazer upload automaticamente."
echo ""
echo "📋 Instruções manuais:"
echo "1. Acesse o File Manager da Hostinger (hPanel)"
echo "2. Navegue até: public_html/repositorio/api/"
echo "3. Faça upload do arquivo: $JSON_FILE"
echo "4. Substitua o arquivo existente"
echo ""
echo "Ou configure SSH/SCP e execute novamente este script."

