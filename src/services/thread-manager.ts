/**
 * Thread Manager Service
 * 
 * Simplified email thread tracking using logs table.
 * Tracks email conversations without complex thread management.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';
import { Database } from '../database.types.js';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export interface EmailThread {
  id: string;
  userEmail: string;
  subject: string;
  createdAt: string;
}

export async function getOrCreateThread(
  userEmail: string, 
  subject?: string
): Promise<EmailThread> {
  try {
    // Create a simple thread ID based on user email and timestamp
    const threadId = `email_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    // Log the thread creation
    await supabase
      .from('logs')
      .insert({
        service: 'coachartie-email',
        level: 'info',
        message: `Email thread started for ${userEmail}`,
        timestamp: createdAt
      });

    return {
      id: threadId,
      userEmail,
      subject: subject || 'Email Conversation',
      createdAt
    };
  } catch (error) {
    logger.error('Failed to create thread', { error, userEmail });
    throw error;
  }
}

export async function logEmailEvent(
  threadId: string,
  userEmail: string,
  event: string,
  details?: any
): Promise<void> {
  try {
    await supabase
      .from('logs')
      .insert({
        service: 'coachartie-email',
        level: 'info',
        message: `Thread ${threadId}: ${event}`,
        timestamp: new Date().toISOString()
      });
    
    logger.info(`Email event logged`, { threadId, userEmail, event, details });
  } catch (error) {
    logger.error('Failed to log email event', { error, threadId, userEmail, event });
  }
}