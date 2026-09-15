import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

const router = Router();

const TemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body_html: z.string().min(1),
  // The database column is nullable and existing templates may have no
  // generated plain-text body.
  body_plain: z.string().nullable().optional(),
});

// GET /api/templates
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/templates/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    if (!data) throw createError('Template not found', 404, 'NOT_FOUND');
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/templates
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = TemplateSchema.parse(req.body);
    const { data, error } = await supabase
      .from('templates')
      .insert(body)
      .select()
      .single();

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PUT /api/templates/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = TemplateSchema.partial().parse(req.body);
    const { data, error } = await supabase
      .from('templates')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    if (!data) throw createError('Template not found', 404, 'NOT_FOUND');
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', req.params.id);

    if (error) throw createError(error.message, 500, 'DB_ERROR');
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
