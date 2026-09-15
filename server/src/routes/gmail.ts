import { Router, Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import { createOAuth2Client, getAuthUrl } from '../lib/google';
import { supabase } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

const router = Router();

// GET /api/auth/gmail/url — generate OAuth consent URL
router.get('/url', (_req: Request, res: Response) => {
  const url = getAuthUrl();
  res.json({ url });
});

// GET /api/auth/gmail/callback — Google redirects here after user grants access.
// Exchanges the auth code for tokens, stores them, then redirects to the frontend.
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  const { code, error: oauthError } = req.query as { code?: string; error?: string };
  const frontendBase = process.env.CLIENT_URL ?? 'http://localhost:5173';

  // Google returned an error (e.g. user denied access)
  if (oauthError) {
    return res.redirect(`${frontendBase}/auth/callback?error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return res.redirect(`${frontendBase}/auth/callback?error=missing_code`);
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return res.redirect(`${frontendBase}/auth/callback?error=no_refresh_token`);
    }

    // Fetch the Gmail address to store alongside the tokens
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const email = userInfo.email ?? 'unknown';

    // Upsert into gmail_tokens (singleton row, id=1)
    const { error } = await supabase.from('gmail_tokens').upsert({
      id: 1,
      email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000).toISOString(),
      connected_at: new Date().toISOString(),
    });

    if (error) throw createError(`DB error: ${error.message}`, 500, 'DB_ERROR');

    // Redirect back to the frontend settings page with success flag
    res.redirect(`${frontendBase}/auth/callback?success=true&email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error('[Gmail OAuth] callback error:', err);
    res.redirect(`${frontendBase}/auth/callback?error=server_error`);
  }
});


// GET /api/auth/gmail/status — check if Gmail is connected
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('gmail_tokens')
      .select('email, connected_at, token_expiry')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw createError(error.message, 500, 'DB_ERROR');

    if (!data) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      email: data.email,
      connected_at: data.connected_at,
      token_expiry: data.token_expiry,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/gmail/disconnect — remove stored tokens
router.post('/disconnect', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Try to revoke the token with Google first
    const { data } = await supabase
      .from('gmail_tokens')
      .select('access_token')
      .eq('id', 1)
      .maybeSingle();

    if (data?.access_token) {
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({ access_token: data.access_token });
      await oauth2Client.revokeCredentials().catch(() => {
        // Best-effort — if revocation fails (already expired), continue
      });
    }

    const { error } = await supabase
      .from('gmail_tokens')
      .delete()
      .eq('id', 1);

    if (error) throw createError(error.message, 500, 'DB_ERROR');

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
