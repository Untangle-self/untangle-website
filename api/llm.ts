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

STRICT RULES:
- Do NOT return empty strings
- Each field MUST contain meaningful text
- Be specific to the user's input
- No generic advice
- No placeholders

Return ONLY valid JSON:
{
  "reflection": "string",
  "deepening": "string",
  "untangle": "string"
}
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

 const text = data.choices?.[0]?.message?.content || "";

// Extract JSON safely
const jsonMatch = text.match(/\{[\s\S]*\}/);

if (jsonMatch) {
  try {
    const parsed = JSON.parse(jsonMatch[0]);

return res.status(200).json({
  reflection: parsed.reflection || "It feels heavier than just a passing mood.",
  deepening: parsed.deepening || "There’s something underneath this that hasn’t settled yet.",
  untangle: parsed.untangle || "It’s not just sadness — something unresolved is making it stay."
});
  } catch (e) {
    console.error("JSON parse failed:", e);
  }
}

// fallback (never empty now)
return res.status(200).json({
  reflection: text,
  deepening: text,
  untangle: text,
});
}