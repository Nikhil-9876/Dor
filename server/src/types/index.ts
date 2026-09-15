// ============================================================
// Shared TypeScript types across the backend
// ============================================================

export interface GmailTokens {
  id: number;
  email: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  connected_at: string;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_plain?: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = 'draft' | 'sending' | 'paused' | 'completed' | 'failed';

export interface Campaign {
  id: string;
  template_id: string;
  name: string;
  resume_file_path?: string;
  delay_seconds: number;
  daily_limit: number;
  status: CampaignStatus;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type RecipientStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export interface Recipient {
  id: string;
  campaign_id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  custom_fields: Record<string, string>;
  status: RecipientStatus;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export interface SentEmail {
  id: string;
  campaign_id: string;
  recipient_id: string;
  to_email: string;
  to_name: string;
  subject: string;
  company?: string;
  role?: string;
  gmail_message_id?: string;
  status: 'sent' | 'failed';
  error_message?: string;
  sent_at: string;
}

// DTO types for API request bodies
export interface CreateTemplateDto {
  name: string;
  subject: string;
  body_html: string;
  body_plain?: string | null;
}

export interface CreateCampaignDto {
  template_id: string;
  name?: string;
  delay_seconds?: number;
  daily_limit?: number;
}

export interface AddRecipientDto {
  name: string;
  email: string;
  company?: string;
  role?: string;
  custom_fields?: Record<string, string>;
}

export interface PreviewRequestDto {
  recipient_id: string;
}

// Extend Express Request to carry typed body
declare global {
  namespace Express {
    interface Request {
      // multer file
      file?: Express.Multer.File;
    }
  }
}
