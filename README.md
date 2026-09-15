<p align="center">
  <h1 align="center">Dor ✉️</h1>
  <p align="center">
    <strong>Your personal referral outreach engine — send individually-addressed referral emails at scale, straight from your own Gmail.</strong>
  </p>
  <p align="center">
    <a href="#-features">Features</a> · <a href="#-tech-stack">Tech Stack</a> · <a href="#-local-setup">Local Setup</a> · <a href="#-project-structure">Project Structure</a> · <a href="#-how-it-works">How It Works</a>
  </p>
</p>

---

## 🤔 The Problem

You're job hunting. You've found roles you love. You know referrals are the **#1 way** to get your resume noticed — but reaching out to people one-by-one is painful:

- 📧 **Copy-pasting the same email** dozens of times with small tweaks (name, company, role)
- 📎 **Manually attaching your resume** to every single message
- 🧠 **Losing track** of who you've already emailed and who you haven't
- 🚫 **BCC blasts feel impersonal** — and they get flagged as spam
- 📊 **No visibility** into who replied and who ghosted you

Most people give up after 5–10 manual emails. That's not a strategy — that's a lottery ticket.

## 💡 The Solution

**Dor** automates the entire referral outreach workflow while keeping every email **personal and authentic**. Each email is sent as a **separate, individual message** from your own Gmail account — no BCC, no bulk sends, no third-party email services. Recipients see a normal email in their inbox, and every sent message appears in **your** Gmail Sent folder.

You write the template once with placeholders like `{{first_name}}`, `{{company}}`, and `{{role}}`, import your contacts via CSV, attach your resume, and hit send. Dor handles the rest — with built-in rate limiting, delay controls, reply tracking, and a full audit log of every email sent.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 **Rich Template Editor** | Write email templates with a TipTap rich-text editor. Use placeholders like `{{first_name}}`, `{{company}}`, `{{role}}` for personalization. |
| 🚀 **Campaign Wizard** | Multi-step campaign creation — pick a template, add recipients, upload your resume, configure send settings, and launch. |
| 📎 **Resume Attachment** | Upload your resume once per campaign. It's automatically attached to every outgoing email. Stored securely in Supabase Storage. |
| 📋 **CSV Import** | Bulk-add recipients from a CSV file. Map columns to fields and import hundreds of contacts in seconds. |
| 👥 **Contact Management** | Centralized contact book auto-synced from campaign recipients. Search, filter, and manage all your referral contacts. |
| 📊 **Dashboard & Analytics** | At-a-glance stats — total emails sent, campaigns run, reply rates, and recent activity. |
| 📜 **Send History** | Immutable audit log of every email sent. See exactly what was sent, to whom, and when. |
| 🔄 **Resend to New Recipients** | Add new people to a past campaign and send **only to the new recipients** — no duplicates. |
| 📡 **Live Send Progress** | Real-time progress bar via WebSockets during active sends. Watch your emails go out one-by-one. |
| 💬 **Reply Tracking** | Automatically checks Gmail threads for replies so you know who responded. |
| 🔐 **Gmail OAuth2** | Sends from your own Gmail account using OAuth2. Tokens are auto-refreshed. No app passwords, no SMTP config. |
| 🌙 **Dark Mode** | System-aware theme with a manual toggle. Beautiful in both light and dark. |
| ⚡ **Rate Limiting & Delays** | Configurable per-campaign send delay and daily limits to avoid triggering Gmail's spam filters. |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · Vite · TypeScript · Tailwind CSS v3 |
| **UI Components** | TipTap (Rich Text) · Lucide Icons · React Hot Toast |
| **Data Fetching** | TanStack React Query · Axios |
| **Routing** | React Router v7 |
| **Backend** | Node.js · Express · TypeScript |
| **Validation** | Zod |
| **Database** | Supabase (PostgreSQL) |
| **File Storage** | Supabase Storage |
| **Email** | Gmail API via OAuth2 |
| **Real-time** | WebSockets (ws) |
| **Security** | Helmet · CORS · Express Rate Limit |

---

## 🚀 Local Setup

### Prerequisites

Before you begin, make sure you have:

