import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/youtube
 * Inicia o fluxo de autenticação OAuth 2.0 com YouTube
 */
export async function GET(request: NextRequest) {
  const oauthClientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  
  if (!oauthClientId || !oauthClientSecret) {
    return NextResponse.json(
      { error: 'YouTube OAuth credentials not configured. Please add YOUTUBE_OAUTH_CLIENT_ID and YOUTUBE_OAUTH_CLIENT_SECRET to .env.local' },
      { status: 500 }
    );
  }

  // Determinar a URL de callback baseada no ambiente
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const callbackUrl = `${protocol}://${host}/api/auth/youtube/callback`;

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

  return NextResponse.redirect(authUrl.toString());
}

