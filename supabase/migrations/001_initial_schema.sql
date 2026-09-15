-- ============================================================
-- Dor — Initial Schema
-- Run this in the Supabase SQL editor for your project.
-- ============================================================

-- Enable UUID extension (usually enabled by default in Supabase)
create extension if not exists "pgcrypto";

-- ============================================================
-- GMAIL OAUTH TOKENS
-- Singleton row (id always = 1). Stores the connected Gmail account.
-- ============================================================
create table if not exists public.gmail_tokens (
  id              int primary key default 1 check (id = 1),
  email           text not null,
  access_token    text not null,
  refresh_token   text not null,
  token_expiry    timestamptz not null,
  connected_at    timestamptz not null default now()
);

-- ============================================================
-- TEMPLATES
-- ============================================================
create table if not exists public.templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  subject     text not null,
  body_html   text not null,
  body_plain  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
create table if not exists public.campaigns (
  id               uuid primary key default gen_random_uuid(),
  template_id      uuid not null references public.templates(id) on delete restrict,
  name             text not null default 'Untitled Campaign',
  resume_file_path text,
  delay_seconds    int not null default 5,
  daily_limit      int not null default 50,
  status           text not null default 'draft'
                     check (status in ('draft', 'sending', 'paused', 'completed', 'failed')),
  total_recipients int not null default 0,
  sent_count       int not null default 0,
  failed_count     int not null default 0,
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- RECIPIENTS
-- ============================================================
create table if not exists public.recipients (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  name          text not null,
  email         text not null,
  company       text,
  role          text,
  custom_fields jsonb not null default '{}',
  status        text not null default 'pending'
                  check (status in ('pending', 'sent', 'failed', 'bounced')),
  sent_at       timestamptz,
  error_message text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- SENT EMAILS LOG (immutable audit trail)
-- ============================================================
create table if not exists public.sent_emails (
  id               uuid primary key default gen_random_uuid(),
  campaign_id      uuid not null references public.campaigns(id) on delete cascade,
  recipient_id     uuid not null references public.recipients(id) on delete cascade,
  to_email         text not null,
  to_name          text not null,
  subject          text not null,
  company          text,
  role             text,
  gmail_message_id text,
  status           text not null default 'sent'
                     check (status in ('sent', 'failed')),
  error_message    text,
  sent_at          timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_recipients_campaign on public.recipients(campaign_id);
create index if not exists idx_recipients_status on public.recipients(campaign_id, status);
create index if not exists idx_sent_emails_campaign on public.sent_emails(campaign_id);
create index if not exists idx_sent_emails_date on public.sent_emails(sent_at desc);

-- ============================================================
-- HELPER RPC FUNCTIONS (used by the send engine)
-- ============================================================

-- Atomically increment sent_count
create or replace function increment_campaign_sent(campaign_id uuid)
returns void language sql as $$
  update public.campaigns
  set sent_count = sent_count + 1, updated_at = now()
  where id = campaign_id;
$$;

-- Atomically increment failed_count
create or replace function increment_campaign_failed(campaign_id uuid)
returns void language sql as $$
  update public.campaigns
  set failed_count = failed_count + 1, updated_at = now()
  where id = campaign_id;
$$;

-- ============================================================
-- STORAGE BUCKET
-- Run this separately in Supabase Storage settings, OR via the dashboard:
--   1. Go to Storage → Create bucket → name: "resumes"
--   2. Set to Private
--   3. The backend uses the service role key so no bucket policies needed
-- ============================================================

-- ============================================================
-- NOTES ON SECURITY
-- Since this is a personal single-user tool:
-- • No RLS is enabled (all access is through the service role key)
-- • The backend is only accessible from localhost by default
-- • Never expose your SUPABASE_SERVICE_ROLE_KEY to the frontend
-- ============================================================
