// api/generate.ts
// Single-prompt → single-text endpoint.
// Used by llmAdapter.ts — each generator sends a focused prompt and gets back
// a plain string. No JSON envelope, no multi-field response.

export default async function handler(
  req: { body: { prompt: string } },
  res: { status: (c: number) => { json: (b: unknown) => void } },
) {
  const { prompt } = req.body;

  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a focused output generator for an emotional insight system. ' +
            'Follow the user\'s instructions exactly. Output ONLY the requested text — ' +
            'no preamble, no labels, no quotation marks, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    return res.status(502).json({ error: 'upstream LLM failed' });
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content?.trim() ?? '';

  if (!text) {
    return res.status(502).json({ error: 'empty response from LLM' });
  }

  return res.status(200).json({ text });
}
