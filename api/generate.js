/**
 * Vercel Serverless Function - Claude Ad Copy Generator
 * Production-ready endpoint for Rentabiliza Ad Generator
 *
 * Deploy: Automatic via Vercel
 * Timeout: 60 seconds
 * Memory: 1024 MB
 */

const Anthropic = require("@anthropic-ai/sdk");

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Agent configurations
const AGENTS = {
  "Halbert": {
    persona:
      "Direct response copywriter expert in high-converting ads. Known for brutal honesty and ROI focus.",
    style:
      "URGENT, benefit-focused, problem-solution-result format. Use power words: FREE, GUARANTEED, EXCLUSIVE, LIMITED TIME. Include specific results.",
  },
  "Wiebe": {
    persona:
      "Master of psychological triggers and emotional storytelling. Expert in pain point identification.",
    style:
      "Storytelling-driven, pattern-interrupt opening, agitate-solve-close framework. Deep emotional hooks.",
  },
  "Bencivenga": {
    persona:
      "Long-form copy master. Creates desire through detailed objection handling and proof elements.",
    style:
      "Educational, comprehensive, builds unshakeable conviction. Stack objections and overcome methodically.",
  },
};

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

/**
 * Health check endpoint
 */
function handleHealthCheck(req, res) {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Rentabiliza Ad Generator API",
    version: "1.0.0",
  });
}

/**
 * Main generate endpoint - calls Claude API
 */
async function handleGenerate(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).set(corsHeaders).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const { product, audience, agent = "Halbert", tone = "professional" } =
      req.body;

    // Validation
    if (!product || typeof product !== "string") {
      res.status(400).json({ error: "Product is required and must be a string" });
      return;
    }

    if (!audience || typeof audience !== "string") {
      res.status(400).json({ error: "Audience is required and must be a string" });
      return;
    }

    if (!AGENTS[agent]) {
      res.status(400).json({
        error: `Invalid agent. Choose from: ${Object.keys(AGENTS).join(", ")}`,
      });
      return;
    }

    const agentConfig = AGENTS[agent];

    // Build prompt
    const systemPrompt = `You are ${agent}, a legendary copywriter.
${agentConfig.persona}

STYLE GUIDE: ${agentConfig.style}

Generate SHORT, PUNCHY ad copy (max 3 sentences) that:
1. Opens with a problem or curiosity gap
2. Delivers a unique benefit
3. Calls to action (CTA)

Tone: ${tone}`;

    const userPrompt = `Product: ${product}
Target Audience: ${audience}

Write a compelling ad copy that speaks directly to ${audience}.`;

    // Call Claude API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout for API call + buffer

    const message = await client.messages.create(
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const content = message.content[0].type === "text" ? message.content[0].text : "";

    res.status(200)
      .set(corsHeaders)
      .json({
        success: true,
        agent,
        product,
        audience,
        tone,
        copy: content,
        timestamp: new Date().toISOString(),
        usage: {
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens,
        },
      });
  } catch (error) {
    console.error("[API Error]", {
      message: error.message,
      code: error.code,
      status: error.status,
      timestamp: new Date().toISOString(),
    });

    // Handle different error types
    if (error.name === "AbortError") {
      res.status(504).set(corsHeaders).json({
        error: "Request timeout - took too long to generate copy",
        status: 504,
      });
    } else if (error.status === 429) {
      res.status(429).set(corsHeaders).json({
        error: "Rate limited - too many requests. Try again in a few seconds.",
        status: 429,
      });
    } else if (error.status === 401) {
      res.status(401).set(corsHeaders).json({
        error: "Invalid API key. Check your ANTHROPIC_API_KEY.",
        status: 401,
      });
    } else if (error.message.includes("API")) {
      res.status(503).set(corsHeaders).json({
        error: "Claude API error. Please try again.",
        status: 503,
      });
    } else {
      res.status(500).set(corsHeaders).json({
        error: "Internal server error",
        status: 500,
      });
    }
  }
}

/**
 * Main handler - routes requests
 */
module.exports = async (req, res) => {
  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname === "/api/health" || pathname === "/health") {
      return handleHealthCheck(req, res);
    }

    if (pathname === "/api/generate" || pathname === "/generate") {
      return handleGenerate(req, res);
    }

    res.status(404).json({
      error: "Not found",
      available_endpoints: ["/api/health", "/api/generate"],
    });
  } catch (error) {
    console.error("[Handler Error]", error);
    res.status(500).json({
      error: "Server error",
    });
  }
};
