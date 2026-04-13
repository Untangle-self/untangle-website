export default async function handler(req, res) {
  const { input } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `
You are UnTangle.

You must generate:

1. reflection (1 line)
2. deepening (1 line)
3. untangle (1–2 lines insight)

STRICT RULES:
- No advice
- No generic phrases
- No therapy tone
- Use user's exact emotional language
- Be specific, grounded

Return ONLY JSON:
{
  "reflection": "...",
  "deepening": "...",
  "untangle": "..."
}
`,
          },
          {
            role: "user",
            content: input,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("OPENAI RAW:", JSON.stringify(data));

    const content = data.choices?.[0]?.message?.content;

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from LLM" });
    }

    // 🚨 NO FALLBACK
    if (!parsed?.reflection || !parsed?.deepening || !parsed?.untangle) {
      return res.status(500).json({ error: "Incomplete LLM response" });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("LLM ERROR:", err);
    return res.status(500).json({ error: "LLM failed" });
  }
}