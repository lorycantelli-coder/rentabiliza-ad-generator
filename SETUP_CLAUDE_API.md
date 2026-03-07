# 🚀 Setup Claude API — Rentabiliza Ad Generator

## ✅ O que foi implementado

**Nova arquitetura de copy generation:**

```
┌─────────────────┐
│   User Input    │
└────────┬────────┘
         │
    ┌────▼─────────────────┐
    │ Claude 3.5 Sonnet    │ ← Copy Generation
    │ (Copywriting)        │
    └────┬──────────────────┘
         │
    ┌────▼──────────────────┐
    │ Validation Service    │ ← Checklist Automática
    │ (Score 0-10)         │
    └────┬──────────────────┘
         │
    ┌────▼──────────────────┐
    │ Refinement Loop       │ ← Auto-corrige se fraco
    │ (Máx 2 tentativas)   │
    └────┬──────────────────┘
         │
    ┌────▼──────────────────┐
    │ Final Copy Output     │ ← Qualidade Garantida
    └──────────────────────┘

┌──────────────────┐
│ Gemini 2.0 Flash │ ← Imagens (rápido, visual)
└──────────────────┘
```

## 🔑 Configuração da Claude API Key

### Passo 1: Obter a API Key

1. Acesse [https://console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)
2. Faça login com sua conta Anthropic
3. Clique em "Create Key"
4. Copie a chave (vai começar com `sk-ant-...`)

### Passo 2: Adicionar no .env.local

Abra ou crie o arquivo `.env.local` na raiz do projeto:

```bash
VITE_GEMINI_API_KEY=AIzaSyAMgEhZJQqL9d8TUGKf1xHvUgWZcKfp63w
VITE_CLAUDE_API_KEY=sk-ant-your-key-here
```

**Substitua `sk-ant-your-key-here` pela sua chave real.**

### Passo 3: Reiniciar o Servidor

```bash
# Se o servidor está rodando, mata e reinicia
npm run dev -- --port 5173
```

## 🎯 Novo Fluxo de Geração

### Modo Completo (Templates)

```
1. Escolher template (Meta Ad, Story, Landing Page, etc)
2. Preencher contexto (objetivo, público, ângulo, etc)
3. Clicar "Gerar Ad Premium"
   ├─ Claude gera 3 variações diferentes
   ├─ Validador checa qualidade (score 0-10)
   ├─ Se score < 7: Claude refina automaticamente
   └─ Resultado final com scores e logs

4. Editar headline se quiser
5. Baixar ou exportar
```

### Quick Generate

```
1. Descrever o que quer em uma linha
2. Clicar "Gerar Agora"
   ├─ Claude gera 3 variações AGRESSIVAS
   ├─ Validação automática
   ├─ Refinement se necessário
   └─ 3 variações prontas para usar

3. Copiar, baixar ou exportar
```

## 📊 Melhoria de Qualidade

### Prompts Otimizados

- **Antes:** 115 linhas de instruções (muito ruído)
- **Depois:** 30 linhas diretas + exemplos de saída

### Validação Automática

Cada copy é checado contra:

```
✓ Nenhuma frase genérica proibida
✓ Pelo menos 1 métrica (18.5%, R$ 420M, 87%, etc)
✓ Agressividade mínima (nível 2-3)
✓ Copy não muito longo
✓ Menção a Rentabiliza ou solução
✓ CTA específica (não genérica)
```

**Score de qualidade:** 0-10 (exibido no console)

### Refinement Loop

Se a primeira tentativa score < 7:
1. Claude recebe feedback de validação
2. Refina o copy corrigindo problemas
3. Validação novamente
4. Se ainda fraco, usa anyway (melhor que nada)

## 🔍 Logs de Debug

Abra o **Console do Navegador** (F12) para ver:

```javascript
// Exemplo de log
📊 Score de qualidade: 8.5/10
✨ Copy foi refinado automaticamente para melhor qualidade
⚠️ Copy gerado com algumas advertências: [array de issues]
```

## ⚙️ Modelo Claude Usado

```
Model: claude-3-5-sonnet-20241022
Max Tokens: 1500 por geração
Temperature: (padrão, não customizável)
```

Se quiser mudar para modelo mais poderoso:
- Edite `src/services/claudeService.ts` linha 15
- Mude `claude-3-5-sonnet-20241022` para `claude-opus-4-1` (mais caro, mas melhor)

## 🚨 Troubleshooting

### "Claude API Key inválida"
- Verifique se a chave começa com `sk-ant-`
- Confirme que está em `.env.local` (não em `.env`)
- Reinicie o servidor após adicionar a chave

### "Copy retorna vazio ou genérico"
- Verifique console (F12) para ver validation issues
- Experimente reescrever o contexto de forma mais específica
- Reporte issue se script estiver claramente fraco

### Score muito baixo (< 5)
- Validador é rigoroso propositalmente
- Score de 6-7 já é aceitável (refinement ativa)
- Se score permanecer baixo, copy ainda é usado (é melhor algo que nada)

## 📈 Próximos Passos

- [ ] Testar geração de copys
- [ ] Avaliar qualidade das variações
- [ ] Ajustar prompts se necessário
- [ ] Considerar upgrade para Claude Opus se quiser melhor qualidade

---

**Pronto? Execute:** `npm run dev -- --port 5173`

Depois teste a geração com um template ou Quick Generate!
