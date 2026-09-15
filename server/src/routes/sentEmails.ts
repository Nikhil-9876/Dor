import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

const router = Router();

// GET /api/sent-emails?campaign_id=X&page=1&limit=50
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaignId = req.query.campaign_id as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit as string ?? '50', 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('sent_emails')
      .select('*, campaigns(name)', { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(from, to);

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error, count } = await query;
    if (error) throw createError(error.message, 500, 'DB_ERROR');

    res.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) { next(err); }
});

export default router;
