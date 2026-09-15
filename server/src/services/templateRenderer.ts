import { Recipient } from '../types';

/**
 * Supported placeholder patterns:
 *   {{first_name}}     — from recipient.name (first word)
 *   {{name}}           — full recipient name
 *   {{email}}          — recipient email
 *   {{company}}        — recipient company
 *   {{role}}           — recipient role
 *   {{custom.KEY}}     — from recipient.custom_fields.KEY
 */
export function renderTemplate(
  template: string,
  recipient: Recipient
): string {
  const firstName = recipient.name.split(' ')[0] ?? recipient.name;

  const data: Record<string, string> = {
    first_name: firstName,
    name: recipient.name,
    email: recipient.email,
    company: recipient.company ?? '',
    role: recipient.role ?? '',
    // Flatten custom fields as custom.KEY → value
    ...Object.fromEntries(
      Object.entries(recipient.custom_fields ?? {}).map(([k, v]) => [
        `custom.${k}`,
        String(v),
      ])
    ),
  };

  return template.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const trimmed = key.trim();
    return data[trimmed] !== undefined ? data[trimmed] : match;
  });
}
