/**
 * Test Email Script
 * 
 * Sends a test email to the webhook endpoint to verify everything is working.
 */

import dotenv from 'dotenv';
dotenv.config();

const WEBHOOK_URL = process.env.TEST_WEBHOOK_URL || 'http://localhost:3000/webhook';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret';

const testEmail = {
  from: 'test@example.com',
  to: 'coach@coachartiebot.com',
  subject: 'Test Email for Coach Artie',
  messageId: `<test-${Date.now()}@example.com>`,
  inReplyTo: null,
  date: new Date().toISOString(),
  raw: `From: test@example.com
To: coach@coachartiebot.com
Subject: Test Email for Coach Artie
Date: ${new Date().toISOString()}
Message-ID: <test-${Date.now()}@example.com>

Hello Coach Artie! This is a test email to verify the webhook is working correctly. Can you help me with some coaching questions?`,
  timestamp: new Date().toISOString()
};

async function testWebhook() {
  try {
    console.log('Sending test email to webhook...');
    console.log(`URL: ${WEBHOOK_URL}`);
    console.log(`Payload:`, JSON.stringify(testEmail, null, 2));

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET
      },
      body: JSON.stringify(testEmail)
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (response.ok) {
      console.log('✅ Test email webhook successful!');
    } else {
      console.log('❌ Test email webhook failed');
    }

  } catch (error) {
    console.error('❌ Test email webhook error:', error);
  }
}

// Run the test
testWebhook();