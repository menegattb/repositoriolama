/**
 * Callback do OAuth para Audio Drive
 * Recebe o código de autorização e troca por tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Erro na Autenticação</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Erro na autenticação</h2>
            <p>${error}</p>
            <p><a href="/api/auth/audio-drive">Tentar novamente</a></p>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  if (!code) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Código não recebido</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>⚠️ Código de autorização não recebido</h2>
            <p><a href="/api/auth/audio-drive">Tentar novamente</a></p>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  const clientId = process.env.AUDIO_DRIVE_CLIENT_ID;
  const clientSecret = process.env.AUDIO_DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse('Credenciais não configuradas', { status: 500 });
  }

  // Determinar a URL de callback baseado no ambiente
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const redirectUri = `${baseUrl}/api/auth/audio-drive/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const refreshToken = tokens.refresh_token;
    const accessToken = tokens.access_token;

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autenticação Concluída</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .success { background: #efe; border: 1px solid #cfc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .token-box { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0; overflow-x: auto; }
            code { font-family: monospace; word-break: break-all; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px; }
            button { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px; }
            button:hover { background: #45a049; }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>✅ Autenticação concluída com sucesso!</h2>
            <p>Copie o Refresh Token abaixo e adicione ao seu <code>.env.local</code></p>
          </div>

          ${refreshToken ? `
          <h3>Refresh Token:</h3>
          <div class="token-box">
            <code id="refresh-token">${refreshToken}</code>
          </div>
          <button onclick="navigator.clipboard.writeText('${refreshToken}')">📋 Copiar Refresh Token</button>

          <h3>Adicione ao .env.local:</h3>
          <div class="token-box">
            <code>AUDIO_DRIVE_REFRESH_TOKEN=${refreshToken}</code>
          </div>
          ` : `
          <div class="warning">
            <h3>⚠️ Refresh Token não retornado</h3>
            <p>Isso pode acontecer se você já autorizou este app antes.</p>
            <p>Para obter um novo refresh token:</p>
            <ol>
              <li>Acesse <a href="https://myaccount.google.com/permissions" target="_blank">myaccount.google.com/permissions</a></li>
              <li>Remova o acesso do app "inscricaoap" ou similar</li>
              <li><a href="/api/auth/audio-drive">Tente novamente</a></li>
            </ol>
          </div>
          `}

          ${accessToken ? `
          <h3>Access Token (temporário):</h3>
          <div class="token-box">
            <code style="font-size: 12px;">${accessToken}</code>
          </div>
          ` : ''}

          <div class="warning">
            <h3>⚠️ Importante</h3>
            <p>Após adicionar o token ao <code>.env.local</code>, reinicie o servidor de desenvolvimento.</p>
            <p>Também adicione a variável no Vercel para funcionar em produção.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (err) {
    console.error('[Audio Drive OAuth] Erro ao trocar código por tokens:', err);

    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Erro na Autenticação</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
            code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; display: block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Erro ao obter tokens</h2>
            <p>${errorMessage}</p>
            <h3>Possíveis soluções:</h3>
            <ol>
              <li>Verifique se o redirect URI está configurado no Google Cloud Console</li>
              <li>Adicione: <code>${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/auth/audio-drive/callback</code></li>
              <li><a href="/api/auth/audio-drive">Tentar novamente</a></li>
            </ol>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
