import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: parseInt(optional('PORT', '3001'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  google: {
    clientId: required('GOOGLE_CLIENT_ID'),
    clientSecret: required('GOOGLE_CLIENT_SECRET'),
    redirectUri: optional(
      'GOOGLE_REDIRECT_URI',
      'http://localhost:3001/api/auth/gmail/callback'
    ),
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ] as const,
  },

  sending: {
    defaultDelaySeconds: parseInt(optional('DEFAULT_DELAY_SECONDS', '5'), 10),
    defaultDailyLimit: parseInt(optional('DEFAULT_DAILY_LIMIT', '50'), 10),
  },
} as const;
