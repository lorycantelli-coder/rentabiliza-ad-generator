import 'dotenv/config.js';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGER SETUP
// ═══════════════════════════════════════════════════════════════════════════════

const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'copywriter-backend' },
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          const stackStr = stack ? `\n${stack}` : '';
          return `${timestamp} [${level}] ${message}${stackStr}`;
        })
      ),
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// API CLIENT SETUP
// ═══════════════════════════════════════════════════════════════════════════════

const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

if (!apiKey) {
  logger.error('❌ API_KEY not found in environment variables');
  logger.warn('Set ANTHROPIC_API_KEY or CLAUDE_API_KEY in .env.local');
  process.exit(1);
}

logger.info('✅ API key loaded from environment');

const client = new Anthropic({
  apiKey,
  timeout: 30 * 1000, // 30 seconds
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPRESS SETUP
// ═══════════════════════════════════════════════════════════════════════════════

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Error formatter for consistent response structure
 */
function formatErrorResponse(code, message, details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Retry with exponential backoff
 * Retries only on network/timeout errors, not on API errors (4xx/5xx)
 */
async function withRetry(fn, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on API errors (4xx/5xx), only network/timeout
      if (error.status && error.status >= 400) {
        logger.warn(`API error (${error.status}), not retrying`, { error: error.message });
        throw error;
      }

      // Network/timeout error - retry with backoff
      const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      logger.warn(`Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${backoffMs}ms`, {
        error: error.message,
      });

      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

/**
 * Agent health status
 */
let agentStatus = {
  halbert: 'ready',
  wiebe: 'ready',
  bencivenga: 'ready',
};

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT DNA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const AGENTS = {
  halbert: {
    name: 'Gary Halbert',
    role: 'Hook Master - Provocative Headlines',
    system: `Você é Gary Halbert, o mestre de headlines provocativos.

VOICE DNA: Direto, brutal, sem genéricos.
THINKING DNA: 4 U's - Urgent, Unique, Ultra-specific, Useful.

Para Instagram: Headlines 3-10 palavras, Copy 2-3 linhas, CTA imediato.`,

    prompt: (tema, dados) => `TEMA: ${tema}
DADOS: ${dados || ''}

Gere 1 criativo HALBERT para Instagram estático (máx 50 palavras total):

**Headline:** Provocação + número (máx 10 palavras)
**Copy:** Por que está errado continuar (máx 30 palavras)
**CTA:** Ação específica`,
  },

  wiebe: {
    name: 'Joanna Wiebe',
    role: 'Conversion Copywriter - Structured Strategy',
    system: `Você é Joanna Wiebe, especialista em Conversion Copywriting.

VOICE DNA: Estratégico, estruturado, data-driven, benefício real.
THINKING DNA: Problema → Mecanismo → Benefícios → CTA.

Para Instagram: Comparação/Revelação estratégica, máx 50 palavras.`,

    prompt: (tema, dados) => `TEMA: ${tema}
DADOS: ${dados || ''}

Gere 1 criativo WIEBE para Instagram estático (máx 50 palavras total):

**Headline:** Comparação/Insight estratégico (máx 12 palavras)
**Copy:** Benefício específico com razão (máx 35 palavras)
**CTA:** Baseado em valor`,
  },

  bencivenga: {
    name: 'Gary Bencivenga',
    role: 'ROI Master - Maximum Conversion Efficiency',
    system: `Você é Gary Bencivenga, o copywriter de máximo ROI por palavra.

VOICE DNA: Preciso, sem waste, orientado a resultados, com números.
THINKING DNA: Cada palavra deve vender. Máximo 40 palavras.

Para Instagram: Ultra-conciso, direto, dados/números obrigatórios.`,

    prompt: (tema, dados) => `TEMA: ${tema}
DADOS: ${dados || ''}

Gere 1 criativo BENCIVENGA para Instagram estático (máx 40 palavras total):

**Headline:** Direto com número/dado (máx 8 palavras)
**Copy:** Ultra-eficiente, cada palavra vende (máx 25 palavras)
**CTA:** Micro-ação imediata`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

async function generateAgentCopy(agentKey, tema, dados) {
  const agent = AGENTS[agentKey];
  const startTime = Date.now();

  try {
    const result = await withRetry(async () => {
      const message = await client.messages.create({
        model: 'claude-opus-4-1',
        max_tokens: 300,
        system: agent.system,
        messages: [{
          role: 'user',
          content: agent.prompt(tema, dados),
        }]
      });

      return message.content[0].text;
    });

    const duration = Date.now() - startTime;
    agentStatus[agentKey] = 'ready';

    logger.info(`✅ ${agentKey} generated copy`, {
      agent: agent.name,
      duration,
      words: result.split(/\s+/).length,
    });

    return {
      agent: agent.name,
      role: agent.role,
      copy: result,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    agentStatus[agentKey] = 'error';

    logger.error(`❌ ${agentKey} failed`, {
      agent: agent.name,
      error: error.message,
      duration,
      stack: error.stack,
    });

    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const isHealthy = Object.values(agentStatus).every(s => s === 'ready');
  const status = isHealthy ? 200 : 503;

  logger.info('Health check', { status, agents: agentStatus });

  res.status(status).json({
    success: true,
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    agents: agentStatus,
    apiKey: apiKey ? 'loaded' : 'missing',
  });
});

/**
 * Generate copy from all 3 agents
 */
app.post('/api/generate-copy', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    const { tema, tipo, dados } = req.body;

    if (!tema || tema.trim() === '') {
      logger.warn('Invalid request: tema is required', { requestId });
      return res.status(400).json(
        formatErrorResponse(
          'INVALID_INPUT',
          'Tema é obrigatório'
        )
      );
    }

    logger.info('Copy generation request', {
      requestId,
      tema: tema.substring(0, 50),
      hasDados: !!dados,
    });

    // Generate in parallel with 30s timeout per agent
    let results;
    try {
      results = await Promise.all([
        generateAgentCopy('halbert', tema, dados),
        generateAgentCopy('wiebe', tema, dados),
        generateAgentCopy('bencivenga', tema, dados),
      ]);
    } catch (parallelError) {
      logger.error('One or more agents failed', {
        requestId,
        error: parallelError.message,
      });
      return res.status(500).json(
        formatErrorResponse(
          'AGENT_GENERATION_FAILED',
          'Falha ao gerar criativo. Tente novamente.',
          parallelError.message
        )
      );
    }

    // Format output
    const [halbert, wiebe, bencivenga] = results;
    const formattedCopy = `
---
### Variação 1 — ${halbert.role}
**Agent:** ${halbert.agent}

${halbert.copy}

---
### Variação 2 — ${wiebe.role}
**Agent:** ${wiebe.agent}

${wiebe.copy}

---
### Variação 3 — ${bencivenga.role}
**Agent:** ${bencivenga.agent}

${bencivenga.copy}
`.trim();

    const duration = Date.now() - startTime;
    logger.info('Copy generated successfully', {
      requestId,
      duration,
      totalWords: formattedCopy.split(/\s+/).length,
    });

    res.json({
      success: true,
      copy: formattedCopy,
      metadata: {
        requestId,
        duration,
        agents: 3,
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Unexpected error in /api/generate-copy', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration,
    });

    res.status(500).json(
      formatErrorResponse(
        'INTERNAL_SERVER_ERROR',
        'Erro interno do servidor',
        process.env.NODE_ENV === 'development' ? error.message : undefined
      )
    );
  }
});

/**
 * API Documentation
 */
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Rentabiliza Ad Generator API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'POST /api/generate-copy': 'Generate copy from all 3 agents',
      'GET /api/docs': 'This documentation',
    },
    agents: Object.entries(AGENTS).map(([key, agent]) => ({
      key,
      name: agent.name,
      role: agent.role,
    })),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`✅ Instagram Ads Squad rodando em http://localhost:${PORT}`);
  logger.info('📚 Agents: Halbert | Wiebe | Bencivenga');
  logger.info(`📖 Docs: http://localhost:${PORT}/api/docs`);
  logger.info(`🏥 Health: http://localhost:${PORT}/health`);
});

export default app;
