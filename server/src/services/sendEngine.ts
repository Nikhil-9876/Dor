import { supabase } from '../lib/supabase';
import { sendEmail } from './gmailService';
import { renderTemplate } from './templateRenderer';
import { createError } from '../middleware/errorHandler';
import type { Campaign, Template, Recipient } from '../types';

// In-memory map of campaign IDs that are requested to pause
const pauseRequests = new Set<string>();

export function requestPause(campaignId: string): void {
  pauseRequests.add(campaignId);
}

export function clearPauseRequest(campaignId: string): void {
  pauseRequests.delete(campaignId);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Count emails sent today across ALL campaigns (for daily limit tracking).
 */
async function getSentTodayCount(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('sent_emails')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', startOfDay.toISOString());

  if (error) throw createError(error.message, 500, 'DB_ERROR');
  return count ?? 0;
}

/**
 * Core send loop — runs asynchronously (fire-and-forget from the route).
 * Processes only `pending` recipients, respects daily limit and pause requests.
 */
export async function runSendEngine(campaignId: string): Promise<void> {
  clearPauseRequest(campaignId);

  try {
    // Fetch campaign + template
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('*, templates(*)')
      .eq('id', campaignId)
      .single();

    if (campErr || !campaign) {
      console.error(`[SendEngine] Campaign ${campaignId} not found`);
      return;
    }

    const template: Template = (campaign as any).templates;
    const camp = campaign as Campaign & { templates: Template };

    // Update status to sending
    await supabase
      .from('campaigns')
      .update({ status: 'sending', started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    // Fetch resume from storage (once)
    let resumeBuffer: Buffer | undefined;
    let resumeFilename = 'resume.pdf';
    if (camp.resume_file_path) {
      const { data: fileData, error: fileErr } = await supabase.storage
        .from('resumes')
        .download(camp.resume_file_path);

      if (fileErr) {
        console.warn(`[SendEngine] Could not fetch resume: ${fileErr.message}`);
      } else if (fileData) {
        resumeBuffer = Buffer.from(await fileData.arrayBuffer());
        resumeFilename = camp.resume_file_path.split('/').pop() ?? 'resume.pdf';
      }
    }

    // Fetch all pending recipients
    const { data: recipients, error: recErr } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (recErr) {
      console.error(`[SendEngine] Failed to fetch recipients: ${recErr.message}`);
      await supabase
        .from('campaigns')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', campaignId);
      return;
    }

    const pending: Recipient[] = recipients ?? [];
    let sentToday = await getSentTodayCount();

    for (const recipient of pending) {
      // Check pause request
      if (pauseRequests.has(campaignId)) {
        await supabase
          .from('campaigns')
          .update({ status: 'paused', updated_at: new Date().toISOString() })
          .eq('id', campaignId);
        clearPauseRequest(campaignId);
        console.log(`[SendEngine] Campaign ${campaignId} paused`);
        return;
      }

      // Check daily limit
      if (sentToday >= camp.daily_limit) {
        await supabase
          .from('campaigns')
          .update({ status: 'paused', updated_at: new Date().toISOString() })
          .eq('id', campaignId);
        console.log(`[SendEngine] Daily limit (${camp.daily_limit}) reached, pausing campaign ${campaignId}`);
        return;
      }

      const renderedSubject = renderTemplate(template.subject, recipient);
      const renderedHtml = renderTemplate(template.body_html, recipient);
      const renderedPlain = template.body_plain
        ? renderTemplate(template.body_plain, recipient)
        : undefined;

      let gmailMessageId: string | undefined;
      let gmailThreadId: string | undefined;
      let sendError: string | undefined;

      try {
        const result = await sendEmail({
          to: recipient.email,
          toName: recipient.name,
          subject: renderedSubject,
          htmlBody: renderedHtml,
          plainBody: renderedPlain,
          attachmentBuffer: resumeBuffer,
          attachmentFilename: resumeFilename,
          attachmentMimeType: 'application/pdf',
        });

        gmailMessageId = result.messageId;
        gmailThreadId  = result.threadId;

        // Mark recipient as sent
        await supabase
          .from('recipients')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', recipient.id);

        // Increment sent_count
        await supabase.rpc('increment_campaign_sent', { campaign_id: campaignId });
        sentToday++;

        console.log(`[SendEngine] ✓ Sent to ${recipient.email} (msg: ${gmailMessageId})`);
      } catch (err: any) {
        sendError = err?.message ?? 'Unknown error';
        console.error(`[SendEngine] ✗ Failed to send to ${recipient.email}: ${sendError}`);

        // Mark recipient as failed
        await supabase
          .from('recipients')
          .update({
            status: 'failed',
            error_message: sendError,
          })
          .eq('id', recipient.id);

        // Increment failed_count
        await supabase.rpc('increment_campaign_failed', { campaign_id: campaignId });
      }

      // Log to sent_emails audit table
      await supabase.from('sent_emails').insert({
        campaign_id: campaignId,
        recipient_id: recipient.id,
        to_email: recipient.email,
        to_name: recipient.name,
        subject: renderedSubject,
        company: recipient.company,
        role: recipient.role,
        gmail_message_id: gmailMessageId,
        gmail_thread_id:  gmailThreadId,
        status: sendError ? 'failed' : 'sent',
        error_message: sendError,
        sent_at: new Date().toISOString(),
      });

      // Wait before next send (unless this was the last recipient)
      if (recipient !== pending[pending.length - 1]) {
        await delay(camp.delay_seconds * 1000);
      }
    }

    // All done — mark campaign as completed
    await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    console.log(`[SendEngine] Campaign ${campaignId} completed`);
  } catch (err: any) {
    console.error(`[SendEngine] Fatal error in campaign ${campaignId}:`, err);
    await supabase
      .from('campaigns')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', campaignId);
  }
}
