# RefMail 🚀

A personal referral outreach tool that sends **individually-addressed** referral-request emails (with your resume attached) to multiple recipients. Every email is sent as a separate API call — no BCC, no bulk sends. Everything is stored in Supabase so you can track who you've contacted and easily add new recipients to past campaigns.

## Features

- **Template editor** — Rich-text editor with `{{first_name}}`, `{{company}}`, `{{role}}` placeholders
- **Campaign management** — Multi-step wizard to create and send campaigns
- **Resume attachment** — Upload once, attached to every email automatically
- **CSV import** — Bulk-add recipients from a CSV file
- **Send history** — Immutable audit log of every email sent
- **Resend to new recipients** — Add people to past campaigns and send only to them
- **Live send progress** — Real-time progress bar during active sends
- **Gmail OAuth2** — Sends from your own Gmail account; emails appear in your Sent folder
- **Dark mode** — System-aware theme with manual toggle

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v3 |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Email Sending | Gmail API via OAuth2 |

---

## Setup

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google Cloud project with the Gmail API enabled

### 1. Clone and install

```bash
git clone <repo-url>
cd RefMail

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Edit server/.env with your actual values
```

### 3. Set up Supabase

1. Go to your Supabase project → **SQL Editor**
2. Run the contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage** → Create a bucket named `resumes` (set to **Private**)

### 4. Set up Google OAuth2

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable the **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
4. Create OAuth credentials: APIs & Services → Credentials → Create OAuth 2.0 Client
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3001/api/auth/gmail/callback`
5. Copy **Client ID** and **Client Secret** to `server/.env`

### 5. Run the app

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Connect Gmail

1. Go to **Settings** in the app
2. Click **Connect Gmail**
3. Authorize access in the Google consent screen
4. You're ready to send!

---

## Workflow

```
Create Template → Create Campaign → Add Recipients → Upload Resume → Send → Track History
                                                                            ↓
                                                              Add more recipients to same campaign
                                                              → Send only to new people ✓
```

## Project Structure

```
RefMail/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # UI + layout + feature components
│       ├── context/        # ThemeContext
│       ├── hooks/          # React Query hooks (data fetching)
│       ├── lib/            # Axios client, utilities
│       └── pages/          # Route-level page components
├── server/                 # Express backend (TypeScript)
│   └── src/
│       ├── lib/            # Supabase + Google OAuth clients
│       ├── middleware/     # Error handler
│       ├── routes/         # API route handlers
│       ├── services/       # Gmail service, template renderer, send engine
│       └── types/          # Shared TypeScript types
└── supabase/
    └── migrations/         # SQL schema (run in Supabase SQL editor)
```

## Gmail Rate Limits

| Account Type | Daily Limit |
|---|---|
| Personal Gmail | ~500 emails/day |
| Google Workspace | ~2,000 emails/day |

The app enforces configurable daily limits per campaign and adds a configurable delay between sends (default: 5 seconds) to avoid triggering spam filters.

## Security Notes

- **Never expose** your `SUPABASE_SERVICE_ROLE_KEY` or `GOOGLE_CLIENT_SECRET` — they live only in `server/.env`
- The backend uses the service role key to bypass Supabase RLS (intentional for a single-user tool)
- Gmail OAuth tokens are stored in Supabase and auto-refreshed when needed
