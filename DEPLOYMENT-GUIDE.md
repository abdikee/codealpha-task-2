# Production Deployment Guide

This guide walks you through deploying your social media application to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

---

## Step 1: Environment Configuration

### 1.1 Generate Secure Secrets

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Cookie Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Database Password (if creating new database)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 1.2 Create Production .env File

Copy `.env.example` to `.env` and update with your production values:

```bash
cp .env.example .env
```

**CRITICAL: Update these values in `.env`:**

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database - UPDATE WITH YOUR PRODUCTION DATABASE
DB_HOST=your-database-host.com
DB_PORT=5432
DB_NAME=social_media_prod
DB_USER=your_db_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Security - REPLACE WITH GENERATED SECRETS
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE
COOKIE_SECRET=YOUR_GENERATED_COOKIE_SECRET_HERE

# Frontend URL - UPDATE WITH YOUR DOMAIN
FRONTEND_URL=https://yourdomain.com

# OAuth (Optional - Configure or remove)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

---

## Step 2: Database Setup

### 2.1 Create Production Database

**Option A: Local PostgreSQL**
```bash
sudo -u postgres psql
CREATE DATABASE social_media_prod;
CREATE USER your_db_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE social_media_prod TO your_db_user;
\q
```

**Option B: Cloud Database (Recommended)**
- AWS RDS PostgreSQL
- DigitalOcean Managed Database
- Supabase PostgreSQL
- Heroku Postgres

### 2.2 Run Migrations

```bash
cd server
node migrate.js up
```

### 2.3 Verify Database

```bash
node db.verify.js
```

---

## Step 3: Build Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm run preview
```

The build output will be in the `dist/` directory.

---

## Step 4: Server Setup

### 4.1 Install Dependencies

```bash
cd server
npm install --production
```

### 4.2 Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 4.3 Start Server with PM2

```bash
# Start in production mode
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 4.4 Monitor Server

```bash
# View logs
pm2 logs social-media-api

# Monitor resources
pm2 monit

# Check status
pm2 status
```

---

## Step 5: SSL/HTTPS Setup

### Option A: Using Nginx as Reverse Proxy (Recommended)

**Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

**Configure Nginx:**
```nginx
# /etc/nginx/sites-available/social-media

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Frontend (Static Files)
    location / {
        root /path/to/your/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api {
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
    
    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/social-media /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Install Let's Encrypt SSL:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Option B: Using Caddy (Automatic HTTPS)

**Install Caddy:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

**Configure Caddy:**
```caddyfile
# /etc/caddy/Caddyfile

yourdomain.com {
    # Frontend
    root * /path/to/your/dist
    file_server
    try_files {path} /index.html
    
    # API Backend
    reverse_proxy /api/* localhost:3000
    reverse_proxy /socket.io/* localhost:3000
}
```

**Restart Caddy:**
```bash
sudo systemctl restart caddy
```

---

## Step 6: Frontend Deployment

### Option A: Deploy with Nginx (Same Server)

Already configured in Step 5.

### Option B: Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Update environment variables in Vercel dashboard:
- `VITE_API_URL=https://api.yourdomain.com`

### Option C: Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Step 7: Post-Deployment Verification

### 7.1 Health Check

```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "production",
  "database": {
    "connected": true
  }
}
```

### 7.2 Test Authentication

1. Visit `https://yourdomain.com`
2. Register a new account
3. Login with credentials
4. Create a test post
5. Test OAuth login (if configured)

### 7.3 Monitor Logs

```bash
# PM2 logs
pm2 logs social-media-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Step 8: Security Hardening

### 8.1 Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 8.2 Fail2Ban (Prevent Brute Force)

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 8.3 Regular Updates

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Node.js security updates
npm audit fix
```

---

## Step 9: Backup Strategy

### 9.1 Database Backups

**Automated Daily Backup:**
```bash
# Create backup script
cat > /home/user/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U your_db_user -d social_media_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
EOF

chmod +x /home/user/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```

### 9.2 File Backups

```bash
# Backup uploaded images
tar -czf backups/images_$(date +%Y%m%d).tar.gz public/images/
```

---

## Step 10: Monitoring & Alerts

### 10.1 Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

### 10.2 Error Tracking

**Install Sentry (Optional):**
```bash
npm install @sentry/node
```

Add to `server/server.js`:
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check PM2 logs
pm2 logs social-media-api --lines 100

# Check if port is in use
sudo lsof -i :3000

# Restart server
pm2 restart social-media-api
```

### Database Connection Failed

```bash
# Test database connection
cd server
node -e "import('./db.js').then(db => db.testConnection())"

# Check PostgreSQL status
sudo systemctl status postgresql
```

### SSL Certificate Issues

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Test Nginx configuration
sudo nginx -t
```

### High Memory Usage

```bash
# Check PM2 memory
pm2 monit

# Restart if needed
pm2 restart social-media-api
```

---

## Maintenance Commands

```bash
# View server status
pm2 status

# Restart server
pm2 restart social-media-api

# Stop server
pm2 stop social-media-api

# View logs
pm2 logs social-media-api

# Clear logs
pm2 flush

# Update application
git pull
npm install
npm run build
pm2 restart social-media-api
```

---

## Performance Optimization

### Enable Gzip Compression (Nginx)

Add to Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### Enable HTTP/2

Already enabled in Nginx config above (`http2` flag).

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Analyze tables
ANALYZE posts;
ANALYZE users;
```

---

## Scaling Considerations

### Horizontal Scaling

- Use PM2 cluster mode (already configured)
- Add load balancer (Nginx, HAProxy)
- Use Redis for session storage
- Implement caching layer

### Database Scaling

- Enable connection pooling (already configured)
- Add read replicas
- Implement query caching
- Use Redis for frequently accessed data

---

## Support & Resources

- **PM2 Documentation**: https://pm2.keymetrics.io/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

---

**Deployment Checklist:**

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] Frontend built successfully
- [ ] Server running with PM2
- [ ] SSL/HTTPS configured
- [ ] Domain DNS configured
- [ ] Health check passing
- [ ] Authentication tested
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Firewall configured
- [ ] Documentation updated

**Congratulations! Your application is now deployed to production! 🎉**
