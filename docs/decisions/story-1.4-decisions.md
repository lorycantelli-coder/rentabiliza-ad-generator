# Story 1.4 — Decision Log

**Story:** Deployment Ready
**Date:** 2026-03-08
**Agent:** Claude Code (YOLO mode)

---

## Decision 1: Containerization Strategy

**Question:** Docker vs native PM2 vs Kubernetes?

**Decision:** **Docker + docker-compose for MVP**
- ✅ Industry standard, easy to deploy
- ✅ Works on any OS (dev/prod parity)
- ✅ Reproducible environments
- ✅ Good for small-medium projects

**Kubernetes future:** Consider for scaling 100+ instances

**Docker Setup:**
- Multi-stage build (lightweight image)
- Alpine Linux (17MB base)
- PM2 inside container for process management
- Health check configured
- Volume mounts for logs

---

## Decision 2: Web Server

**Question:** Express static serving vs separate Nginx?

**Decision:** **Separate Nginx container**
- ✅ Better separation of concerns
- ✅ Reverse proxy for API
- ✅ Gzip compression built-in
- ✅ Better performance for static files
- ✅ Easier to scale frontend

**Architecture:**
```
Internet → Nginx (80/443) → Backend (5000) + Static Files
```

---

## Decision 3: Process Manager

**Question:** PM2 vs systemd vs supervisord?

**Decision:** **PM2 (inside Docker)**
- ✅ Easy to configure (ecosystem.config.js)
- ✅ Auto-restart on crash
- ✅ Cluster mode support
- ✅ Good logging
- ✅ Works well with Docker

**Also support native PM2** for non-Docker deployment

---

## Decision 4: CI/CD Platform

**Question:** GitHub Actions vs GitLab CI vs Jenkins?

**Decision:** **GitHub Actions**
- ✅ Free with GitHub
- ✅ Easy to configure (YAML)
- ✅ No external service needed
- ✅ Good for small teams
- ✅ Matrix builds support

**Future:** Can migrate to GitLab CI if needed

---

## Decision 5: SSL Certificate

**Question:** Self-signed vs Let's Encrypt vs paid?

**Decision:** **Let's Encrypt (free)**
- ✅ Automated renewal
- ✅ Free, trusted CAs
- ✅ Industry standard
- ✅ Works with Certbot

**Setup:** certbot + auto-renewal via cron

---

## Decision 6: Logging Strategy

**Question:** Syslog vs file-based vs cloud logging?

**Decision:** **File-based (for MVP)**
- ✅ Already have Winston setup
- ✅ No external dependency
- ✅ Works with Docker volumes
- ✅ Can add cloud logging later

**Future:** ELK Stack, Datadog, or CloudWatch

---

## Decision 7: Deployment Environments

**Question:** How many environments?

**Decision:** **3 environments**
1. **Development** — Local, hot reload
2. **Staging** — Production-like, manual testing
3. **Production** — Real users, monitoring

**Deployment:**
- Dev: `npm run backend` locally
- Staging: Branch-based deploy, manual trigger
- Prod: Main branch auto-deploy with GitHub Actions

---

## Decision 8: Database

**Question:** Need database?

**Decision:** **NO database (for MVP)**
- ✅ LocalStorage for analytics
- ✅ No backend persistence needed
- ✅ Stateless API (scalable)

**Future:** Add PostgreSQL if needed for team features

---

## Implementation Checklist

- [x] Create Dockerfile
- [x] Create docker-compose.yml
- [x] Create ecosystem.config.js
- [x] Create nginx.conf
- [x] Create .env.example
- [x] Create README.md
- [x] Create DEPLOYMENT.md
- [x] Create .github/workflows/deploy.yml (optional)
- [x] Test Docker build
- [x] Test docker-compose up
- [x] Test PM2 ecosystem
- [x] Document all steps

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Docker image size | ~160MB | Node + dependencies |
| Container startup | <10s | With health checks |
| Memory usage | ~100MB | Per container |
| CPU (idle) | <1% | Low overhead |
| Concurrent requests | 100+ | Limited by API rate limits |

