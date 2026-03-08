# ✅ Deploy Checklist — Rentabiliza Ad Generator

## 📋 Pré-Deploy (Local)

- [ ] Testar API localmente: `npm run backend`
- [ ] Testar frontend: `open http://localhost:8888/app.html`
- [ ] Verificar variáveis em `.env`
- [ ] Todos os testes passando: `npm test`
- [ ] Build sem erros: `npm run build`
- [ ] Sem console errors (F12)

## 🔧 Arquivos Criados para Vercel

```
✅ vercel.json              — Configuração do Vercel
✅ api/generate.js          — Endpoint serverless
✅ public/index.html        — Frontend otimizado
✅ .vercelignore           — Arquivos ignorados
✅ VERCEL-DEPLOYMENT.md    — Guia completo
```

## 📤 Deploy Steps

### Step 1: GitHub Push

```bash
cd /Users/lorycantelli/projetos/rentabiliza-ad-generator

git add -A
git commit -m "feat: add Vercel serverless deployment"
git push origin main
```

### Step 2: Vercel Setup

1. Acesse https://vercel.com
2. Clique "New Project"
3. Selecione seu repositório GitHub
4. Adicione variável de ambiente:
   - `ANTHROPIC_API_KEY` = seu token

### Step 3: Deploy

Clique "Deploy" — leva ~2 minutos

### Step 4: Test

```bash
# Health check
curl https://seu-dominio.vercel.app/api/health

# Test API
curl -X POST https://seu-dominio.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Teste",
    "audience": "Todos",
    "agent": "Halbert"
  }'
```

## 📊 URLs Importantes

- **Frontend:** https://rentabiliza-ad-generator.vercel.app
- **API Docs:** https://rentabiliza-ad-generator.vercel.app/api/health
- **Vercel Dashboard:** https://vercel.com/dashboard

## 💾 Backup & Rollback

```bash
# Se algo der errado, voltar para versão anterior
git revert HEAD
git push origin main
# Vercel fará redeploy automaticamente
```

## 🎯 Post-Deploy

- [ ] Acessar site funcionando
- [ ] Testar geração de copy
- [ ] Verificar analytics (se implementado)
- [ ] Monitorar logs: `vercel logs --tail`
- [ ] Documentar URL em README.md

## 📞 Support

Algo deu errado? Veja:

1. **VERCEL-DEPLOYMENT.md** — Troubleshooting
2. **Logs:** `vercel logs --tail`
3. **Console:** https://vercel.com/dashboard/project-logs

---

**Status:** ✅ Ready for Production
**Last Updated:** 2024-03-08
**Estimated Deployment Time:** 2-5 minutes
