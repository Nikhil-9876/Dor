import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { supabase } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';
import { renderTemplate } from '../services/templateRenderer';
import { runSendEngine, requestPause } from '../services/sendEngine';
import type { Recipient } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const CampaignSchema = z.object({
  template_id: z.string().uuid(),
  name: z.string().min(1).optional(),
  delay_seconds: z.number().int().min(1).max(60).optional(),
  daily_limit: z.number().int().min(1).max(500).optional(),
});

const RecipientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  role: z.string().optional(),
  custom_fields: z.record(z.string()).optional().default({}),
});

// ─── Campaign CRUD ───────────────────────────────────────────────────────────

// GET /api/campaigns
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, templates(name, subject)')
      .order('created_at', { ascending: false });

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/campaigns/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*, templates(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    if (!campaign) throw createError('Campaign not found', 404, 'NOT_FOUND');

    const { data: recipients } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json({ ...campaign, recipients: recipients ?? [] });
  } catch (err) { next(err); }
});

// POST /api/campaigns
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CampaignSchema.parse(req.body);
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        template_id: body.template_id,
        name: body.name ?? 'Untitled Campaign',
        delay_seconds: body.delay_seconds ?? 5,
        daily_limit: body.daily_limit ?? 50,
      })
      .select()
      .single();

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PUT /api/campaigns/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CampaignSchema.partial().parse(req.body);
    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    if (!data) throw createError('Campaign not found', 404, 'NOT_FOUND');
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /api/campaigns/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clean up resume file in storage first
    const { data: camp } = await supabase
      .from('campaigns')
      .select('resume_file_path')
      .eq('id', req.params.id)
      .maybeSingle();

    if (camp?.resume_file_path) {
      await supabase.storage.from('resumes').remove([camp.resume_file_path]);
    }

    const { error } = await supabase.from('campaigns').delete().eq('id', req.params.id);
    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── Recipients ───────────────────────────────────────────────────────────────

