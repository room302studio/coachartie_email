/**
 * Identity Resolver Service
 * 
 * Connects to the capabilities API to resolve email addresses to canonical user IDs.
 * Enables cross-channel identity linking (Discord ↔ Email ↔ SMS).
 */

import { logger } from './logger.js';

interface IdentityResolution {
  canonicalUserId: string | null;
  displayName?: string;
  isNewUser: boolean;
}

/**
 * Resolve an email address to a canonical user ID
 */
export async function resolveUserIdentity(email: string): Promise<IdentityResolution> {
  try {
    const capabilitiesUrl = process.env.CAPABILITIES_URL || 'http://localhost:3001';
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    logger.info('Resolving email identity', { email });

    const response = await fetch(`${capabilitiesUrl}/api/identity/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookSecret && { 'Authorization': `Bearer ${webhookSecret}` })
      },
      body: JSON.stringify({
        type: 'email',
        value: email
      })
    });

    if (!response.ok) {
      throw new Error(`Identity API error: ${response.status} - ${await response.text()}`);
    }

    const result = await response.json();
    
    logger.info('Identity resolved', { 
      email, 
      canonicalUserId: result.userId,
      isNewUser: result.isNewUser 
    });

    return {
      canonicalUserId: result.userId,
      displayName: result.displayName,
      isNewUser: result.isNewUser || false
    };

  } catch (error) {
    logger.error('Failed to resolve identity', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Fallback: use email as user ID for backwards compatibility
    return {
      canonicalUserId: email,
      isNewUser: true
    };
  }
}

/**
 * Create or link a new user identity via the capabilities API
 */
export async function createUserIdentity(email: string, displayName?: string): Promise<string | null> {
  try {
    const capabilitiesUrl = process.env.CAPABILITIES_URL || 'http://localhost:3001';
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    logger.info('Creating new user identity', { email, displayName });

    const response = await fetch(`${capabilitiesUrl}/api/identity/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookSecret && { 'Authorization': `Bearer ${webhookSecret}` })
      },
      body: JSON.stringify({
        type: 'email',
        value: email,
        displayName: displayName || `Email User ${email.split('@')[0]}`
      })
    });

    if (!response.ok) {
      throw new Error(`Identity API error: ${response.status} - ${await response.text()}`);
    }

    const result = await response.json();
    
    logger.info('User identity created', { 
      email, 
      canonicalUserId: result.userId 
    });

    return result.userId;

  } catch (error) {
    logger.error('Failed to create user identity', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}