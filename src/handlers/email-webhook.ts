/**
 * Email Webhook Handler
 * 
 * Processes incoming emails forwarded from Cloudflare Email Worker
 * to Coach Artie for processing, then sends responses via Resend API.
 * 
 * Note: Cloudflare Email Routing doesn't send webhooks directly - 
 * we need a Cloudflare Email Worker to forward emails to this webhook.
 */

import { Request, Response } from 'express';
import { logger } from '../services/logger.js';
import { parseIncomingEmail } from '../services/email-parser.js';
import { sendEmailResponse } from '../services/email-sender.js';
import { processWithCoachArtie } from '../services/coach-artie-client.js';
import { getOrCreateThread } from '../services/thread-manager.js';
import { resolveUserIdentity } from '../services/identity-resolver.js';

export async function emailWebhookHandler(req: Request, res: Response): Promise<Response> {
  try {
    logger.info('Incoming email webhook', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });

    // Parse the incoming email
    const emailData = await parseIncomingEmail(req.body, req.headers);
    
    if (!emailData) {
      logger.error('Failed to parse email data');
      return res.status(400).json({ error: 'Invalid email data' });
    }

    logger.info('Parsed email', {
      from: emailData.from,
      subject: emailData.subject,
      threadId: emailData.threadId,
      messageId: emailData.messageId
    });

    // Resolve email to canonical user ID
    const identity = await resolveUserIdentity(emailData.from);
    const canonicalUserId = identity.canonicalUserId || emailData.from;
    
    logger.info('Identity resolved for email', {
      email: emailData.from,
      canonicalUserId,
      isNewUser: identity.isNewUser
    });

    // Get or create conversation thread
    const thread = await getOrCreateThread(canonicalUserId, emailData.threadId);
    
    // Process with Coach Artie using canonical user ID
    const response = await processWithCoachArtie({
      message: emailData.body,
      userId: canonicalUserId,
      threadId: thread.id,
      channel: 'email',
      metadata: {
        subject: emailData.subject,
        messageId: emailData.messageId,
        inReplyTo: emailData.inReplyTo,
        originalEmail: emailData.from
      }
    });

    if (!response.success) {
      logger.error('Coach Artie processing failed', { error: response.error });
      return res.status(500).json({ error: 'Processing failed' });
    }

    // Send email response
    const sendResult = await sendEmailResponse({
      to: emailData.from,
      subject: emailData.subject.startsWith('Re: ') ? emailData.subject : `Re: ${emailData.subject}`,
      body: response.data?.response || 'No response available',
      inReplyTo: emailData.messageId,
      threadId: thread.id
    });

    if (!sendResult.success) {
      logger.error('Failed to send email response', { error: sendResult.error });
      return res.status(500).json({ error: 'Failed to send response' });
    }

    logger.info('Email processed successfully', {
      from: emailData.from,
      responseId: sendResult.data?.messageId
    });

    return res.json({
      success: true,
      messageId: sendResult.data?.messageId
    });

  } catch (error) {
    logger.error('Email webhook handler error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}