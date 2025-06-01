/**
 * Thread Manager Service
 * 
 * Manages email conversation threads using Supabase.
 * Similar to Discord thread management but for email conversations.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export interface EmailThread {
  id: string;
  userEmail: string;
  subject: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
}

export async function getOrCreateThread(
  userEmail: string, 
  existingThreadId?: string
): Promise<EmailThread> {
  try {
    // If we have an existing thread ID, try to find it
    if (existingThreadId) {
      const { data: existingThread } = await supabase
        .from('email_threads')
        .select('*')
        .eq('id', existingThreadId)
        .eq('user_email', userEmail)
        .single();

      if (existingThread) {
        // Update last message timestamp
        await supabase
          .from('email_threads')
          .update({ 
            last_message_at: new Date().toISOString(),
            message_count: existingThread.message_count + 1
          })
          .eq('id', existingThreadId);

        return {
          id: existingThread.id,
          userEmail: existingThread.user_email,
          subject: existingThread.subject,
          createdAt: existingThread.created_at,
          lastMessageAt: new Date().toISOString(),
          messageCount: existingThread.message_count + 1
        };
      }
    }

    // Check for recent thread for this user (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentThread } = await supabase
      .from('email_threads')
      .select('*')
      .eq('user_email', userEmail)
      .gte('last_message_at', oneDayAgo)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();

    if (recentThread) {
      // Use existing recent thread
      await supabase
        .from('email_threads')
        .update({ 
          last_message_at: new Date().toISOString(),
          message_count: recentThread.message_count + 1
        })
        .eq('id', recentThread.id);

      return {
        id: recentThread.id,
        userEmail: recentThread.user_email,
        subject: recentThread.subject,
        createdAt: recentThread.created_at,
        lastMessageAt: new Date().toISOString(),
        messageCount: recentThread.message_count + 1
      };
    }

    // Create new thread
    const newThread = {
      user_email: userEmail,
      subject: 'Coaching Conversation',
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      message_count: 1
    };

    const { data: createdThread, error } = await supabase
      .from('email_threads')
      .insert(newThread)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create thread: ${error.message}`);
    }

    logger.info('Created new email thread', {
      threadId: createdThread.id,
      userEmail
    });

    return {
      id: createdThread.id,
      userEmail: createdThread.user_email,
      subject: createdThread.subject,
      createdAt: createdThread.created_at,
      lastMessageAt: createdThread.last_message_at,
      messageCount: createdThread.message_count
    };

  } catch (error) {
    logger.error('Failed to get or create thread', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userEmail,
      existingThreadId
    });

    // Fallback: return a temporary thread
    return {
      id: `temp-${Date.now()}`,
      userEmail,
      subject: 'Coaching Conversation',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messageCount: 1
    };
  }
}