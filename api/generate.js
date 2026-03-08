/**
 * Vercel Serverless Function - Claude Ad Copy Generator
 * Simplified version for better Vercel compatibility
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Health check
  if (req.method === "GET") {
    return res.status(200).json({
      status: "healthy",
      service: "Rentabiliza Ad Generator API",
      timestamp: new Date().toISOString(),
    });
  }

  // POST - Generate copy
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { product, audience, agent = "Halbert", tone = "professional" } =
      req.body;

    if (!product || !audience) {
      return res
        .status(400)
        .json({ error: "product and audience are required" });
    }

    const AGENTS = {
      Halbert:
        "Direct response copywriter. URGENT, benefit-focused, results-driven.",
      Wiebe: "Storytelling expert. Emotional hooks, pattern interrupts.",
      Bencivenga:
        "Long-form master. Educational, conviction-building, comprehensive.",
    };

    if (!AGENTS[agent]) {
      return res.status(400).json({
        error: `Invalid agent. Use: ${Object.keys(AGENTS).join(", ")}`,
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return res.status(500).json({
        error: "API configuration missing",
        success: false,
      });
    }

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        system: `You are ${agent}, a legendary copywriter.
${AGENTS[agent]}

Write SHORT, PUNCHY ad copy (max 3 sentences) for:
- Product: ${product}
- Audience: ${audience}
- Tone: ${tone}

Focus on: Opening hook, unique benefit, call-to-action.`,
        messages: [
          {
            role: "user",
            content: `Create compelling ad copy for "${product}" targeting "${audience}".`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Claude API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Claude API error",
        success: false,
      });
    }

    const copy =
      data.content[0]?.type === "text" ? data.content[0].text : "";

    return res.status(200).json({
      success: true,
      agent,
      product,
      audience,
      tone,
      copy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
      success: false,
    });
  }
};
