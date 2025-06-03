/**
 * Email Parser Service
 * 
 * Parses incoming email data from Cloudflare Email Worker webhook.
 * Expected payload structure:
 * {
 *   from: string,
 *   to: string,
 *   subject: string,
 *   messageId: string,
 *   inReplyTo?: string,
 *   body: {
 *     html?: string,
 *     text: string
 *   },
 *   headers: Record<string, string>
 * }
 */

import { logger } from './logger.js';

export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  messageId: string;
  inReplyTo?: string;
  threadId?: string;
  headers: Record<string, string>;
}

export async function parseIncomingEmail(
  body: any, 
  headers: Record<string, any>
): Promise<ParsedEmail | null> {
  try {
    // Verify webhook authentication
    const authHeader = headers['x-webhook-secret'];
    const expectedSecret = process.env.WEBHOOK_SECRET;
    
    if (expectedSecret && authHeader !== expectedSecret) {
      logger.error('Invalid webhook authentication', { authHeader });
      return null;
    }

    // Parse JSON payload from Cloudflare Email Worker
    let emailData;
    if (typeof body === 'string') {
      emailData = JSON.parse(body);
    } else {
      emailData = body;
    }

    // Validate required fields
    if (!emailData.from || !emailData.to || !emailData.subject) {
      logger.error('Missing required email fields', { emailData });
      return null;
    }

    // Extract thread ID from subject or in-reply-to
    const threadId = extractThreadId(emailData.subject, emailData.inReplyTo);

    // Parse the raw email to extract body text
    const bodyText = parseEmailBody(emailData.raw);

    const parsed: ParsedEmail = {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      body: bodyText,
      messageId: emailData.messageId,
      inReplyTo: emailData.inReplyTo,
      threadId,
      headers: emailData.headers || {}
    };

    logger.info('Successfully parsed email', {
      from: parsed.from,
      subject: parsed.subject,
      threadId: parsed.threadId,
      bodyLength: parsed.body.length
    });

    return parsed;

  } catch (error) {
    logger.error('Failed to parse email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: typeof body === 'string' ? body.substring(0, 200) : 'Non-string body'
    });
    return null;
  }
}

/**
 * Extract thread ID from subject line or in-reply-to header
 */
function extractThreadId(subject: string, inReplyTo?: string): string | undefined {
  // Check if subject has "Re:" indicating a reply
  if (subject.startsWith('Re: ')) {
    // Extract thread ID from subject or use in-reply-to
    return inReplyTo;
  }
  
  // For new conversations, no thread ID yet
  return undefined;
}

/**
 * Parse raw email body text from email content
 */
function parseEmailBody(rawEmail: string): string {
  const lines = rawEmail.split('\n');
  let inBody = false;
  let bodyLines = [];
  let contentType = 'text/plain';

  for (const line of lines) {
    // Headers end at first empty line
    if (!inBody && line.trim() === '') {
      inBody = true;
      continue;
    }

    // Check for content type in headers
    if (!inBody && line.toLowerCase().includes('content-type:')) {
      if (line.toLowerCase().includes('text/html')) {
        contentType = 'text/html';
      }
    }

    if (inBody) {
      bodyLines.push(line);
    }
  }

  let bodyText = bodyLines.join('\n').trim();

  // If HTML, do basic conversion to text
  if (contentType === 'text/html') {
    bodyText = stripHtml(bodyText);
  }

  return bodyText;
}

/**
 * Basic HTML to text conversion
 */
function stripHtml(html?: string): string {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&lt;/g, '<')   // Replace &lt; with <
    .replace(/&gt;/g, '>')   // Replace &gt; with >
    .replace(/&amp;/g, '&')  // Replace &amp; with &
    .replace(/\s+/g, ' ')    // Replace multiple whitespace with single space
    .trim();
}