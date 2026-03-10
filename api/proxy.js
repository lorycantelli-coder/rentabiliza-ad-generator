/**
 * Vercel Serverless Function - Claude API Proxy
 * Contorna CORS bloqueando requisições diretas do browser
 * NOTA: usa ES module syntax (export default) por causa de "type": "module" no package.json
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
      return res.status(400).json({ error: "Missing required fields: product, audience, agent" });
    }

    console.log("Proxy: Calling Claude for agent:", agent);

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
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
            content: `Product: ${product}\nAudience: ${audience}\nTone: ${tone || "persuasive"}\n\nCreate compelling ad copy in Portuguese (Brazil).`,
          },
        ],
      }),
    });

    console.log("Claude API status:", claudeRes.status);

    const text = await claudeRes.text();
    console.log("Claude response (first 200 chars):", text.substring(0, 200));

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Claude response as JSON:", text.substring(0, 500));
      return res.status(500).json({
        error: `Resposta inválida da API Claude: ${text.substring(0, 200)}`,
      });
    }

    if (!claudeRes.ok) {
      console.error("Claude API error:", data);
      return res.status(claudeRes.status).json({
        error: data.error?.message || `Erro na API Claude (status ${claudeRes.status})`,
      });
    }

    console.log("Success!");
    return res.status(200).json(data);

  } catch (error) {
    console.error("Proxy error:", error.message);
    return res.status(500).json({
      error: `Erro interno: ${error.message}`,
    });
  }
}
