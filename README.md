# Coach Artie Email Interface

🤖 **TL;DR**: Email your AI coach at `coach@yourdomain.com` and get intelligent responses with full conversation memory. Just like Discord but via email.

## What This Does

- Users email Coach Artie → Get intelligent coaching responses
- Remembers conversation history (like Discord channels)
- Uses same AI brain as Discord version
- Professional email formatting

## 30-Minute Setup Guide 🚀

### Step 1: Get Your API Keys (5 minutes)

**Resend Account** (for sending emails):
1. Go to https://resend.com → Sign up
2. Add your domain (e.g., `coachartiebot.com`)
3. Verify domain ownership (add DNS records)
4. Create API key → Copy it

**Supabase** (for memory/threads):
1. Go to https://supabase.com → Create project
2. Go to Settings → API → Copy `URL` and `anon key`

### Step 2: Deploy to Your Server (10 minutes)

```bash
# SSH into your server
ssh root@your-server.com

# Clone and setup
git clone https://github.com/room302studio/coachartie_email.git
cd coachartie_email
npm install

# Configure environment
cp .env.example .env
nano .env  # Fill in your API keys (see below)

# Setup database
# Copy the SQL from "Database Schema" section below
# Run it in your Supabase SQL editor

# Build and start
npm run build
npm start
```

**Your `.env` file should look like:**
```bash
PORT=3000
RESEND_API_KEY=re_your_key_here
FROM_EMAIL=coach@yourdomain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
CAPABILITIES_URL=http://localhost:3000  # or your capabilities server
WEBHOOK_SECRET=make-up-a-random-secret
CLOUDFLARE_WEBHOOK_SECRET=same-secret-as-above
```

### Step 3: Setup Cloudflare Email Worker (10 minutes)

```bash
# Install Cloudflare CLI
npm install -g wrangler

# Login to Cloudflare
wrangler auth login

# Edit the worker config
cd cloudflare
nano wrangler.toml
# Change WEBHOOK_URL to: https://your-server.com/webhook/email

# Deploy the worker
wrangler deploy

# Set secrets
wrangler secret put WEBHOOK_SECRET
# Enter the same secret from your .env file
wrangler secret put APPROVED_RECIPIENTS
# Enter: coach@yourdomain.com,support@yourdomain.com
```

### Step 4: Configure Cloudflare Email Routing (5 minutes)

1. **Cloudflare Dashboard** → Your domain → **Email** → **Email Routing**
2. **Enable Email Routing** (if not already)
3. **Destination addresses** → **Add address** → `coach@yourdomain.com`
4. **Routing rules** → **Create rule**:
   - **Name**: Coach Artie
   - **When**: Custom address → `coach@yourdomain.com`
   - **Then**: Send to Worker → `coachartie-email-worker`
   - **Save**

### Step 5: Test It 📧

```bash
# Test the webhook
npm run email:test

# Send a real email
# Email: coach@yourdomain.com
# Subject: Hello Coach Artie
# Body: Can you help me with goal setting?
```

## Done! 🎉

People can now email `coach@yourdomain.com` and get AI coaching responses with full conversation memory.

## Environment Variables

### VPS Server (.env)

- `RESEND_API_KEY` - Resend API key for sending emails
- `FROM_EMAIL` - Your verified sender email (e.g., coach@coachartiebot.com)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `CAPABILITIES_URL` - Coach Artie capabilities API URL
- `WEBHOOK_SECRET` - Secret for authenticating webhook requests
- `CLOUDFLARE_WEBHOOK_SECRET` - Secret from Cloudflare worker

### Cloudflare Worker (via wrangler secret)

- `WEBHOOK_URL` - Your VPS webhook endpoint
- `WEBHOOK_SECRET` - Shared secret for authentication
- `APPROVED_RECIPIENTS` - Comma-separated list of allowed emails (optional)

## Database Schema

Add this table to your Supabase database:

