# 📧 Email Service Setup Guide

Complete setup instructions for the Coach Artie email service using Cloudflare Email Routing + Resend API.

## 🏗️ Architecture Overview

Coach Artie's email system has a unique architecture:

```
Incoming:  user@coachartie.ai → Cloudflare Email Routing → Cloudflare Worker → Email Service
Outgoing:  Email Service → Resend API → user@email.com
```

This setup allows custom email domain handling while using reliable delivery services.

## 🔑 1. Get Resend API Key

### Step 1: Create Resend Account
1. Go to [Resend.com](https://resend.com/)
2. Sign up with GitHub or email
3. Verify your email address

### Step 2: Add Your Domain
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `coachartie.ai`)
4. Follow DNS setup instructions:
   - Add MX, TXT, and CNAME records to your domain
   - Wait for verification (can take 24-48 hours)

### Step 3: Get API Key
1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it `Coach Artie Email Service`
4. Copy the API key (starts with `re_...`)

## ☁️ 2. Set Up Cloudflare Email Routing

### Step 1: Add Domain to Cloudflare
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Add your domain (e.g., `coachartie.ai`)
3. Update nameservers at your domain registrar
4. Wait for DNS propagation

### Step 2: Enable Email Routing
1. In Cloudflare dashboard, select your domain
2. Go to **Email** → **Email Routing**
3. Click **Enable Email Routing**
4. Follow the setup wizard:
   - Add MX records (done automatically)
   - Verify domain ownership

### Step 3: Create Email Address
1. In **Email Routing** → **Routing Rules**
2. Click **Create address**
3. Create: `coach@yourdomain.com` → **Send to Worker**
4. We'll configure the worker next

## 🛠️ 3. Deploy Cloudflare Email Worker

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
wrangler auth login
```

### Step 2: Use Provided Worker Code
The worker code is already provided in this repo at `cloudflare-email-worker.js`:

```javascript
// This worker forwards emails to your email service
export default {
  async email(message, env, ctx) {
    // Extract email content
    const rawEmail = await new Response(message.raw).text();
    
    // Forward to your email service
    const webhookResponse = await fetch(env.EMAIL_SERVICE_URL + '/webhook/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.WEBHOOK_SECRET
      },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        subject: message.headers.get('subject'),
        messageId: message.headers.get('message-id'),
        inReplyTo: message.headers.get('in-reply-to'),
        date: message.headers.get('date'),
        raw: rawEmail,
        timestamp: new Date().toISOString()
      })
    });
    
    console.log(`Webhook response: ${webhookResponse.status}`);
  }
};
```

### Step 3: Deploy Worker
```bash
cd coachartie_email
wrangler deploy cloudflare-email-worker.js --name coach-artie-email
```

### Step 4: Set Worker Environment Variables
```bash
wrangler secret put EMAIL_SERVICE_URL
# Enter: https://your-email-service.com

wrangler secret put WEBHOOK_SECRET  
# Enter: your-webhook-secret-key
```

### Step 5: Configure Email Routing
1. Back in Cloudflare **Email Routing** → **Routing Rules**
2. Edit your `coach@yourdomain.com` rule
3. Change destination to: **Send to Worker** → `coach-artie-email`
4. Save the rule

## 🔧 4. Environment Setup

Create a `.env` file in the email service directory:

```env
# Resend Configuration (REQUIRED for sending emails)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=coach@yourdomain.com

# Database Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your_supabase_service_role_key

# Service Configuration
PORT=3002
NODE_ENV=production

# Webhook Security (REQUIRED)
WEBHOOK_SECRET=your-webhook-secret-key

# Coach Artie Integration (REQUIRED)
CAPABILITIES_URL=https://your-capabilities-service.com
```

## 🚀 5. Deploy Email Service

### Option A: Local Development
```bash
cd coachartie_email
npm install
npm start
```

### Option B: Production Deployment
1. **Railway/Fly.io/Heroku**: Deploy using your preferred platform
2. **Environment Variables**: Set all the `.env` variables
3. **Port**: Service runs on port 3002 by default

## 🔗 6. Connect to Coach Artie Capabilities

### In Capabilities Service `.env`:
```env
EMAIL_SERVICE_URL=https://your-email-service.com
```

### Test Integration:
```bash
# Test email sending via capabilities service
curl -X POST https://your-capabilities.com/api/task/execute \
  -H "Authorization: Bearer your-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "calculate", 
    "payload": {
      "expression": "2+2",
      "respondTo": {
        "channel": "email",
        "details": {
          "type": "email",
          "to": "user@example.com",
          "subject": "Coach Artie Response"
        }
      }
    }
  }'
```

## 🛠️ 7. API Endpoints

### Incoming Email Webhook
- **POST** `/webhook/email` - Receives emails from Cloudflare Worker
- **Headers**: `X-Webhook-Secret: your-secret`
- **Body**: Email data from Cloudflare
- **Response**: `200 OK`

### Outgoing Email API
- **POST** `/send` - Send email messages
- **Body**: 
  ```json
  {
    "to": "user@example.com",
    "subject": "Your Subject",
    "message": "Your message here",
    "inReplyTo": "message-id-for-threading",
    "threadId": "thread-id"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "messageId": "message-id"
  }
  ```

### Health Check
- **GET** `/health` - Service health status

## 🧪 8. Testing the Setup

### Test Incoming Email
1. Send an email to `coach@yourdomain.com`
2. Check email service logs for incoming webhook
3. Should see: `Processing incoming email` log

### Test Outgoing Email
```bash
curl -X POST https://your-email-service.com/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test from Coach Artie",
    "message": "This is a test email!"
  }'
```

## 🚨 Common Issues

### "Domain not verified" (Resend)
- Wait 24-48 hours for DNS propagation
- Check DNS records in your domain provider
- Verify all MX, TXT, CNAME records are correct

### "Worker not receiving emails"
- Check Cloudflare Email Routing rules
- Verify worker is deployed and named correctly
- Check worker logs in Cloudflare dashboard

### "Webhook secret mismatch"
- Ensure `WEBHOOK_SECRET` matches in both worker and email service
- Check worker environment variables with `wrangler secret list`

### "Email service 500 error"
- Check Resend API key is valid
- Verify `FROM_EMAIL` domain is verified in Resend
- Check email service logs for detailed errors

## 💰 Costs

- **Cloudflare Email Routing**: Free (100 emails/day)
- **Cloudflare Workers**: Free tier (100k requests/day)
- **Resend**: Free tier (3k emails/month), then $20/month

## 🔐 Security

- ✅ Webhook secret validation
- ✅ Email format validation
- ✅ Subject length limits
- ✅ Rate limiting via Resend
- ✅ Domain verification required

## 📧 Email Threading

Coach Artie maintains conversation threads using:
- **In-Reply-To**: Links to previous message
- **References**: Full conversation chain
- **Thread ID**: Custom threading identifier

This allows users to reply naturally and Coach Artie maintains context.

## 📚 Next Steps

1. **Set up SMS Service**: See `coachartie_sms/SETUP.md`
2. **Configure Identity Linking**: Use `/link` Discord command
3. **Test Cross-Channel**: Start conversation on Discord, continue via email
4. **Monitor Usage**: Check Resend dashboard for delivery stats

## 🆘 Need Help?

- **Cloudflare Email Routing**: [Official Docs](https://developers.cloudflare.com/email-routing/)
- **Resend API**: [Official Docs](https://resend.com/docs)
- **Cloudflare Workers**: [Official Docs](https://developers.cloudflare.com/workers/)