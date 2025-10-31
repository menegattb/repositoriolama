#!/bin/bash

# Script de Deploy via SSH para Hostinger com Next.js
# Configurações do servidor
REMOTE_HOST="45.14.88.221"
REMOTE_USER="u670352471"
REMOTE_PORT="65002"
REMOTE_PATH="/home/u670352471/domains/acaoparamita.com.br/public_html/repositorio"

# Diretório de build do Next.js
BUILD_DIR="repositoriolama/out"

echo "[INFO] 🚀 Building Next.js application..."
cd repositoriolama

# Build do Next.js (export estático)
npm run build

if [ $? -ne 0 ]; then
    echo "[ERROR] ❌ Next.js build failed" >&2
    exit 1
fi

echo "[SUCCESS] ✅ Build completed successfully!"
cd ..

# Verificar se o build existe
if [ ! -d "$BUILD_DIR" ]; then
    echo "[ERROR] ❌ Build directory not found at $BUILD_DIR" >&2
    exit 1
fi

echo "[INFO] 📊 Build statistics:"
du -sh $BUILD_DIR
echo ""

echo "[INFO] 🔐 Starting SSH deployment to $REMOTE_HOST..."
echo "[INFO] ⚠️  NOT sending audio files - only Next.js static files"

# Criar diretório de transcrições no servidor se não existir (pré-deploy)
echo "[INFO] 📁 Ensuring transcripts directory exists on server..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH/public/transcripts && chmod 755 $REMOTE_PATH/public/transcripts" || {
    echo "[WARNING] ⚠️  Could not create transcripts directory, continuing anyway..."
}

# Testar conexão SSH primeiro
echo "[INFO] 🔌 Testing SSH connection..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "echo 'SSH connection successful'" 2>/dev/null; then
    echo "[SUCCESS] ✅ SSH connection established!"
else
    echo "[ERROR] ❌ SSH connection failed. Please check:" >&2
    echo "  - SSH key is added to authorized_keys on server" >&2
    echo "  - Server allows SSH connections" >&2
    echo "  - Firewall settings" >&2
    exit 1
fi

# Deploy via rsync
# IMPORTANTE: --exclude='public/transcripts/' previne que o rsync --delete apague os arquivos .srt dentro do diretório
echo "[INFO] 📤 Uploading Next.js build files via rsync..."
rsync -avz --delete \
    -e "ssh -p $REMOTE_PORT" \
    --exclude='*.mp3' \
    --exclude='*.wav' \
    --exclude='*.ogg' \
    --exclude='audios/' \
    --exclude='audio/' \
    --exclude='public/transcripts/' \
    --progress \
    $BUILD_DIR/ \
    $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

if [ $? -eq 0 ]; then
    echo "[SUCCESS] ✅ Next.js build uploaded successfully via SSH!"
    echo "[INFO] 📝 Audio files were NOT sent (as requested)"
    echo "[INFO] 💾 Transcripts directory preserved (public/transcripts/)"
else
    echo "[ERROR] ❌ SSH upload failed" >&2
    exit 2
fi

# Garantir que diretório de transcrições existe após deploy (pós-deploy)
echo "[INFO] 📁 Verifying transcripts directory after deploy..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH/public/transcripts && chmod 755 $REMOTE_PATH/public/transcripts" || {
    echo "[WARNING] ⚠️  Could not verify transcripts directory"
}

# Check if site is accessible
echo "[INFO] 🌐 Checking if site is accessible..."
sleep 5
if curl -s -f "https://repositorio.acaoparamita.com.br" > /dev/null; then
  echo "[SUCCESS] ✅ Site is accessible at https://repositorio.acaoparamita.com.br"
else
  echo "[WARNING] ⚠️  Site might not be accessible yet. Please check manually."
fi

echo ""
echo "================================================"
echo "[SUCCESS] 🎉 SSH deployment completed!"
echo "================================================"
echo "[INFO] 🌐 Your site: https://repositorio.acaoparamita.com.br"
echo "[INFO] 📁 Remote path: $REMOTE_PATH"
echo "[INFO] 💾 Audio files preserved on server"
echo "================================================"
