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
    // Extract email content
    const rawEmail = await new Response(message.raw).text();
    
    // Prepare webhook payload
    const payload = {
      from: message.from,
      to: message.to,
      subject: message.headers.get('subject'),
      messageId: message.headers.get('message-id'),
      inReplyTo: message.headers.get('in-reply-to'),
      date: message.headers.get('date'),
      raw: rawEmail,
      timestamp: new Date().toISOString()
    };
    
    // Send to your webhook
    const webhookResponse = await fetch('https://email.coachartiebot.com/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.WEBHOOK_SECRET || 'your-secret-here'
      },
      body: JSON.stringify(payload)
    });
    
    // Log the result (optional)
    console.log(`Webhook response: ${webhookResponse.status}`);
    
    // Forward to a backup email if you want
    // await message.forward("backup@gmail.com");
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