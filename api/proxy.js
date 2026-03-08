/**
 * Vercel Serverless Function - Claude API Proxy
 * Contorna CORS bloqueando requisições diretas do browser
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { apiKey, product, audience, agent, tone } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    if (!product || !audience || !agent) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Proxy: Received request for", agent);

    // Chamar Claude API do servidor (sem CORS)
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
        system: `You are ${agent}, a legendary copywriter. Write SHORT, PUNCHY ad copy (max 3 sentences).`,
        messages: [
          {
            role: "user",
            content: `Product: ${product}\nAudience: ${audience}\nTone: ${tone}\n\nCreate compelling ad copy.`,
          },
        ],
      }),
    });

    const contentType = response.headers.get("content-type");
    console.log("Claude API Response Status:", response.status);
    console.log("Claude API Content-Type:", contentType);

    const text = await response.text();
    console.log("Claude API Response Text:", text.substring(0, 200));

    if (!contentType || !contentType.includes("application/json")) {
      console.error("Invalid content type or response:", contentType);
      return res.status(response.status).json({
        error: `Claude API error: ${text}`,
        status: response.status,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error:", e.message);
      return res.status(500).json({
        error: `Failed to parse Claude API response: ${e.message}`,
      });
    }

    if (!response.ok) {
      console.error("Claude API Error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Claude API error",
      });
    }

    console.log("Success! Content:", data.content?.[0]?.type);
    res.status(200).json(data);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).json({
      error: `Server error: ${error.message}`,
    });
  }
};
