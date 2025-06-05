/**
 * Send Email Handler
 * 
 * HTTP endpoint for sending outgoing emails from the capabilities service.
 */

import { Request, Response } from 'express';
import { logger } from '../services/logger.js';
import { sendEmailResponse, EmailResponse } from '../services/email-sender.js';

export interface SendEmailRequest {
  to: string;
  subject: string;
  message: string;
  inReplyTo?: string;
  threadId?: string;
}

export async function sendEmailHandler(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  
  try {
    const { to, subject, message, inReplyTo, threadId } = req.body as SendEmailRequest;
    
    // Validate required fields
    if (!to || !subject || !message) {
      logger.warn('Invalid send email request', { body: req.body });
      res.status(400).json({
        error: 'Missing required fields: to, subject, message',
        received: { 
          to: !!to, 
          subject: !!subject, 
          message: !!message 
        }
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      res.status(400).json({
        error: 'Invalid email address format',
        expected: 'user@example.com',
        received: to
      });
      return;
    }

    // Validate subject length
    if (subject.length > 100) {
      res.status(400).json({
        error: 'Subject too long',
        maxLength: 100,
        received: subject.length
      });
      return;
    }

    logger.info('Sending outgoing email', {
      to,
      subject,
      messageLength: message.length,
      hasReplyTo: !!inReplyTo
    });

    // Prepare email response object
    const emailResponse: EmailResponse = {
      to,
      subject,
      body: message,
      inReplyTo,
      threadId
    };

    // Send the email
    const result = await sendEmailResponse(emailResponse);
    
    if (!result.success) {
      logger.error('Failed to send outgoing email', { to, error: result.error });
      res.status(500).json({
        error: 'Failed to send email',
        details: result.error
      });
      return;
    }

    const duration = Date.now() - startTime;
    logger.info('Outgoing email sent successfully', {
      to,
      duration,
      messageId: result.data?.messageId
    });

    res.status(200).json({
      success: true,
      messageId: result.data?.messageId
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Error handling outgoing email:', error, { duration });
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}