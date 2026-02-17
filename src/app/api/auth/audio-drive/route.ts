/**
 * Rota de autenticação OAuth para Audio Drive
 * Inicia o fluxo de autenticação com a conta que contém os áudios
 * 
 * Acesse: /api/auth/audio-drive
 * Faça login com a conta: acaoparamita@gmail.com
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  const clientId = process.env.AUDIO_DRIVE_CLIENT_ID;
  const clientSecret = process.env.AUDIO_DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Configuração Necessária</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
            code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>⚠️ Credenciais não configuradas</h2>
            <p>Configure as seguintes variáveis no <code>.env.local</code>:</p>
            <ul>
              <li><code>AUDIO_DRIVE_CLIENT_ID</code></li>
              <li><code>AUDIO_DRIVE_CLIENT_SECRET</code></li>
            </ul>
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

  // Determinar a URL de callback baseado no ambiente
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const redirectUri = `${baseUrl}/api/auth/audio-drive/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Força a exibição do consentimento para obter refresh_token
    scope: [
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });

  // Redirecionar para a página de autenticação do Google
  return NextResponse.redirect(authUrl);
}
