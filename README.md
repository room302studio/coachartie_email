# Coach Artie Email Interface

Enable Coach Artie to conduct 1:1 coaching conversations via email, maintaining context across long-running threads just like the Discord interface.

## Architecture

```
User Email → Cloudflare Email Routing → Email Worker → VPS Webhook → Coach Artie Core → Resend API → User
                                              ↓                           ↑
                                        Thread Memory ←────────────────────┘
```

## Quick Start

### 1. VPS Setup (email.coachartiebot.com)

```bash
# Clone and install
git clone <repo>
cd coachartie_email
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Build and start
npm run build
npm start
```

### 2. Cloudflare Email Worker Setup

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler auth login

# Deploy the email worker
cd cloudflare
wrangler deploy

# Set environment secrets
wrangler secret put WEBHOOK_SECRET
wrangler secret put APPROVED_RECIPIENTS  # Optional
```

### 3. Cloudflare Email Routing Configuration

1. Go to your Cloudflare dashboard
2. Navigate to Email → Email Routing
3. Add destination address: `coach@yourdomain.com`
4. Create routing rule: Route to Worker → `coachartie-email-worker`

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

## Troubleshooting

### Common Issues

1. **Emails not reaching webhook**
   - Check Cloudflare Email Routing configuration
   - Verify worker deployment and logs
   - Ensure webhook URL is accessible

2. **Authentication errors**
   - Verify WEBHOOK_SECRET matches in both worker and server
   - Check cf-webhook-auth header in requests

3. **Resend API errors**
   - Verify RESEND_API_KEY is valid
   - Ensure FROM_EMAIL domain is verified in Resend
   - Check Resend API quota

4. **Thread management issues**
   - Verify Supabase connection and table schema
   - Check database permissions

### Logs

```bash
# View application logs
tail -f logs/combined.log

# View error logs only
tail -f logs/error.log

# View Cloudflare Worker logs
wrangler tail
```