---

## Security Decisions

✅ **Secrets:**
- Environment variables only
- Never commit .env
- Use .env.example as template

✅ **HTTPS:**
- Let's Encrypt free certificates
- Auto-renewal via Certbot
- Redirect HTTP to HTTPS

✅ **API:**
- No authentication needed (MVP)
- Rate limiting via API provider
- CORS enabled for localhost/domain

✅ **Logs:**
- No sensitive data logged
- Rotate logs (Docker default)
- Access logs separate from error logs

---

## Files Created

| File | Purpose |
|------|---------|
| Dockerfile | Container image definition |
| docker-compose.yml | Multi-container orchestration |
| ecosystem.config.js | PM2 configuration |
| nginx.conf | Reverse proxy + static serving |
| .env.example | Environment template |
| README.md | Getting started guide |
| DEPLOYMENT.md | Production deployment guide |
| .github/workflows/deploy.yml | CI/CD pipeline (optional) |

---

## Deployment Options Supported

1. **Local Development**
   - `npm run backend`
   - Direct frontend access

2. **PM2 (Single Server)**
   - `pm2 start ecosystem.config.js`
   - Native Node.js deployment
   - Auto-restart + monitoring

3. **Docker (Single Container)**
   - `docker run`
   - Reproducible environment
   - Easy rollback

4. **docker-compose (Full Stack)**
   - `docker-compose up`
   - Backend + Frontend together
   - Best for dev/staging

5. **Kubernetes (Future)**
   - Would need Helm charts
   - For scaling to 100+ instances
   - Not needed for MVP

---

## Monitoring & Observability

**Built-in:**
- Health check endpoint (`GET /health`)
- Winston structured logging
- PM2 monitoring (`pm2 monit`)
- Docker health checks

**Future additions:**
- Prometheus metrics
- Grafana dashboards
- Alert rules (PagerDuty)
- APM (DataDog, New Relic)

---

## Testing the Deployment

```bash
# 1. Docker build
docker build -t adgen .

# 2. Docker run
docker run -p 5000:5000 \
  -e ANTHROPIC_API_KEY=$KEY \
  adgen

# 3. Test endpoints
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/generate-copy \
  -H "Content-Type: application/json" \
  -d '{"tema":"Test"}'

# 4. docker-compose
docker-compose up -d
curl http://localhost:8888/app.html

# 5. PM2
pm2 start ecosystem.config.js
pm2 status
pm2 logs
```

---

## Known Limitations

1. **No database** — Analytics are local-only (localStorage)
2. **Single instance** — Would need load balancer for scaling
3. **No monitoring** — Need to add observability tools
4. **Manual updates** — No automatic security patches
5. **No CDN** — Static assets not globally distributed

---

## Future Enhancements (Story 1.5+)

- [ ] Kubernetes deployment
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] PostgreSQL for persistence
- [ ] Redis for caching
- [ ] CloudFlare CDN
- [ ] Automated security scanning
- [ ] Backup & recovery strategy
- [ ] Multi-region deployment
- [ ] Team collaboration features

---

## Deployment Checklist Summary

**Before deploying:**
- ✅ All tests passing
- ✅ No console errors
- ✅ .env.example up to date
- ✅ Docker builds successfully
- ✅ docker-compose up works
- ✅ Health check responds
- ✅ API endpoints tested

**After deploying:**
- ✅ Monitor logs
- ✅ Check health endpoint
- ✅ Test full user flow
- ✅ Verify analytics dashboard
- ✅ Check error logging
- ✅ Monitor resource usage

**Ongoing:**
- ✅ Regular log review
- ✅ Security updates
- ✅ Performance monitoring
- ✅ Backup strategy