// GET /api/campaigns/:id/recipients
router.get('/:id/recipients', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/campaigns/:id/recipients — add one or many (JSON array or CSV file)
router.post(
  '/:id/recipients',
  upload.single('csv'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = req.params.id;

      let newRecipients: z.infer<typeof RecipientSchema>[] = [];

      if (req.file) {
        // CSV upload
        const csvText = req.file.buffer.toString('utf-8');
        const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
        newRecipients = rows.map((row: any) => RecipientSchema.parse({
          name: row.name ?? row.Name ?? '',
          email: row.email ?? row.Email ?? '',
          company: row.company ?? row.Company,
          role: row.role ?? row.Role,
          custom_fields: {},
        }));
      } else if (Array.isArray(req.body)) {
        newRecipients = req.body.map((r: unknown) => RecipientSchema.parse(r));
      } else {
        newRecipients = [RecipientSchema.parse(req.body)];
      }

      if (newRecipients.length === 0) {
        throw createError('No valid recipients provided', 400, 'NO_RECIPIENTS');
      }

      const rows = newRecipients.map((r) => ({
        campaign_id: campaignId,
        ...r,
        status: 'pending',
      }));

      const { data, error } = await supabase
        .from('recipients')
        .insert(rows)
        .select();

      if (error) throw createError(error.message, 500, 'DB_ERROR');

      // Update total_recipients count
      const { count } = await supabase
        .from('recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      await supabase
        .from('campaigns')
        .update({ total_recipients: count ?? 0, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      res.status(201).json(data);
    } catch (err) { next(err); }
  }
);

// DELETE /api/campaigns/:id/recipients/:rid
router.delete('/:id/recipients/:rid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('recipients')
      .delete()
      .eq('id', req.params.rid)
      .eq('campaign_id', req.params.id)
      .eq('status', 'pending'); // Only allow deleting pending recipients

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── Resume Upload ────────────────────────────────────────────────────────────

// POST /api/campaigns/:id/upload-resume
router.post(
  '/:id/upload-resume',
  upload.single('resume'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw createError('No file uploaded', 400, 'NO_FILE');

      const campaignId = req.params.id;
      const filePath = `${campaignId}/resume.pdf`;

      // Ensure bucket exists (auto-create if missing)
      const { data: bucketData, error: bucketErr } = await supabase.storage.getBucket('resumes');
      if (bucketErr || !bucketData) {
        console.log('[Storage] Bucket "resumes" not found, attempting auto-creation...');
        const { error: createErr } = await supabase.storage.createBucket('resumes', {
          public: false,
        });
        if (createErr && !createErr.message.includes('already exists')) {
          console.error('[Storage] Failed to create bucket:', createErr);
        }
      }

      const { error: uploadErr } = await supabase.storage
        .from('resumes')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadErr) throw createError(uploadErr.message, 500, 'STORAGE_ERROR');

      // Save path to campaign
      const { error } = await supabase
        .from('campaigns')
        .update({ resume_file_path: filePath, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) throw createError(error.message, 500, 'DB_ERROR');

      res.json({ success: true, path: filePath, filename: req.file.originalname });
    } catch (err) { next(err); }
  }
);

// ─── Preview ─────────────────────────────────────────────────────────────────

// POST /api/campaigns/:id/preview
router.post('/:id/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipient_id } = req.body as { recipient_id?: string };
    if (!recipient_id) throw createError('recipient_id required', 400, 'MISSING_PARAM');

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, templates(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!campaign) throw createError('Campaign not found', 404, 'NOT_FOUND');

    const { data: recipient } = await supabase
      .from('recipients')
      .select('*')
      .eq('id', recipient_id)
      .maybeSingle();

    if (!recipient) throw createError('Recipient not found', 404, 'NOT_FOUND');

    const template = (campaign as any).templates;
    const rendered = {
      subject: renderTemplate(template.subject, recipient as Recipient),
      body_html: renderTemplate(template.body_html, recipient as Recipient),
      body_plain: template.body_plain
        ? renderTemplate(template.body_plain, recipient as Recipient)
        : null,
      to: recipient.email,
      to_name: recipient.name,
    };

    res.json(rendered);
  } catch (err) { next(err); }
});

// ─── Send & Pause ─────────────────────────────────────────────────────────────

// POST /api/campaigns/:id/send
router.post('/:id/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaignId = req.params.id as string;

    // Check that there are pending recipients
    const { count, error: countErr } = await supabase
      .from('recipients')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (countErr) throw createError(countErr.message, 500, 'DB_ERROR');
    if (!count || count === 0) {
      throw createError('No pending recipients to send to', 400, 'NO_PENDING');
    }

    // Make sure no active send is running
    const { data: camp } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', campaignId)
      .maybeSingle();

    if (camp?.status === 'sending') {
      throw createError('Campaign is already sending', 400, 'ALREADY_SENDING');
    }

    // Fire-and-forget — returns 202 immediately
    runSendEngine(campaignId).catch((err) => {
      console.error('[SendEngine] Unhandled error:', err);
    });

    res.status(202).json({ message: 'Send job started', campaign_id: campaignId });
  } catch (err) { next(err); }
});

// POST /api/campaigns/:id/pause
router.post('/:id/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    requestPause(req.params.id as string);
    res.json({ message: 'Pause requested — will stop after current email completes' });
  } catch (err) { next(err); }
});

// GET /api/campaigns/:id/check-replies
router.get('/:id/check-replies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { checkReplies } = await import('../services/replyTracker');
    const result = await checkReplies(req.params.id as string);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/campaigns/:id/retry-failed
router.post('/:id/retry-failed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaignId = req.params.id as string;

    // Refuse if campaign is already actively sending
    const { data: camp } = await supabase
      .from('campaigns')
      .select('status, failed_count')
      .eq('id', campaignId)
      .maybeSingle();

    if (!camp) throw createError('Campaign not found', 404, 'NOT_FOUND');
    if (camp.status === 'sending') {
      throw createError('Campaign is already sending', 400, 'ALREADY_SENDING');
    }

    // Reset all failed recipients back to pending
    const { count: resetCount, error: resetErr } = await supabase
      .from('recipients')
      .update({ status: 'pending', error_message: null, sent_at: null })
      .eq('campaign_id', campaignId)
      .eq('status', 'failed')
      .select('*');

    if (resetErr) throw createError(resetErr.message, 500, 'DB_ERROR');

    if (!resetCount || resetCount === 0) {
      throw createError('No failed recipients to retry', 400, 'NO_FAILED');
    }

    // Reset the campaign's failed_count to 0
    await supabase
      .from('campaigns')
      .update({ failed_count: 0, updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    // Re-trigger the send engine
    runSendEngine(campaignId).catch((err) => {
      console.error('[SendEngine] Unhandled error during retry:', err);
    });

    res.status(202).json({ message: `Retrying ${resetCount} failed recipient(s)`, campaign_id: campaignId, retried: resetCount });
  } catch (err) { next(err); }
});

export default router;
