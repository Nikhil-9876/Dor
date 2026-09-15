import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { config } from '../config';

/**
 * Admin Supabase client — uses the service role key to bypass RLS.
 * Only used server-side. Never expose this key to the frontend.
 * ws is passed as transport so Supabase works on Node 20 (no native WebSocket).
 */
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as any,
      params: { eventsPerSecond: -1 },
    },
  }
);
