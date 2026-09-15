import { supabase } from '../lib/supabase';
import { createOAuth2Client } from '../lib/google';
import { createError } from '../middleware/errorHandler';

/**
 * Check for replies to all sent emails in a campaign that have a gmail_thread_id.
 * Updates replied=true, reply_snippet, reply_received_at on any newly-found replies.
 * Returns count of new replies found.
 */
export async function checkReplies(campaignId: string): Promise<{ checked: number; newReplies: number }> {
  // Get all sent emails for this campaign that haven't been replied to yet
  const { data: sentEmails, error } = await supabase
    .from('sent_emails')
    .select('id, gmail_thread_id, to_email, sent_at')
    .eq('campaign_id', campaignId)
    .eq('status', 'sent')
    .eq('replied', false)
    .not('gmail_thread_id', 'is', null);

  if (error) throw createError(error.message, 500, 'DB_ERROR');
  if (!sentEmails || sentEmails.length === 0) return { checked: 0, newReplies: 0 };

  // Get Gmail OAuth client
  const { data: tokenData } = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (!tokenData) throw createError('Gmail not connected', 400, 'GMAIL_NOT_CONNECTED');

  const { google } = await import('googleapis');
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: new Date(tokenData.token_expiry).getTime(),
  });

  // Auto-refresh listener
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await supabase.from('gmail_tokens').update({
        access_token: tokens.access_token,
        token_expiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000).toISOString(),
      }).eq('id', 1);
    }
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  let newReplies = 0;

  for (const email of sentEmails) {
    if (!email.gmail_thread_id) continue;

    try {
      const threadRes = await gmail.users.threads.get({
        userId: 'me',
        id: email.gmail_thread_id,
        format: 'metadata',
        metadataHeaders: ['From', 'Date', 'Subject'],
      });

      const messages = threadRes.data.messages ?? [];

      // A reply exists if there's more than 1 message in the thread
      if (messages.length > 1) {
        // The last message is the reply
        const lastMsg = messages[messages.length - 1];
        const snippet = threadRes.data.snippet ?? '';
        const replyDate = lastMsg.internalDate
          ? new Date(parseInt(lastMsg.internalDate)).toISOString()
          : new Date().toISOString();

        await supabase.from('sent_emails').update({
          replied: true,
          reply_snippet: snippet.substring(0, 500),
          reply_received_at: replyDate,
        }).eq('id', email.id);

        newReplies++;
      }
    } catch (err: any) {
      console.warn(`[ReplyTracker] Could not check thread ${email.gmail_thread_id}:`, err?.message);
    }
  }

  return { checked: sentEmails.length, newReplies };
}
