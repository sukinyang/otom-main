# Otom Backend - Deployment Guide

Run Otom backend 24/7 using one of the following methods.

## Quick Start

```bash
# Development (local)
./start.sh development

# Production with PM2 (24/7 on your machine)
./start.sh production

# Docker Compose
./start.sh docker
```

---

## Option 1: Railway (Recommended for Quick Deploy)

Railway offers easy deployment with a generous free tier.

### Steps:

1. **Create Railway account**: https://railway.app

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Deploy**:
   ```bash
   cd /Users/sukinyang/Downloads/otom-main
   railway init
   railway up
   ```

4. **Set environment variables** in Railway dashboard:
   - Go to your project → Variables
   - Add all variables from `.env.example`

5. **Get your URL**:
   - Railway provides a public URL like `otom-backend.up.railway.app`
   - Update `BASE_URL` in your environment variables
   - Update Vapi webhook URL to point to your Railway URL

### Cost: Free tier includes 500 hours/month

---

## Option 2: Render

Render offers automatic deploys from GitHub.

### Steps:

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/otom.git
   git push -u origin main
   ```

2. **Create Render account**: https://render.com

3. **New Web Service**:
   - Connect your GitHub repo
   - Render will detect `render.yaml` automatically
   - Or manually configure:
     - Runtime: Python
     - Build: `pip install -r requirements.txt`
     - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add environment variables** in Render dashboard

### Cost: Free tier available (spins down after 15 min inactivity)

---

## Option 3: Docker on VPS (Full Control)

Deploy to any VPS (DigitalOcean, Linode, AWS EC2, etc.)

### Steps:

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Docker**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install docker-compose -y
   ```

3. **Clone and deploy**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/otom.git
   cd otom
   cp .env.example .env
   # Edit .env with your API keys
   nano .env

   # Start services
   docker-compose up -d
   ```

4. **Set up reverse proxy (nginx)**:
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx -y

   # Create nginx config
   sudo nano /etc/nginx/sites-available/otom
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/otom /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx

   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   ```

### Cost: ~$5-10/month for a basic VPS

---

## Option 4: PM2 on Local Machine (Development/Testing)

Keep the backend running 24/7 on your Mac.

### Steps:

1. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

2. **Start Otom**:
   ```bash
   cd /Users/sukinyang/Downloads/otom-main
   ./start.sh production
   ```

3. **Set PM2 to start on boot**:
   ```bash
   pm2 startup
   # Follow the instructions it prints
   pm2 save
   ```

4. **Useful commands**:
   ```bash
   pm2 status          # Check status
   pm2 logs            # View logs
   pm2 restart all     # Restart services
   pm2 stop all        # Stop services
   ```

### Note: Your Mac needs to stay on for this to work

---

## Environment Variables

Required variables for production:

```bash
# Core (Required)
VAPI_API_KEY=xxx           # Vapi.ai API key
OPENAI_API_KEY=xxx         # OpenAI API key
SUPABASE_URL=xxx           # Supabase project URL
SUPABASE_ANON_KEY=xxx      # Supabase anon key
BASE_URL=https://xxx       # Your deployed backend URL

# Optional
ANTHROPIC_API_KEY=xxx      # For Claude AI
ELEVENLABS_API_KEY=xxx     # For voice synthesis
SENDGRID_API_KEY=xxx       # For emails
```

---

## Updating Vapi Webhook URL

After deployment, update your Vapi webhook:

1. Go to https://dashboard.vapi.ai
2. Navigate to your assistant or phone number settings
3. Update the Server URL to: `https://YOUR-DOMAIN.com/voice/vapi/webhook`

---

## Health Check

Test your deployment:

```bash
curl https://YOUR-DOMAIN.com/
```

Expected response:
```json
{
  "status": "active",
  "service": "Otom AI Consultant",
  "version": "1.0.0"
}
```

---

## Monitoring

### Railway
- Built-in metrics in dashboard

### Render
- Built-in logs and metrics

### Docker/PM2
```bash
# PM2
pm2 monit

# Docker
docker-compose logs -f
```

---

## Troubleshooting

### Backend won't start
1. Check `.env` file exists and has required variables
2. Check logs: `pm2 logs` or `docker-compose logs`

### Vapi webhooks not working
1. Verify `BASE_URL` is set correctly
2. Check webhook URL in Vapi dashboard
3. Ensure HTTPS is working (Vapi requires HTTPS)

### Database errors
1. Verify Supabase credentials
2. Run migrations: Check `database/migrations.sql`
