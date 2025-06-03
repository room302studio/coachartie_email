# Coach Artie Email Interface

🤖 **TL;DR**: Email your AI coach and get intelligent responses with full conversation memory. Just like Discord but via email.

## What This Does

- Users email Coach Artie → Get intelligent coaching responses
- Remembers conversation history (like Discord threads)
- Uses same AI capabilities API as Discord version
- Professional email formatting with threading

## Complete Setup Guide 🚀

### Prerequisites

You need:
- A VPS/server running Node.js
- A domain name you control
- Cloudflare managing your domain's DNS
- The Coach Artie capabilities API running (see `../coachartie_capabilities/`)

### Step 1: Get Your API Keys (5 minutes)

#### Resend Account (for sending emails)
1. Go to https://resend.com → Sign up
2. **Add your domain**: Go to Domains → Add Domain → Enter `yourdomain.com`
3. **Verify domain**: Add the DNS records Resend shows you to Cloudflare DNS
4. **Wait for verification** (can take 5-10 minutes)
5. **Create API key**: Go to API Keys → Create API Key → Copy it
6. **Verify FROM email**: Make sure `coach@yourdomain.com` is listed as verified

#### Supabase (for conversation memory/threads)
1. Go to https://supabase.com → Create new project
2. **Wait for project creation** (takes 2-3 minutes)
3. Go to Settings → API → Copy:
   - `Project URL` (starts with https://)
   - `anon public` key (NOT the service_role key)

### Step 2: Deploy the Email API to Your Server (10 minutes)

```bash
# SSH into your server
ssh root@your-server.com

# Clone the repo
git clone https://github.com/your-org/coachartie_email.git
cd coachartie_email

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env
```

**Fill in your `.env` file exactly like this:**
```bash
PORT=3000
RESEND_API_KEY=re_your_actual_key_from_resend
FROM_EMAIL=coach@yourdomain.com
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
CAPABILITIES_URL=http://localhost:3001  # or wherever your capabilities API runs
WEBHOOK_SECRET=your-super-secret-webhook-password-123
```

**⚠️ Critical**: The `WEBHOOK_SECRET` should be a long random string you make up. Write it down - you'll need it again for Cloudflare.

**Setup the database:**
1. Go to your Supabase project → SQL Editor
2. Run this SQL:

```sql
-- Create logs table (if not exists)
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
```

**Build and start the server:**
```bash
# Build TypeScript
npm run build

# Test it works
npm start

# In another terminal, test the health endpoint
curl http://localhost:3000/health
# Should return: {"status":"ok",...}

# If working, stop it and start with PM2 for production
npm install -g pm2
pm2 start dist/index.js --name coachartie-email
pm2 save
pm2 startup  # Follow the instructions it gives you
```

### Step 3: Setup Cloudflare Email Worker (The Finicky Part! 🔧)

#### Install Cloudflare CLI
```bash
# On your local machine (not server)
npm install -g wrangler

# Login to Cloudflare
wrangler auth login
# This opens a browser - click "Allow" to authorize
```

#### Configure the Worker
```bash
cd cloudflare
nano wrangler.toml
```

**Update the WEBHOOK_URL in wrangler.toml:**
```toml
[vars]
WEBHOOK_URL = "https://your-server.com/webhook"
```

**⚠️ Important**: Replace `your-server.com` with your actual server domain/IP.

#### Deploy the Worker
```bash
# Deploy the worker code
wrangler deploy

# Set the webhook secret (THE CRITICAL STEP!)
wrangler secret put WEBHOOK_SECRET
# When prompted, enter the EXACT same secret from your .env file
# This is the #1 place people mess up - the secrets MUST match exactly

# Optionally, set approved recipients (recommended for security)
wrangler secret put APPROVED_RECIPIENTS
# When prompted, enter: coach@yourdomain.com,support@yourdomain.com
```

#### Verify Worker Deployment
```bash
# Check worker is deployed
wrangler list
# Should show "coachartie-email-worker" or similar

# View live logs (keep this open for testing)
wrangler tail
```

### Step 4: Configure Cloudflare Email Routing (The Other Finicky Part! 📧)

**In Cloudflare Dashboard:**

1. **Go to your domain** → **Email** → **Email Routing**

2. **Enable Email Routing** (if not already enabled)
   - Click "Enable Email Routing"
   - Wait for it to activate (30 seconds)

3. **Add Destination Address** (required first!)
   - Click **"Destination addresses"** → **"Add address"**
   - Enter: `coach@yourdomain.com` (or your support email)
   - Check your email and click the verification link
   - **Wait for "Verified" status** before continuing

4. **Create Custom Address** (this is the email people will send to)
   - Click **"Custom addresses"** → **"Create address"**
   - **Address**: `coach` (creates coach@yourdomain.com)
   - **Action**: Send to Worker
   - **Worker**: Select `coachartie-email-worker`
   - **Click "Create"**

5. **Verify the Routing Rule**
   - Should show: `coach@yourdomain.com` → `Send to Worker: coachartie-email-worker`
   - Status should be "Active"

### Step 5: Test Everything 🧪

#### Test 1: Health Check
```bash
curl https://your-server.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

#### Test 2: Direct Webhook Test
```bash
# From your server
npm run test:email
# Should see: "✅ Email webhook test successful"
```

#### Test 3: Send Real Email
1. **Send email to**: `coach@yourdomain.com`
2. **Subject**: `Hello Coach Artie`
3. **Body**: `Can you help me set some goals?`
4. **Wait 10-30 seconds** for response

#### Test 4: Watch the Logs
```bash
# Server logs (on your VPS)
tail -f logs/combined.log

# Worker logs (on your local machine)
wrangler tail

# Send test email and watch logs show activity
```

### Step 6: Make It Production Ready

#### Setup HTTPS (Required!)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-server.com

# Test renewal
sudo certbot renew --dry-run
```

#### Setup Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/coachartie-email
```

```nginx
server {
    listen 80;
    server_name your-server.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-server.com;
    
    ssl_certificate /etc/letsencrypt/live/your-server.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-server.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/coachartie-email /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Variables Reference

### VPS Server (.env)
```bash
PORT=3000                                    # Server port
RESEND_API_KEY=re_xxxxx                      # From Resend dashboard → API Keys
FROM_EMAIL=coach@yourdomain.com              # Must be verified in Resend
SUPABASE_URL=https://xxx.supabase.co         # From Supabase → Settings → API
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...     # From Supabase → Settings → API (anon public)
CAPABILITIES_URL=http://localhost:3001       # Your Coach Artie capabilities API
WEBHOOK_SECRET=your-long-random-secret-123   # Make this up, use everywhere
```

### Cloudflare Worker Secrets (set via `wrangler secret put`)
```bash
WEBHOOK_SECRET=your-long-random-secret-123   # MUST match .env file exactly
APPROVED_RECIPIENTS=coach@yourdomain.com     # Optional: comma-separated allowed recipients
```

### Cloudflare Worker Variables (in wrangler.toml)
```toml
[vars]
WEBHOOK_URL = "https://your-server.com/webhook"  # Your VPS webhook endpoint
```

## 🚨 Common Issues & Solutions

### "No response to emails"

**Check 1**: Is webhook URL correct?
```bash
# In cloudflare/wrangler.toml, should be:
WEBHOOK_URL = "https://your-server.com/webhook"  # NOT /webhook/email
```

**Check 2**: Are secrets matching?
```bash
# On your server
grep WEBHOOK_SECRET .env

# In Cloudflare (check logs)
wrangler tail
# Send test email, look for auth errors
```

**Check 3**: Is your server reachable?
```bash
curl https://your-server.com/health
# Should return 200 OK, not timeout
```

### "Webhook authentication failed"

Your `WEBHOOK_SECRET` is not matching. The secret must be **exactly the same** in:
1. Your server `.env` file
2. Cloudflare worker secrets

**Fix it:**
```bash
# On your server, check current secret
grep WEBHOOK_SECRET .env

# Update Cloudflare worker secret to match
wrangler secret put WEBHOOK_SECRET
# Enter the EXACT same value
```

### "Resend API errors"

**Domain not verified:**
1. Go to Resend → Domains
2. Check your domain shows "Verified" ✅
3. If not, add the DNS records to Cloudflare
4. Wait 5-10 minutes and refresh

**Wrong FROM_EMAIL:**
```bash
# Your FROM_EMAIL must be on your verified domain
FROM_EMAIL=coach@yourdomain.com  # ✅ Good
FROM_EMAIL=coach@gmail.com       # ❌ Bad - not your domain
```

### "Email routing not working"

**Check Cloudflare Email Routing setup:**
1. **Domain** → **Email** → **Email Routing** → Should be "Enabled"
2. **Custom addresses** → Should show `coach@yourdomain.com` → `Send to Worker`
3. **Worker** → Should be `coachartie-email-worker`

**Common mistake**: Creating a routing rule instead of a custom address. You need a **Custom Address**, not a **Routing Rule**.

### "Worker deployment failed"

```bash
# Make sure you're logged in
wrangler whoami
# Should show your Cloudflare email

# If not logged in
wrangler auth login

# Try deploying again
cd cloudflare
wrangler deploy
```

### "Can't find capabilities API"

Make sure your Coach Artie capabilities API is running:
```bash
# Check if it's running
curl http://localhost:3001/health
# or whatever port your capabilities API uses

# Update CAPABILITIES_URL in .env if needed
CAPABILITIES_URL=http://localhost:3001  # or https://your-capabilities-server.com
```

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Email    │───▶│ Cloudflare      │───▶│  Your VPS       │
│ coach@domain.com│    │ Email Worker    │    │  Email API      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              │                        ▼
                              │               ┌─────────────────┐
                              │               │ Coach Artie     │
                              │               │ Capabilities    │
                              │               └─────────────────┘
                              │                        │
                              │                        ▼
                              │               ┌─────────────────┐
                              │               │   Supabase      │
                              │               │  (Memory/Logs)  │
                              │               └─────────────────┘
                              │                        │
                              │                        ▼
                              │               ┌─────────────────┐
                              └──────────────▶│     Resend      │
                                              │ (Send Response) │
                                              └─────────────────┘
```

## Flow Diagram

1. **User sends email** to `coach@yourdomain.com`
2. **Cloudflare Email Routing** receives it
3. **Cloudflare Worker** processes and forwards to your webhook
4. **Your Email API** parses the email and sends to capabilities API
5. **Coach Artie** processes the message and returns response
6. **Your Email API** sends response via Resend
7. **User receives** AI coaching response

## Testing Commands

```bash
# Health check
curl https://your-server.com/health

# Test webhook directly
curl -X POST https://your-server.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-webhook-secret" \
  -d '{
    "from": "test@example.com",
    "to": "coach@yourdomain.com", 
    "subject": "Test Email",
    "messageId": "test-123",
    "raw": "From: test@example.com\nTo: coach@yourdomain.com\nSubject: Test\n\nHello Coach Artie!"
  }'

# Watch live logs
tail -f logs/combined.log

# Watch Cloudflare Worker logs
wrangler tail
```

## Done! 🎉

Users can now email `coach@yourdomain.com` and get intelligent AI coaching responses with full conversation memory, just like Discord but via email.

The system will:
- ✅ Receive emails via Cloudflare
- ✅ Process with Coach Artie capabilities API  
- ✅ Remember conversation history
- ✅ Send professional email responses
- ✅ Handle email threading properly
- ✅ Log everything for debugging