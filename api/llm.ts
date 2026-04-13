export default async function handler(req, res) {
try {
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

Return STRICT JSON:
{
“reflection”: “1 line”,
“deepening”: “1–2 lines”,
“untangle”: “insight”
}
No empty fields.
No advice.
`,
},
{
role: “user”,
content: input,
},
],
temperature: 0.7,
}),
});

const data = await response.json();
const text = data.choices?.[0]?.message?.content || "";

const jsonMatch = text.match(/\{[\s\S]*\}/);

if (jsonMatch) {
  const parsed = JSON.parse(jsonMatch[0]);

  return res.status(200).json({
    reflection: parsed.reflection || "Something feels off.",
    deepening: parsed.deepening || "",
    untangle: parsed.untangle || "",
  });
}

return res.status(200).json({
  reflection: text || "Something feels off.",
  deepening: "",
  untangle: "",
});

} catch (err) {
console.error(“LLM API error:”, err);

return res.status(500).json({
  reflection: "Something didn’t land right.",
  deepening: "",
  untangle: "",
});

}
}