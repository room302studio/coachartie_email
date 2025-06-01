/**
 * Test Email Script
 * 
 * Sends a test email to the webhook endpoint to verify everything is working.
 */

import dotenv from 'dotenv';
dotenv.config();

const WEBHOOK_URL = process.env.TEST_WEBHOOK_URL || 'http://localhost:3000/webhook/email';
const WEBHOOK_SECRET = process.env.CLOUDFLARE_WEBHOOK_SECRET || 'test-secret';

const testEmail = {
  from: 'test@example.com',
  to: 'coach@coachartiebot.com',
  subject: 'Test Email for Coach Artie',
  messageId: `<test-${Date.now()}@example.com>`,
  date: new Date().toISOString(),
  body: {
    text: 'Hello Coach Artie! This is a test email to verify the webhook is working correctly. Can you help me with some coaching questions?',
    html: null
  },
  headers: {
    'from': 'test@example.com',
    'to': 'coach@coachartiebot.com',
    'subject': 'Test Email for Coach Artie',
    'date': new Date().toISOString(),
    'message-id': `<test-${Date.now()}@example.com>`
  },
  rawSize: 256
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
        'cf-webhook-auth': WEBHOOK_SECRET,
        'Authorization': `Bearer ${WEBHOOK_SECRET}`
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