# Configuração Next.js Server-Side na Hostinger

Este projeto precisa de **Next.js rodando como servidor Node.js** (não como export estático) para que as API routes funcionem.

## Problema Atual

O servidor está servindo arquivos estáticos do diretório `out/`, mas as API routes (`/api/transcribe`) precisam de um servidor Node.js rodando.

## Solução: Configurar Node.js na Hostinger

### Passo 1: Acessar o Painel da Hostinger

1. Acesse o painel de controle da Hostinger (hPanel)
2. Vá em **"Avançado"** > **"Node.js"**

### Passo 2: Criar Aplicação Node.js

1. Clique em **"Criar aplicação Node.js"**
2. Configure:
   - **Versão do Node.js**: 18.x ou 20.x (recomendado)
   - **Nome da aplicação**: `repositoriolama` ou `repositorio`
   - **Diretório raiz**: `/domains/acaoparamita.com.br/public_html/repositorio`
   - **Porta**: Deixe a porta padrão (geralmente começa em 3000)
   - **Arquivo de início**: `server.js` (vamos criar)

### Passo 3: Criar arquivo `server.js`

No servidor, crie o arquivo `server.js` na raiz do projeto:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

### Passo 4: Atualizar `package.json`

Adicione o script de start personalizado (já está configurado como `next start`, mas podemos usar o server.js):

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "next dev",
    "build": "next build"
  }
}
```

### Passo 5: Configurar Variáveis de Ambiente

No painel Node.js da Hostinger, adicione as variáveis de ambiente:

```
NODE_ENV=production
SUPADATA_API_KEY=sd_86b70226db51a917ffe6094c815f017f
PORT=3000
```

### Passo 6: Iniciar a Aplicação

1. No painel Node.js, clique em **"Iniciar"** ou **"Restart"**
2. Verifique os logs para garantir que está rodando

### Passo 7: Configurar Proxy Reverso no Apache

Crie ou atualize o arquivo `.htaccess` na raiz do projeto:

```apache
RewriteEngine On

# Redirecionar para HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Servir arquivos estáticos diretamente
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Proxy reverso para Node.js (ajuste a porta conforme configurado na Hostinger)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:PORTA_DA_HOSTINGER/$1 [P,L]
```

**Importante**: Substitua `PORTA_DA_HOSTINGER` pela porta que a Hostinger atribuiu à sua aplicação Node.js.

## Alternativa: Usar PM2 (Recomendado)

Se tiver acesso SSH, você pode usar PM2 para gerenciar o processo:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
cd /home/u670352471/domains/acaoparamita.com.br/public_html/repositorio
npm install --production
npm run build
pm2 start npm --name "repositoriolama" -- start

# Salvar configuração do PM2
pm2 save
pm2 startup
```

## Verificação

Após configurar, teste:

1. Acesse: `https://repositorio.acaoparamita.com.br/api/transcribe` (deve retornar JSON, não 404)
2. Teste a geração de transcrição no site
3. Verifique os logs no painel Node.js da Hostinger

## Problemas Comuns

### 1. "npm: command not found"
- Instale Node.js através do painel da Hostinger
- Ou use o Node.js já configurado no painel

### 2. "Port already in use"
- Verifique qual porta a Hostinger atribuiu
- Atualize o `server.js` e `.htaccess` com a porta correta

### 3. "Cannot find module 'next'"
- Execute `npm install --production` no servidor
- Certifique-se de que `node_modules` foi enviado (ou não está no `.gitignore`)

### 4. API routes retornam 404
- Verifique se o proxy reverso está configurado corretamente
- Verifique se o servidor Node.js está rodando
- Teste acessando diretamente a porta do Node.js (se possível via SSH)

## Nota

Se a Hostinger não suportar Node.js no seu plano, você pode:
1. Atualizar para um plano que suporte Node.js
2. Usar uma alternativa como Vercel, Railway, ou Render (recomendado)
3. Voltar para export estático (mas perderá as API routes de transcrição)
