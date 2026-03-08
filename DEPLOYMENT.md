# 🚀 Deployment Guide — Rentabiliza Ad Copy Generator

Complete step-by-step guide to deploy the application to production.

---

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] Docker installed (optional, for containerized deploy)
- [ ] Claude API key obtained
- [ ] GitHub repository created
- [ ] PM2 installed globally (optional): `npm install -g pm2`
- [ ] Server/VPS access (if cloud deploy)

---

## 🚀 Option 1: Local/Server Deployment (PM2)

### Step 1: Clone Repository
```bash
cd /var/www
git clone https://github.com/your-repo/rentabiliza-ad-generator.git
cd rentabiliza-ad-generator
```

### Step 2: Install Dependencies
```bash
npm install --production
```

### Step 3: Create .env File
```bash
cp .env.example .env

# Edit and add your keys
nano .env
```

Content:
```env
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY
NODE_ENV=production
LOG_LEVEL=warn
PORT=5000
```

### Step 4: Install PM2 Globally
```bash
npm install -g pm2
```

### Step 5: Start Application
```bash
pm2 start ecosystem.config.js --env production
```

### Step 6: Setup Auto-Restart
```bash
pm2 startup
pm2 save
```

### Step 7: Verify Running
```bash
pm2 status
pm2 logs

# Test API
curl http://localhost:5000/health
```

### Step 8: Setup Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/adgen`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/adgen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 9: Setup SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

### Monitoring Commands
```bash
# View logs
pm2 logs adgen

# Monitor resources
pm2 monit

# Restart
pm2 restart adgen

# Stop
pm2 stop adgen

# View status
pm2 status
```

---

## 🐳 Option 2: Docker Deployment

### Step 1: Build Image
```bash
git clone https://github.com/your-repo/rentabiliza-ad-generator.git
cd rentabiliza-ad-generator

docker build -t rentabiliza-adgen:latest .
```

### Step 2: Create docker-compose.yml
```yaml
version: '3.9'

services:
  backend:
    image: rentabiliza-adgen:latest
    ports:
      - "5000:5000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
      - LOG_LEVEL=warn
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: nginx:alpine
    ports:
      - "8888:80"
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    restart: unless-stopped
```

### Step 3: Start Services
```bash
# Create .env file
cp .env.example .env
# Edit .env with your keys

# Start
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f backend
```

### Step 4: Test
```bash
# Health check
curl http://localhost:5000/health

# Frontend
open http://localhost:8888/app.html
```

### Management Commands
```bash
# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Restart
docker-compose restart backend

# Remove all
docker-compose down -v
docker rmi rentabiliza-adgen:latest
```

---

## ☁️ Option 3: Cloud Deployment (AWS/Heroku/DigitalOcean)

### AWS EC2
```bash
# 1. Launch EC2 instance (Ubuntu 20.04+, t2.micro)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install Docker
sudo apt-get install -y docker.io docker-compose

# 5. Clone repo
git clone https://github.com/your-repo/rentabiliza-ad-generator.git
cd rentabiliza-ad-generator

# 6. Create .env
cp .env.example .env
# Edit .env

# 7. Start with docker-compose
sudo docker-compose up -d

# 8. Setup security group (allow 80, 443)
```

### Heroku
```bash
# 1. Create Heroku app
heroku create rentabiliza-adgen

# 2. Set environment variables
heroku config:set ANTHROPIC_API_KEY=sk-ant-api03-...
heroku config:set NODE_ENV=production

# 3. Deploy
git push heroku main

# 4. View logs
heroku logs --tail
```

### DigitalOcean App Platform
```bash
# 1. Create app on DigitalOcean
# 2. Connect GitHub repository
# 3. Configure environment variables
# 4. Deploy automatically on push
```

---

## 🔒 Security Best Practices

### Secrets Management
- ❌ Never commit .env file
- ✅ Use `.env.example` as template
- ✅ Store secrets in environment variables
- ✅ Rotate API keys regularly

### SSL/TLS
- ✅ Always use HTTPS in production
- ✅ Use Let's Encrypt (free)
- ✅ Auto-renew certificates
- ✅ Use strong cipher suites

### Monitoring
- ✅ Setup health checks
- ✅ Monitor error logs
- ✅ Set up alerts for failures
- ✅ Track resource usage

### Updates
- ✅ Keep Node.js updated
- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Apply security patches
- ✅ Use LTS versions

---

## 📊 Performance Optimization

### Caching
```nginx
# In nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Gzip Compression
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### Database Connection Pooling
Not needed (this is stateless)

### CDN
Consider CloudFlare for static assets

---

## 🚨 Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs adgen

# Check environment
echo $ANTHROPIC_API_KEY

# Check port
lsof -i :5000
```

### High memory usage
```bash
# PM2 has max_memory_restart = 500M
# Restart manually
pm2 restart adgen

# Check logs for leaks
pm2 logs adgen | grep "memory"
```

### API timeout
```bash
# Check backend health
curl http://localhost:5000/health

# Increase timeout in nginx
proxy_read_timeout 120s;
```

### SSL certificate errors
```bash
# Verify certificate
ssl_verify_client off;
ssl_verify_depth 0;

# Renew certificate
sudo certbot renew
```

---

## 📈 Monitoring & Alerts

### PM2 Monitoring
```bash
# Install PM2 Plus (optional)
pm2 install pm2-auto-pull

# Real-time monitoring
pm2 monit

# CPU/Memory limits
pm2 set autorestart-delay 5000
pm2 set max-memory-restart 500M
```

### Nginx Logs
```bash
# Real-time
tail -f /var/log/nginx/access.log | grep api

# Error logs
tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
# View logs
pm2 logs adgen

# Filter errors
pm2 logs adgen | grep ERROR
```

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test
      - run: npm run lint
      
      - name: Deploy to server
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_KEY }}" > ~/.ssh/key
          chmod 600 ~/.ssh/key
          ssh -i ~/.ssh/key user@server "cd /var/www/adgen && git pull && npm install && pm2 restart adgen"
```

### Setup Secrets in GitHub
1. Go to Settings → Secrets
2. Add `DEPLOY_KEY` (SSH private key)

---

## ✅ Post-Deployment Verification

```bash
# 1. Check health
curl https://your-domain.com/health

# 2. Test API
curl -X POST https://your-domain.com/api/generate-copy \
  -H "Content-Type: application/json" \
  -d '{"tema":"Test"}'

# 3. Check frontend
open https://your-domain.com/app.html

# 4. Check analytics
open https://your-domain.com/analytics.html

# 5. Monitor logs
pm2 logs adgen

# 6. Check resources
pm2 monit
```

---

## 🎯 Final Checklist

- [ ] .env file created with all required variables
- [ ] API key configured and working
- [ ] Application starts without errors
- [ ] Health check endpoint returns 200
- [ ] Frontend loads correctly
- [ ] API endpoints accessible
- [ ] Logging working (check logs directory)
- [ ] HTTPS enabled (SSL certificate)
- [ ] PM2 configured for auto-restart
- [ ] Nginx reverse proxy working
- [ ] Monitoring setup (pm2 monit)
- [ ] Backup strategy in place
- [ ] Disaster recovery plan ready

---

## 📞 Support

**Issues?**
1. Check logs: `pm2 logs adgen`
2. Test health: `curl http://localhost:5000/health`
3. Review DEPLOYMENT.md
4. Check GitHub Issues

**Ready for production!** 🚀
