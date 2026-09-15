import { google } from 'googleapis';
import { createOAuth2Client } from '../lib/google';
import { supabase } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

export interface SendEmailOptions {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
  plainBody?: string;
  attachmentBuffer?: Buffer;
  attachmentFilename?: string;
  attachmentMimeType?: string;
}

/**
 * Load tokens from DB and return a configured OAuth2 client.
 * Auto-refreshes access_token if expired.
 */
async function getAuthenticatedClient() {
  const { data, error } = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw createError(error.message, 500, 'DB_ERROR');
  if (!data) throw createError('Gmail not connected. Please connect your Gmail account first.', 400, 'GMAIL_NOT_CONNECTED');

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: new Date(data.token_expiry).getTime(),
  });

  // Auto-refresh listener — persist new tokens to DB
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await supabase.from('gmail_tokens').update({
        access_token: tokens.access_token,
        token_expiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000).toISOString(),
      }).eq('id', 1);
    }
  });

  return { auth: oauth2Client, email: (data.email as string) ?? '' };
}

/**
 * Build a raw RFC 2822 MIME message for the Gmail API.
 * Supports HTML body + optional PDF attachment.
 */
function buildMimeMessage(opts: SendEmailOptions & { fromEmail: string; fromName: string }): string {
  const boundary = `RefMail_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines: string[] = [];

  // Headers
  lines.push(`From: ${opts.fromName} <${opts.fromEmail}>`);
  lines.push(`To: ${opts.toName} <${opts.to}>`);
  lines.push(`Subject: ${opts.subject}`);
  lines.push('MIME-Version: 1.0');
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push('');

  // HTML body part
  lines.push(`--${boundary}`);
  lines.push('Content-Type: multipart/alternative; boundary="alt_' + boundary + '"');
  lines.push('');

  if (opts.plainBody) {
    lines.push(`--alt_${boundary}`);
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    lines.push('');
    lines.push(opts.plainBody);
  }

  lines.push(`--alt_${boundary}`);
  lines.push('Content-Type: text/html; charset=UTF-8');
  lines.push('Content-Transfer-Encoding: quoted-printable');
  lines.push('');
  lines.push(opts.htmlBody);
  lines.push(`--alt_${boundary}--`);

  // Attachment (resume PDF)
  if (opts.attachmentBuffer) {
    const filename = opts.attachmentFilename ?? 'resume.pdf';
    const mimeType = opts.attachmentMimeType ?? 'application/pdf';
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${mimeType}; name="${filename}"`);
    lines.push('Content-Transfer-Encoding: base64');
    lines.push(`Content-Disposition: attachment; filename="${filename}"`);
    lines.push('');
    lines.push(opts.attachmentBuffer.toString('base64'));
  }

  lines.push(`--${boundary}--`);

  return lines.join('\r\n');
}

/**
 * Send a single email via the Gmail API.
 * Returns the Gmail message ID and thread ID on success.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ messageId: string; threadId: string }> {
  const { auth, email: fromEmail } = await getAuthenticatedClient();

  const gmail = google.gmail({ version: 'v1', auth });
  const fromName = fromEmail ? fromEmail.split('@')[0] : 'RefMail';

  const raw = buildMimeMessage({ ...opts, fromEmail, fromName });

  // Base64url encode (Gmail API requires base64url, not standard base64)
  const encodedMessage = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });

  return {
    messageId: response.data.id ?? '',
    threadId:  response.data.threadId ?? '',
  };
}

/**
 * Get the connected Gmail address (for display purposes).
 */
export async function getConnectedEmail(): Promise<string | null> {
  const { data } = await supabase
    .from('gmail_tokens')
    .select('email')
    .eq('id', 1)
    .maybeSingle();
  return data?.email ?? null;
}
