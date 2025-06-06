/**
 * Coach Artie Client Service
 * 
 * Communicates with the Coach Artie capabilities API to process messages
 * and get AI responses. Uses the same API as the Discord interface.
 */

import { logger } from './logger.js';

export interface CoachArtieRequest {
  message: string;
  userId: string;
  threadId?: string;
  channel: 'email' | 'discord' | 'sms';
  metadata?: {
    subject?: string;
    messageId?: string;
    inReplyTo?: string;
    originalEmail?: string;
  };
}

export interface CoachArtieResponse {
  success: boolean;
  data?: {
    response: string;
    capabilities?: any[];
  };
  error?: string;
}

export async function processWithCoachArtie(request: CoachArtieRequest): Promise<CoachArtieResponse> {
  try {
    const capabilitiesUrl = process.env.CAPABILITIES_URL || 'http://localhost:3000';
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    logger.info('Processing message with Coach Artie', {
      userId: request.userId,
      threadId: request.threadId,
      channel: request.channel,
      messageLength: request.message.length
    });

    // Prepare the request payload similar to Discord interface
    const payload = {
      message: request.message,
      userId: request.userId,
      threadId: request.threadId,
      channel: request.channel,
      respondTo: {
        channel: 'email',
        details: {
          type: 'email',
          to: request.userId, // Using userId as email address
          subject: request.metadata?.subject || 'Coach Artie Response'
        }
      },
      metadata: request.metadata
    };

    // Make request to capabilities API
    const response = await fetch(`${capabilitiesUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookSecret && { 'Authorization': `Bearer ${webhookSecret}` })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Capabilities API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    logger.info('Received response from Coach Artie', {
      userId: request.userId,
      responseLength: result.response?.length || 0,
      capabilities: result.capabilities?.length || 0
    });

    return {
      success: true,
      data: {
        response: result.response || result.message || 'Sorry, I couldn\'t process your message.',
        capabilities: result.capabilities || []
      }
    };

  } catch (error) {
    logger.error('Failed to process with Coach Artie', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: request.userId,
      threadId: request.threadId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Alternative: Use the OpenAI-compatible chat completions endpoint
 */
export async function processWithChatAPI(request: CoachArtieRequest): Promise<CoachArtieResponse> {
  try {
    const capabilitiesUrl = process.env.CAPABILITIES_URL || 'http://localhost:3000';
    
    // Use the OpenAI-compatible endpoint for memory-enhanced chat
    const payload = {
      model: 'gpt-4', // Model name (not used but required for compatibility)
      messages: [
        {
          role: 'user',
          content: request.message
        }
      ],
      user: request.userId, // This enables memory functionality
      metadata: {
        channel: request.channel,
        threadId: request.threadId,
        ...request.metadata
      }
    };

    const response = await fetch(`${capabilitiesUrl}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET || 'dummy-key'}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const messageContent = result.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process your message.';

    return {
      success: true,
      data: {
        response: messageContent,
        capabilities: []
      }
    };

  } catch (error) {
    logger.error('Failed to process with Chat API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: request.userId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}