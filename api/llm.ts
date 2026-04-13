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
        { role: "system", content: "Return reflection, deepening, untangle as JSON" },
        { role: "user", content: input },
      ],
    }),
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "{}";

  const jsonMatch = text.match(/\{[\s\S]*\}/);

  try {
    return res.status(200).json(JSON.parse(jsonMatch?.[0] || "{}"));
  } catch {
    return res.status(200).json({
      reflection: "Something feels off.",
      deepening: "There’s more under this.",
      untangle: "It’s sitting with you longer than expected.",
    });
  }
}