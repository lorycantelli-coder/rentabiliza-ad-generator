# 🚀 Deploy no Vercel — Guia Completo

Deploy seu Ad Copy Generator em produção em **5 minutos**.

---

## 📋 Pré-requisitos

✅ Conta no GitHub (com repositório do projeto)
✅ Conta no Vercel (grátis: https://vercel.com)
✅ API Key do Claude (https://console.anthropic.com)

---

## ⚡ Opção 1: Deploy via GitHub (RECOMENDADO)

### Passo 1: Push do Código para GitHub

```bash
cd /Users/lorycantelli/projetos/rentabiliza-ad-generator

# Inicializar git (se não estiver já)
git init
git add .
git commit -m "feat: deploy ready Ad Copy Generator"

# Adicionar remote (replace com seu repositório)
git remote add origin https://github.com/seu-usuario/rentabiliza-ad-generator.git
git branch -M main
git push -u origin main
```

### Passo 2: Conectar Vercel ao GitHub

1. Acesse https://vercel.com
2. Clique em **"New Project"**
3. Selecione **"Import Git Repository"**
4. Busque por `rentabiliza-ad-generator`
5. Clique em **"Import"**

### Passo 3: Configurar Variáveis de Ambiente

Na página de importação, procure por **"Environment Variables"** e adicione:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Cole sua chave API do Claude |

![Vercel Env Setup](docs/vercel-env-setup.png)

### Passo 4: Deploy

Clique em **"Deploy"** — leva ~2 minutos.

Seu site estará disponível em: `https://rentabiliza-ad-generator.vercel.app`

---

## 💻 Opção 2: Deploy via CLI (Alternativa)

Se preferir usar a linha de comando:

### Instalar Vercel CLI

```bash
npm install -g vercel
```

### Fazer Login

```bash
vercel login
```

### Deploy

```bash
cd /Users/lorycantelli/projetos/rentabiliza-ad-generator

# Deploy com produção
vercel --prod --env ANTHROPIC_API_KEY=sk-ant-...
```

Ou mais seguro, configure as variáveis primeiro:

```bash
# Adicionar variável de ambiente
vercel env add ANTHROPIC_API_KEY

# Deploy
vercel --prod
```

---

## ✅ Após o Deploy

### Verificar Status

```bash
# Ver logs em tempo real
vercel logs rentabiliza-ad-generator

# Listar deployments
vercel list
```

### Testar a API

```bash
# Health Check
curl https://seu-dominio.vercel.app/api/health

# Response esperado:
{
  "status": "healthy",
  "timestamp": "2024-03-08T...",
  "service": "Rentabiliza Ad Generator API",
  "version": "1.0.0"
}
```

### Testar Geração de Copy

```bash
curl -X POST https://seu-dominio.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Curso de Marketing Digital",
    "audience": "Pequenos empresários",
    "agent": "Halbert",
    "tone": "professional"
  }'
```

---

## 📊 Arquitetura em Produção

```
┌─────────────────────┐
│  Seu Domínio        │
│ (Vercel)            │
│ https://seu-app.xxx │
└──────────┬──────────┘
           │
    ┌──────┴──────────┐
    │                 │
┌───▼────────┐  ┌───▼──────────┐
│  Frontend   │  │  API Routes  │
│  (Static)   │  │  (Serverless)│
│  HTML, CSS, │  │  /api/*      │
│  JS         │  │              │
└────────────┘  └───┬──────────┘
                     │
                ┌────▼────────────┐
                │  Claude API     │
                │  (External)     │
                │  api.anthropic..│
                └─────────────────┘
```

---

## 🔐 Variáveis de Ambiente

### Em Produção (Vercel Dashboard)

1. Acesse seu projeto: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá para **Settings → Environment Variables**
4. Adicione:

```
ANTHROPIC_API_KEY = sk-ant-...
```

### Em Desenvolvimento (Local)

Crie um `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**⚠️ NUNCA comite o `.env.local` no GitHub**

---

## 🚨 Troubleshooting

### ❌ "Invalid API Key"

```
Erro: Invalid API key. Check your ANTHROPIC_API_KEY.
```

**Solução:**
1. Verificar sua chave em https://console.anthropic.com
2. Copiar a chave completa (sem espaços)
3. Atualizar em Vercel Dashboard → Settings → Environment Variables

### ❌ "Request timeout"

```
Erro: Request timeout - took too long to generate copy
```

**Solução:**
- Tente novamente em alguns segundos
- Vercel serverless tem limite de 60s

### ❌ "Rate limited"

```
Erro: Rate limited - too many requests.
```

**Solução:**
- Aguarde alguns segundos
- Sua conta Anthropic pode ter limite de requisições

### ❌ Frontend não carrega

**Solução:**
1. Limpar cache: `Ctrl+Shift+Delete` (ou `Cmd+Shift+Delete`)
2. Reload: `Ctrl+R` (ou `Cmd+R`)
3. Verificar console (F12) por erros

---

## 📈 Monitoramento

### Ver Logs no Vercel

```bash
# Em tempo real
vercel logs --tail

# Últimas 10 chamadas
vercel logs
```

### Exemplo de Log

```
[POST] /api/generate - 200 OK - 2.3s
  Agent: Halbert
  Tokens used: 450 (input) + 180 (output)
```

---

## 💰 Custos

### Vercel (Frontend + Serverless)

| Item | Limite Gratuito | Pago |
|------|-----------------|------|
| Requests | Ilimitado | Ilimitado |
| Bandwidth | 100GB/mês | $0.15/GB extra |
| Serverless Duration | 900s/mês | $0.50/100GB-hrs |
| Builds | 100/mês | $1/build extra |

Para a maioria dos casos, **fica grátis no plano gratuito**.

### Claude API (Anthropic)

Você paga por token utilizado:

| Modelo | Input | Output |
|--------|-------|--------|
| Claude 3.5 Sonnet | $3/1M tokens | $15/1M tokens |

**Exemplo:**
- 1 geração = ~450 tokens input + 180 tokens output
- Custo por geração ≈ $0.003 (0.3 centavos)
- 100 gerações/dia = $0.30

---

## 🎯 Próximos Passos

### 1. Escalar com Banco de Dados

```javascript
// Salvar gerações em DB (Supabase)
const { data } = await supabase
  .from('generations')
  .insert({ product, audience, copy, agent })
```

### 2. Adicionar Autenticação

```javascript
// Proteger API com chave do usuário
const apiKey = req.headers['x-api-key'];
if (!validateApiKey(apiKey)) return 401;
```

### 3. Implementar Analytics

```javascript
// Track em Mixpanel ou Posthog
analytics.track('copy_generated', {
  agent,
  product_length: product.length,
  response_time: Date.now() - start
})
```

### 4. Adicionar Fila (Queue)

```javascript
// Bull + Redis para processar em background
const queue = new Queue('generations');
queue.add({ product, audience })
```

---

## 📚 Documentação Completa

- **README.md** — Getting Started
- **DEPLOYMENT.md** — Opções de deployment completas
- **PROJECT_STATUS.md** — Arquitetura geral
- **BACKEND_IMPROVEMENTS.md** — Detalhes técnicos backend

---

## ✨ Comandos Úteis Vercel

```bash
# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod

# Ver logs
vercel logs

# Listar projetos
vercel projects list

# Deletar projeto
vercel projects remove rentabiliza-ad-generator

# Ver status
vercel status
```

---

## 🎉 Pronto!

Seu Ad Copy Generator está **LIVE** em produção!

**URL de Produção:**
```
https://rentabiliza-ad-generator.vercel.app
```

**Compartilhe com amigos:**
```
https://rentabiliza-ad-generator.vercel.app
```

---

**Status:** ✅ Production Ready
**Last Updated:** 2024-03-08
**Version:** 1.0.0
