-- ============================================================
-- Dor — Migration 002: Contacts + Reply Tracking
-- Run this in the Supabase SQL editor.
-- ============================================================

-- ============================================================
-- CONTACTS
-- One row per unique person (email is unique key).
-- Auto-synced via trigger when a recipient is inserted.
-- ============================================================
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  company    text,
  role       text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_email_unique unique (email)
);

create index if not exists idx_contacts_email   on public.contacts(email);
create index if not exists idx_contacts_company on public.contacts(lower(company));

-- Auto-sync contacts when a recipient is added to a campaign
create or replace function sync_contact_from_recipient()
returns trigger language plpgsql as $$
begin
  insert into public.contacts (name, email, company, role)
  values (new.name, new.email, new.company, new.role)
  on conflict (email) do update
    set name       = excluded.name,
        company    = coalesce(excluded.company, contacts.company),
        role       = coalesce(excluded.role, contacts.role),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sync_contact on public.recipients;
create trigger trg_sync_contact
  after insert on public.recipients
  for each row execute function sync_contact_from_recipient();

-- Back-fill contacts from existing recipients
insert into public.contacts (name, email, company, role)
select distinct on (email) name, email, company, role
from public.recipients
order by email, created_at asc
on conflict (email) do nothing;

-- ============================================================
-- REPLY TRACKING columns on sent_emails
-- ============================================================
alter table public.sent_emails
  add column if not exists gmail_thread_id     text,
  add column if not exists replied             boolean not null default false,
  add column if not exists reply_snippet       text,
  add column if not exists reply_received_at   timestamptz;

create index if not exists idx_sent_emails_thread on public.sent_emails(gmail_thread_id)
  where gmail_thread_id is not null;
