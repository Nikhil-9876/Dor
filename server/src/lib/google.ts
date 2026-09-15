import { google } from 'googleapis';
import { config } from '../config';

/**
 * Returns a configured Google OAuth2 client.
 * Call setCredentials() on it before using the Gmail API.
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

/**
 * Generate the Google OAuth2 consent URL.
 * access_type=offline ensures we get a refresh_token.
 * prompt=consent forces the consent screen even if already granted
 * (needed to get refresh_token on repeat authorizations).
 */
export function getAuthUrl(): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [...config.google.scopes],
  });
}