- **Node.js** v18 or higher → [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **A Supabase project** → [Create one (free)](https://supabase.com)
- **A Google Cloud project** with the Gmail API enabled → [Console](https://console.cloud.google.com)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/Dor.git
cd Dor
```

### 2️⃣ Install Dependencies

From the project root, install everything in one command:

```bash
npm run install:all
```

This installs dependencies for the root, `client/`, and `server/` directories.

<details>
<summary>Or install manually</summary>

```bash
# Root (concurrently for running both servers)
npm install

# Server
cd server && npm install

# Client
cd ../client && npm install
```

</details>

### 3️⃣ Set Up Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project → **SQL Editor**
3. Run the migration files **in order**:
   - First: Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
   - Then: Copy and run the contents of `supabase/migrations/002_contacts_replies.sql`
4. Go to **Storage** → Click **New Bucket**:
   - Name: `resumes`
   - Set to **Private**

5. Note down the following from **Settings → API**:
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — your service role key (⚠️ keep this secret)

### 4️⃣ Set Up Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. **Enable the Gmail API**:
   - Navigate to **APIs & Services → Library**
   - Search for **"Gmail API"** → Click **Enable**
4. **Create OAuth 2.0 Credentials**:
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Add Authorized redirect URI:
     ```
     http://localhost:3001/api/auth/gmail/callback
     ```
5. Copy your **Client ID** and **Client Secret**

> [!IMPORTANT]
> If your app is in "Testing" mode on Google Cloud, you must add your Gmail address as a **test user** under **OAuth consent screen → Test users**.

### 5️⃣ Configure Environment Variables

Create the server environment file:

```bash
cp server/.env.example server/.env
```

If `.env.example` doesn't exist, create `server/.env` manually:

```env
# ── Server ──────────────────────────────────
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ── Supabase ────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ── Google OAuth2 ───────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback

# ── Send Defaults ───────────────────────────
DEFAULT_DELAY_SECONDS=5
DEFAULT_DAILY_LIMIT=50
```

> [!CAUTION]
> **Never commit your `.env` file.** It contains secrets (Supabase service role key, Google client secret). The `.gitignore` is already configured to exclude it.

### 6️⃣ Start the Development Servers

From the project root, run both frontend and backend simultaneously:

```bash
npm run dev
```

This uses `concurrently` to start:
- 🖥 **Backend** → `http://localhost:3001`
- 🌐 **Frontend** → `http://localhost:5173`

<details>
<summary>Or start them separately in two terminals</summary>

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

</details>

### 7️⃣ Connect Your Gmail Account

1. Open the app at [http://localhost:5173](http://localhost:5173)
2. Navigate to **Settings** (gear icon in the sidebar)
3. Click **Connect Gmail**
4. Authorize access in the Google consent screen
5. You'll be redirected back — you're ready to send! ✅

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   📝 Create Template     Use placeholders: {{first_name}}, {{company}} │
│         ↓                                                               │
│   🚀 Create Campaign     Pick template, set delay & daily limits        │
│         ↓                                                               │
│   👥 Add Recipients      Import via CSV or add manually                 │
│         ↓                                                               │
│   📎 Upload Resume       Attached automatically to every email          │
│         ↓                                                               │
│   ✉️  Send Campaign       Each email sent individually via Gmail API    │
│         ↓                                                               │
│   📊 Track Results       View send history, check for replies           │
│         ↓                                                               │
│   🔄 Resend to New       Add more people to same campaign, send again   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
Dor/
├── client/                          # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── gmail/               # Gmail-specific components
│   │   │   ├── layout/              # Layout shell (Sidebar, Header)
│   │   │   └── ui/                  # Reusable UI primitives
│   │   │       ├── Badge.tsx        #   Status badges
│   │   │       ├── Button.tsx       #   Primary/secondary buttons
│   │   │       ├── Card.tsx         #   Content cards
│   │   │       ├── FAB.tsx          #   Floating action button
│   │   │       ├── Input.tsx        #   Form inputs
│   │   │       ├── Modal.tsx        #   Modal dialogs
│   │   │       ├── ThemeRipple.tsx  #   Theme transition effect
│   │   │       └── ThemeToggle.tsx  #   Dark/light mode toggle
│   │   ├── context/
│   │   │   └── ThemeContext.tsx      # Theme state management
│   │   ├── hooks/
│   │   │   ├── useCampaigns.ts      # Campaign CRUD + send operations
│   │   │   ├── useContacts.ts       # Contact management queries
│   │   │   ├── useGmail.ts          # Gmail connection status
│   │   │   └── useTemplates.ts      # Template CRUD operations
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios client configuration
│   │   │   └── utils.ts             # Shared utility functions
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Home — stats & recent activity
│   │   │   ├── TemplatesPage.tsx    # Create & manage templates
│   │   │   ├── CampaignsListPage.tsx# All campaigns list
│   │   │   ├── CampaignPage.tsx     # Campaign creation wizard
│   │   │   ├── CampaignDetailPage.tsx# Campaign details & resend
│   │   │   ├── ContactsPage.tsx     # Contact book
│   │   │   ├── SettingsPage.tsx     # Gmail connection & settings
│   │   │   └── OAuthCallbackPage.tsx# OAuth redirect handler
│   │   ├── App.tsx                  # Root component + routing
│   │   ├── App.css                  # App-level styles
│   │   ├── index.css                # Global styles + Tailwind
│   │   └── main.tsx                 # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── server/                          # Express backend (TypeScript)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── google.ts            # Google OAuth2 client setup
│   │   │   └── supabase.ts          # Supabase client initialization
│   │   ├── middleware/
│   │   │   └── errorHandler.ts      # Global error handling middleware
│   │   ├── routes/
│   │   │   ├── campaigns.ts         # Campaign CRUD + send endpoints
│   │   │   ├── contacts.ts          # Contact management endpoints
│   │   │   ├── gmail.ts             # OAuth flow + Gmail status
│   │   │   ├── health.ts            # Health check endpoint
│   │   │   ├── sentEmails.ts        # Send history queries
│   │   │   └── templates.ts         # Template CRUD endpoints
│   │   ├── services/
│   │   │   ├── gmailService.ts      # Gmail API wrapper (send, read)
│   │   │   ├── replyTracker.ts      # Check threads for replies
│   │   │   ├── sendEngine.ts        # Orchestrates campaign sends
│   │   │   └── templateRenderer.ts  # Replaces placeholders in templates
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript type definitions
│   │   ├── config.ts                # Environment variable configuration
│   │   └── index.ts                 # Server entry point
│   ├── tsconfig.json
│   └── package.json
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql   # Core tables: templates, campaigns, recipients, sent_emails
│       └── 002_contacts_replies.sql # Contacts table + reply tracking columns
│
├── .gitignore
├── package.json                     # Root scripts (dev, install:all, build)
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| **Gmail** | | |
| `GET` | `/api/auth/gmail/url` | Get OAuth consent URL |
| `GET` | `/api/auth/gmail/callback` | OAuth redirect handler |
| `GET` | `/api/auth/gmail/status` | Check connection status |
| `DELETE` | `/api/auth/gmail/disconnect` | Disconnect Gmail |
| **Templates** | | |
| `GET` | `/api/templates` | List all templates |
| `POST` | `/api/templates` | Create a template |
| `PUT` | `/api/templates/:id` | Update a template |
| `DELETE` | `/api/templates/:id` | Delete a template |
| **Campaigns** | | |
| `GET` | `/api/campaigns` | List all campaigns |
| `GET` | `/api/campaigns/:id` | Get campaign details |
| `POST` | `/api/campaigns` | Create a campaign |
| `POST` | `/api/campaigns/:id/send` | Start sending a campaign |
| **Contacts** | | |
| `GET` | `/api/contacts` | List all contacts |
| **Sent Emails** | | |
| `GET` | `/api/sent-emails` | Query send history |

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL (for CORS) |
| `SUPABASE_URL` | ✅ Yes | — | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | — | Supabase service role key |
| `GOOGLE_CLIENT_ID` | ✅ Yes | — | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | — | Google OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | No | `http://localhost:3001/api/auth/gmail/callback` | OAuth redirect URI |
| `DEFAULT_DELAY_SECONDS` | No | `5` | Seconds between each email send |
| `DEFAULT_DAILY_LIMIT` | No | `50` | Max emails per campaign per day |

---

## 📬 Gmail Rate Limits

| Account Type | Daily Limit |
|---|---|
| Personal Gmail (`@gmail.com`) | ~500 emails/day |
| Google Workspace | ~2,000 emails/day |

Dor enforces configurable daily limits per campaign and adds a delay between sends (default: 5 seconds) to stay well within Gmail's thresholds and avoid spam filters.

---

## 🔒 Security Notes

- 🔑 **Secrets stay server-side** — `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_CLIENT_SECRET` never leave the backend
- 🛡 **Helmet** — sets secure HTTP headers automatically
- 🚦 **Rate limiting** — Express rate limiter protects API endpoints
- 🔐 **OAuth2 tokens** — stored in Supabase, auto-refreshed on expiry. No passwords stored.
- 🏠 **Single-user tool** — designed for personal use. No RLS enabled (all access through service role key). Backend is only accessible from localhost by default.
- 🚫 **No BCC** — every email is a separate Gmail API call, so your recipients never see each other

> [!WARNING]
> This is a **personal tool** designed for local use. If you deploy it publicly, add authentication, enable Supabase RLS, and restrict CORS origins.

---

## 📜 Available Scripts

| Command | Where | What it does |
|---|---|---|
| `npm run dev` | Root | Starts both client and server concurrently |
| `npm run install:all` | Root | Installs all dependencies (root + client + server) |
| `npm run build` | Root | Production build for both client and server |
| `npm run dev` | `client/` | Starts Vite dev server on port 5173 |
| `npm run build` | `client/` | TypeScript check + Vite production build |
| `npm run preview` | `client/` | Preview the production build locally |
| `npm run dev` | `server/` | Starts Express with ts-node-dev (hot reload) |
| `npm run build` | `server/` | Compiles TypeScript to JavaScript |
| `npm run start` | `server/` | Runs the compiled server (`dist/index.js`) |
| `npm run typecheck` | `server/` | TypeScript type checking without emitting |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m "feat: add amazing feature"`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is for personal use. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for job seekers who believe in the power of referrals.
</p>
