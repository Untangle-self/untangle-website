export default async function handler(req, res) {
  const { input } = req.body;

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
You are part of an emotional insight system.

Generate:
1. reflection (1 line)
2. deepening (1–2 lines)
3. untangle (insight)

Keep it human, specific, non-generic.
Return JSON:
{ reflection, deepening, untangle }
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

  const text = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch {
    res.status(200).json({
      reflection: text,
      deepening: "",
      untangle: "",
    });
  }
}