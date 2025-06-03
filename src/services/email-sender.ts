/**
 * Email Sender Service
 * 
 * Sends email responses using the Resend API.
 * https://resend.com/docs/api-reference/emails/send-email
 */

import { logger } from './logger.js';

export interface EmailResponse {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  threadId?: string;
}

export interface SendResult {
  success: boolean;
  data?: {
    messageId: string;
  };
  error?: string;
}

export async function sendEmailResponse(email: EmailResponse): Promise<SendResult> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'coach@coachartie.ai';
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    // Prepare the email payload
    const payload = {
      from: fromEmail,
      to: [email.to],
      subject: email.subject,
      html: formatEmailHtml(email.body),
      text: email.body,
      // Add reply-to threading headers if available
      ...(email.inReplyTo && {
        headers: {
          'In-Reply-To': email.inReplyTo,
          'References': email.inReplyTo
        }
      })
    };

    logger.info('Sending email via Resend', {
      to: email.to,
      subject: email.subject,
      bodyLength: email.body.length,
      inReplyTo: email.inReplyTo
    });

    // Send the email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    
    logger.info('Email sent successfully', {
      messageId: result.id,
      to: email.to
    });

    return {
      success: true,
      data: {
        messageId: result.id
      }
    };

  } catch (error) {
    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: email.to,
      subject: email.subject
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format plain text response as HTML email
 */
function formatEmailHtml(textBody: string): string {
  // Convert plain text to basic HTML
  const htmlBody = textBody
    .replace(/\n\n/g, '</p><p>')  // Double newlines become paragraph breaks
    .replace(/\n/g, '<br>')       // Single newlines become line breaks
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
    .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic text

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Coach Artie Response</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .coach-signature {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <p>${htmlBody}</p>
        
        <div class="coach-signature">
            <p>Best regards,<br>
            <strong>Coach Artie</strong><br>
            <em>Your AI Coaching Assistant</em></p>
        </div>
    </body>
    </html>
  `;
}