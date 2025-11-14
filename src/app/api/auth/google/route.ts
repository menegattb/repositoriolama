import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/google
 * Inicia o fluxo de autenticação OAuth 2.0 com Google
 */
export async function GET(request: NextRequest) {
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  
  if (!oauthClientId || !oauthClientSecret) {
    return NextResponse.json(
      { error: 'OAuth credentials not configured' },
      { status: 500 }
    );
  }

  // Determinar a URL de callback baseada no ambiente
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;

  // Escopos necessários para Google Drive
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive',
  ];

  // URL de autorização do Google
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', oauthClientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline'); // Necessário para obter refresh token
  authUrl.searchParams.set('prompt', 'consent'); // Forçar consentimento para garantir refresh token

  return NextResponse.redirect(authUrl.toString());
}