```sql
CREATE TABLE email_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0
);

CREATE INDEX idx_email_threads_user_email ON email_threads(user_email);
CREATE INDEX idx_email_threads_last_message ON email_threads(last_message_at);
```

## API Endpoints

- `POST /webhook/email` - Receives emails from Cloudflare worker
- `GET /health` - Health check endpoint

## Email Thread Management

- **New Conversation**: Creates new thread for each email address
- **Ongoing Conversation**: Continues thread if email received within 24 hours
- **Context Preservation**: All messages stored with thread ID for memory
- **Cross-Platform Linking**: Future support for linking email to Discord identity

## Deployment

### VPS Deployment

```bash
# Build the application
npm run build

# Start with PM2 (recommended)
pm2 start dist/index.js --name coachartie-email

# Or use systemd service
sudo systemctl start coachartie-email
```

### Cloudflare Worker Deployment

```bash
cd cloudflare
wrangler deploy --env production
```

## Testing

```bash
# Unit tests
npm test

# Test email parsing
npm run email:test

# Manual webhook test
curl -X POST http://localhost:3000/webhook/email \
  -H "Content-Type: application/json" \
  -H "cf-webhook-auth: your-secret" \
  -d '{"from":"test@example.com","to":"coach@yourdomain.com","subject":"Test","body":{"text":"Hello Coach Artie!"}}'
```

## Security

- All webhook requests authenticated with bearer token
- Cloudflare worker validates webhook secret
- Optional recipient filtering in worker
- Email content sanitized before processing

## Cross-Platform Identity Linking (Future)

Enable users to link their email to Discord identity:

```
Discord: /link email user@example.com
→ Verification email sent
→ User confirms link
→ Email conversations now have full Discord memory/context
```

## Monitoring

- Structured logging with Winston
- Optional Loki integration for log aggregation
- Health check endpoint for uptime monitoring
- Error notifications via email

## 🔧 When Shit Breaks (Troubleshooting)

### "I sent an email but got no response"

**Check 1**: Is your server running?
```bash
curl http://your-server.com/health
# Should return: {"status":"ok",...}
```

**Check 2**: Are emails reaching Cloudflare?
```bash
wrangler tail  # Watch live logs
# Send test email and see if logs show up
```

**Check 3**: Is the webhook working?
```bash
npm run email:test
# Should see "✅ Test email webhook successful!"
```

### "Authentication errors" 

Your `WEBHOOK_SECRET` needs to match in 3 places:
- Your server `.env` file
- Cloudflare worker secrets (`wrangler secret put WEBHOOK_SECRET`)
- They should be EXACTLY the same string

### "Resend API errors"

1. **Domain not verified**: Go to Resend dashboard → Domains → Verify your domain
2. **Wrong API key**: Create new key in Resend dashboard → API Keys
3. **Wrong FROM_EMAIL**: Must match your verified domain (e.g., `coach@yourdomain.com`)

### "Database errors"

**Check 1**: Did you create the table?
```sql
-- Run this in Supabase SQL editor:
CREATE TABLE email_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0
);
```

**Check 2**: Are your Supabase credentials correct?
- `SUPABASE_URL` should start with `https://`
- `SUPABASE_ANON_KEY` should be the "anon public" key, not service role

### "Worker deployment failed"

```bash
# Make sure you're logged in
wrangler auth login

# Check your wrangler.toml has the right webhook URL
cd cloudflare
cat wrangler.toml

# Deploy again
wrangler deploy
```

### "Still broken?"

**Check logs**:
```bash
# Server logs
tail -f logs/combined.log

# Worker logs  
wrangler tail

# Health check
curl http://your-server.com/health
```

**Test in isolation**:
```bash
# Test just the webhook
npm run email:test

# Test just Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"coach@yourdomain.com","to":"test@gmail.com","subject":"test","text":"test"}'
```

### Logs

```bash
# View application logs
tail -f logs/combined.log

# View error logs only
tail -f logs/error.log

# View Cloudflare Worker logs
wrangler tail
```