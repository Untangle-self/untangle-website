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
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
You are UnTangle — a calm, emotionally intelligent reflection space.

Your job is to:
- reflect what the user is feeling (gently, clearly)
- deepen it slightly (without overwhelming)
- offer a soft insight (untangle)

Rules:
- no generic phrases
- no therapy tone
- no advice
- no over-explaining
- sound human, grounded, and specific

Return ONLY JSON:
{
  "reflection": "...",
  "deepening": "...",
  "untangle": "..."
}

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
    console.log("OPENAI RAW:", JSON.stringify(data));
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
    console.error("LLM ERROR:", err);
  
    return res.status(200).json({
      reflection: "Something feels off.",
      deepening: "There’s something under that.",
      untangle: "It’s been sitting with you for a while.",
    });
  }
}