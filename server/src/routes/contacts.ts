import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

const router = Router();

// GET /api/contacts?search=&company=
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, company } = req.query as { search?: string; company?: string };

    let query = supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }
    if (company) {
      query = query.ilike('company', `%${company}%`);
    }

    const { data, error } = await query;
    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/contacts/:id — with campaign history
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (contactErr) throw createError(contactErr.message, 500, 'DB_ERROR');
    if (!contact) throw createError('Contact not found', 404, 'NOT_FOUND');

    // Get their full campaign history via sent_emails
    const { data: history } = await supabase
      .from('sent_emails')
      .select('*, campaigns(name, status)')
      .eq('to_email', (contact as any).email)
      .order('sent_at', { ascending: false });

    res.json({ ...contact, history: history ?? [] });
  } catch (err) { next(err); }
});

// PUT /api/contacts/:id — update notes/role/company
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name:    z.string().min(1).optional(),
      company: z.string().optional(),
      role:    z.string().optional(),
      notes:   z.string().optional(),
    });
    const body = schema.parse(req.body);

    const { data, error } = await supabase
      .from('contacts')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    if (!data) throw createError('Contact not found', 404, 'NOT_FOUND');
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /api/contacts/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase.from('contacts').delete().eq('id', req.params.id);
    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
