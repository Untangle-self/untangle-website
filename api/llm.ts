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
        messages: [
          {
            role: "system",
            content: `
You are an emotional reflection system.

Return ONLY valid JSON in this format:
{
  "reflection": "...",
  "deepening": "...",
  "untangle": "..."
}

No extra text. No explanation.
            `,
          },
          {
            role: "user",
            content: input,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // 👉 SAFE PARSE (no regex fragile stuff)
    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    // 👉 fallback if model messes up
    if (!parsed) {
      return res.status(200).json({
        reflection: "Something feels off.",
        deepening: "There’s something under that.",
        untangle: "It’s been sitting with you for a while.",
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(200).json({
      reflection: "Something feels off.",
      deepening: "There’s something under that.",
      untangle: "It’s been sitting with you for a while.",
    });
  }
}