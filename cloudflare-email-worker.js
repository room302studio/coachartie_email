/**
 * Cloudflare Email Worker
 * 
 * This worker receives emails via Cloudflare Email Routing and forwards them
 * to the Coach Artie email webhook API running on the VPS.
 * 
 * Deploy this to Cloudflare Workers and configure Email Routing to use it.
 * 
 * Environment Variables needed:
 * - WEBHOOK_URL: https://email.coachartiebot.com/webhook/email
 * - WEBHOOK_SECRET: Bearer token for authentication
 * - APPROVED_RECIPIENTS: Comma-separated list of allowed recipient emails (optional)
 */

export default {
  async email(message, env, ctx) {
    try {
      console.log('Processing incoming email', {
        from: message.from,
        to: message.to,
        subject: message.headers.get('subject')
      });

      // Optional: Filter by approved recipients
      if (env.APPROVED_RECIPIENTS) {
        const approvedList = env.APPROVED_RECIPIENTS.split(',').map(email => email.trim());
        if (!approvedList.includes(message.to)) {
          console.log('Recipient not in approved list, rejecting', {
            to: message.to,
            approved: approvedList
          });
          await message.setReject('Email address not configured for Coach Artie');
          return;
        }
      }

      // Read the email content
      const reader = message.raw.getReader();
      const { value } = await reader.read();
      const rawEmail = new TextDecoder().decode(value);

      // Parse email headers and body
      const emailData = await parseEmailMessage(message, rawEmail);
      
      // Forward to webhook
      const webhookResponse = await forwardToWebhook(emailData, env);
      
      if (webhookResponse.success) {
        console.log('Email successfully forwarded to webhook', {
          from: message.from,
          webhookResponse: webhookResponse.messageId
        });
      } else {
        console.error('Webhook forwarding failed', {
          from: message.from,
          error: webhookResponse.error
        });
        
        // Send error response to sender
        await message.reply({
          from: message.to,
          to: message.from,
          subject: 'Re: ' + message.headers.get('subject'),
          text: 'Sorry, I\'m temporarily unable to process your email. Please try again later.'
        });
      }

    } catch (error) {
      console.error('Email worker error', {
        error: error.message,
        stack: error.stack,
        from: message.from
      });
      
      // Try to send error response
      try {
        await message.reply({
          from: message.to,
          to: message.from,
          subject: 'Re: ' + message.headers.get('subject'),
          text: 'Sorry, there was an error processing your email. Please try again later.'
        });
      } catch (replyError) {
        console.error('Failed to send error reply', { error: replyError.message });
      }
    }
  }
};

/**
 * Parse the email message into a structured format
 */
async function parseEmailMessage(message, rawEmail) {
  // Extract headers
  const headers = {};
  for (const [key, value] of message.headers) {
    headers[key] = value;
  }

  // Parse the email body (simplified - in production you might want a proper email parser)
  const emailBody = parseEmailBody(rawEmail);

  return {
    from: message.from,
    to: message.to,
    subject: message.headers.get('subject') || '(No Subject)',
    messageId: message.headers.get('message-id'),
    inReplyTo: message.headers.get('in-reply-to'),
    date: message.headers.get('date'),
    body: emailBody,
    headers: headers,
    rawSize: message.rawSize
  };
}

/**
 * Simple email body parser
 * Extracts text content from the email body
 */
function parseEmailBody(rawEmail) {
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
    bodyText = bodyText
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return {
    text: bodyText,
    html: contentType === 'text/html' ? bodyLines.join('\n').trim() : null
  };
}

/**
 * Forward the parsed email to the webhook endpoint
 */
async function forwardToWebhook(emailData, env) {
  try {
    const webhookUrl = env.WEBHOOK_URL;
    const webhookSecret = env.WEBHOOK_SECRET;

    if (!webhookUrl) {
      throw new Error('WEBHOOK_URL environment variable not configured');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-webhook-auth': webhookSecret || '',
        ...(webhookSecret && { 'Authorization': `Bearer ${webhookSecret}` })
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook responded with ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Webhook forwarding failed', {
      error: error.message,
      webhookUrl: env.WEBHOOK_URL
    });

    return {
      success: false,
      error: error.message
    };
  }
}