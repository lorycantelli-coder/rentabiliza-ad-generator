# 🎯 Rentabiliza Ad Copy Generator

AI-powered ad copy generator using 3 expert copywriter agents to create high-converting variations in seconds.

**Status:** ✅ MVP Complete (Story 1.1-1.3 Done)

---

## ✨ Features

### 🤖 AI Agents (3 running in parallel)
- **Gary Halbert** — Hook Master: Provocative headlines
- **Joanna Wiebe** — Conversion Expert: Benefit-focused copy
- **Gary Bencivenga** — ROI Master: Ultra-concise messaging

### 🎨 Frontend
- Dark theme, responsive design (375px-1200px)
- Animated loading spinner
- Copy-to-clipboard for each element
- Toast notifications
- WCAG 2.1 Level A accessible

### 📊 Analytics Dashboard
- Real-time performance metrics
- Win rate & score charts
- Historical tracking (last 10 generations)
- Star rating system (1-10)
- Auto-refresh every 5 seconds

### 🚀 Production Ready
- Docker containerization
- PM2 auto-restart
- Comprehensive logging
- Error handling + retry logic
- Health check endpoint
- Unit tests included

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Claude API key (https://console.anthropic.com/)

### Installation

1. Clone & install
   ```bash
   cd rentabiliza-ad-generator
   npm install
   ```

2. Create .env file
   ```bash
   cp .env.example .env
   # Edit .env and add ANTHROPIC_API_KEY
   ```

3. Start backend (Terminal 1)
   ```bash
   npm run backend
   ```

4. Open frontend (Terminal 2)
   ```bash
   open http://localhost:8888/app.html
   ```

### With Docker
```bash
docker-compose up -d
# Frontend: http://localhost:8888
# Backend: http://localhost:5000
```

---

## 📖 Usage

1. **Enter theme:** "Imóveis em leilão 2026"
2. **Click "Gerar →"** → Wait 10-15s
3. **Rate variations:** Click stars (1-10)
4. **View Analytics:** Click "📊 Analytics"

---

## 📁 Project Structure

```
├── backend.js              # Node.js + Claude API
├── dist/
│   ├── app.html           # Generator UI
│   └── analytics.html     # Analytics dashboard
├── Dockerfile             # Container config
├── docker-compose.yml     # Multi-container setup
├── ecosystem.config.js    # PM2 configuration
├── nginx.conf            # Reverse proxy
├── package.json          # Dependencies
└── docs/                 # Stories & decisions
```

---

## 🛠️ Development

### Available Scripts
```bash
npm run backend         # Start server
npm test              # Run tests
npm run test:backend  # Backend tests only
npm run lint          # TypeScript check
```

### Testing
```bash
npm test              # Full test suite
curl http://localhost:5000/health | jq .
```

---

## 🚢 Deployment

### Docker
```bash
docker build -t rentabiliza-adgen .
docker run -d -p 5000:5000 -e ANTHROPIC_API_KEY=$KEY rentabiliza-adgen
```

### PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

---

## 📊 Analytics API

### Health Check
```bash
curl http://localhost:5000/health
```

### Generate Copy
```bash
curl -X POST http://localhost:5000/api/generate-copy \
  -H "Content-Type: application/json" \
  -d '{"tema":"Imóveis em leilão 2026"}'
```

### API Docs
```bash
curl http://localhost:5000/api/docs
```

---

## 🔍 Debugging

### View Logs
```bash
tail -f logs/combined.log | jq '.'
```

### Enable Debug
```bash
LOG_LEVEL=debug npm run backend
```

### Health Check
```bash
curl http://localhost:5000/health | jq .
pm2 status
```

---

## 📚 Documentation

- **PROJECT_STATUS.md** — Complete project overview
- **BACKEND_IMPROVEMENTS.md** — Backend details
- **FRONTEND_IMPROVEMENTS.md** — Frontend features
- **ANALYTICS_IMPROVEMENTS.md** — Analytics system
- **DEPLOYMENT.md** — Production deployment guide
- **docs/stories/** — Development stories
- **docs/decisions/** — Architecture decisions

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check API key
grep ANTHROPIC_API_KEY .env

# Check port
lsof -i :5000
```

### Docker issues
```bash
docker-compose down
docker-compose up --build
docker-compose logs -f backend
```

---

## 📄 License

MIT License

---

## 🚀 Next Steps

See **DEPLOYMENT.md** for production deployment guide.
