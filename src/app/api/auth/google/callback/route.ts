import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/google/callback
 * Callback do OAuth 2.0 - recebe o código de autorização e troca por tokens
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.json(
      { error: `OAuth error: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Authorization code not provided' },
      { status: 400 }
    );
  }

  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!oauthClientId || !oauthClientSecret) {
    return NextResponse.json(
      { error: 'OAuth credentials not configured' },
      { status: 500 }
    );
  }

  // Determinar a URL de callback
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  try {
    // Trocar código de autorização por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: oauthClientId,
        client_secret: oauthClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[OAuth Callback] Erro ao trocar código por tokens:', errorText);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code for tokens' },
        { status: 500 }
      );
    }

    const tokens = await tokenResponse.json();

    console.log('[OAuth Callback] ✅ Tokens recebidos do Google');
    console.log('[OAuth Callback] Access token:', tokens.access_token ? '✅ Recebido' : '❌ Não recebido');
    console.log('[OAuth Callback] Refresh token:', tokens.refresh_token ? '✅ Recebido' : '❌ Não recebido');
    console.log('[OAuth Callback] Token type:', tokens.token_type);
    console.log('[OAuth Callback] Expires in:', tokens.expires_in, 'segundos');

    if (!tokens.refresh_token) {
      console.warn('[OAuth Callback] ⚠️ Refresh token não recebido!');
      console.warn('[OAuth Callback] Isso acontece quando o usuário já autorizou antes.');
      console.warn('[OAuth Callback] SOLUÇÃO: Revogue o acesso e tente novamente');
      console.warn('[OAuth Callback] 1. Acesse: https://myaccount.google.com/permissions');
      console.warn('[OAuth Callback] 2. Revogue o acesso ao app');
      console.warn('[OAuth Callback] 3. Tente autorizar novamente');
    }

    // Criar página HTML amigável para mostrar o refresh token
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OAuth 2.0 - Refresh Token</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a73e8;
      margin-top: 0;
    }
    .success {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .token-box {
      background: #f5f5f5;
      border: 2px solid #ddd;
      padding: 15px;
      border-radius: 4px;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      margin: 15px 0;
    }
    .copy-btn {
      background: #1a73e8;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }
    .copy-btn:hover {
      background: #1557b0;
    }
    .instructions {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .instructions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 OAuth 2.0 - Configuração</h1>
    
    ${tokens.refresh_token ? `
    <div class="success">
      <strong>✅ Sucesso!</strong> Refresh token recebido.
    </div>
    
    <h2>📋 Seu Refresh Token:</h2>
    <div class="token-box" id="refreshToken">${tokens.refresh_token}</div>
    <button class="copy-btn" onclick="copyToken()">📋 Copiar Token</button>
    
    <div class="instructions">
      <h3>📝 Próximos Passos:</h3>
      <ol>
        <li>Copie o refresh token acima</li>
        <li>Abra o arquivo <code>.env.local</code> na raiz do projeto</li>
        <li>Adicione ou atualize a linha:</li>
        <li><code>GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}</code></li>
        <li>Salve o arquivo e reinicie o servidor (<code>npm run dev</code>)</li>
      </ol>
    </div>
    ` : `
    <div class="warning">
      <strong>⚠️ Atenção!</strong> Refresh token não foi recebido.
    </div>
    
    <div class="instructions">
      <h3>🔧 Como Resolver:</h3>
      <ol>
        <li>Acesse: <a href="https://myaccount.google.com/permissions" target="_blank">https://myaccount.google.com/permissions</a></li>
        <li>Encontre o app "transcricoes" ou seu projeto</li>
        <li>Clique em "Remover acesso"</li>
        <li>Volte e acesse novamente: <a href="/api/auth/google">/api/auth/google</a></li>
        <li>Agora o refresh token deve aparecer</li>
      </ol>
      
      <p><strong>Por que isso acontece?</strong><br>
      O Google só retorna um refresh token na primeira vez que você autoriza. 
      Se você já autorizou antes, precisa revogar o acesso primeiro.</p>
    </div>
    `}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p><strong>Access Token:</strong> ${tokens.access_token ? '✅ Recebido' : '❌ Não recebido'}</p>
      <p><strong>Token Type:</strong> ${tokens.token_type || 'N/A'}</p>
      <p><strong>Expira em:</strong> ${tokens.expires_in ? tokens.expires_in + ' segundos' : 'N/A'}</p>
    </div>
  </div>
  
  <script>
    function copyToken() {
      const token = document.getElementById('refreshToken').textContent;
      navigator.clipboard.writeText(token).then(() => {
        alert('✅ Token copiado! Cole no arquivo .env.local');
      }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar. Selecione e copie manualmente.');
      });
    }
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[OAuth Callback] Erro:', errorMessage);
    return NextResponse.json(
      { error: `OAuth callback failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

