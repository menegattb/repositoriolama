import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/youtube
 * Inicia o fluxo de autenticação OAuth 2.0 com YouTube
 */
export async function GET(request: NextRequest) {
  try {
    const oauthClientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
    const oauthClientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
    
    console.log('[YouTube OAuth] Verificando credenciais...');
    console.log('[YouTube OAuth] YOUTUBE_OAUTH_CLIENT_ID:', oauthClientId ? `${oauthClientId.substring(0, 20)}...` : 'NÃO CONFIGURADO');
    console.log('[YouTube OAuth] YOUTUBE_OAUTH_CLIENT_SECRET:', oauthClientSecret ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
    
    if (!oauthClientId || !oauthClientSecret) {
      const errorMessage = 'YouTube OAuth credentials not configured. Please add YOUTUBE_OAUTH_CLIENT_ID and YOUTUBE_OAUTH_CLIENT_SECRET to .env.local';
      console.error('[YouTube OAuth] ❌', errorMessage);
      
      // Retornar página HTML com instruções ao invés de JSON
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Erro de Configuração - YouTube OAuth</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    h1 { color: #ff0000; margin-top: 0; }
    .error {
      background: #ffebee;
      border-left: 4px solid #f44336;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
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
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Erro de Configuração</h1>
    <div class="error">
      <strong>YouTube OAuth credentials not configured</strong>
    </div>
    <div class="instructions">
      <h3>📝 Como Resolver:</h3>
      <ol>
        <li>Abra o arquivo <code>.env.local</code> na raiz do projeto</li>
        <li>Adicione as seguintes variáveis:</li>
        <li><code>YOUTUBE_OAUTH_CLIENT_ID=seu_client_id_aqui</code></li>
        <li><code>YOUTUBE_OAUTH_CLIENT_SECRET=seu_client_secret_aqui</code></li>
        <li>(Obtenha os valores no arquivo <code>YOUTUBE_OAUTH_CREDENTIALS.local.json</code> ou no Google Cloud Console)</li>
        <li>Salve o arquivo</li>
        <li><strong>Reinicie o servidor</strong> (<code>npm run dev</code>)</li>
        <li>Tente acessar novamente: <a href="/api/auth/youtube">/api/auth/youtube</a></li>
      </ol>
      <p><strong>Nota:</strong> Os valores acima estão no arquivo <code>YOUTUBE_OAUTH_CREDENTIALS.local.json</code></p>
    </div>
  </div>
</body>
</html>
      `;
      
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 500,
      });
    }

    // Determinar a URL de callback baseada no ambiente
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const callbackUrl = `${protocol}://${host}/api/auth/youtube/callback`;

    console.log('[YouTube OAuth] ✅ Credenciais encontradas');
    console.log('[YouTube OAuth] Redirect URI:', callbackUrl);

    // Escopos necessários para YouTube (leitura apenas)
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
    ];

    // URL de autorização do Google
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', oauthClientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline'); // Necessário para obter refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Forçar consentimento para garantir refresh token

    console.log('[YouTube OAuth] 🔗 Redirecionando para:', authUrl.toString().substring(0, 100) + '...');

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[YouTube OAuth] ❌ Erro:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to initialize OAuth: ${errorMessage}` },
      { status: 500 }
    );
  }
}

