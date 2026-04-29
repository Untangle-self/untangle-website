export default async function handler(
  req: { body: { userInput: string; reflection: string; deepening: string } },
  res: { status: (c: number) => { json: (b: unknown) => void } },
) {
  const { userInput, reflection, deepening } = req.body;
  const apiKey = "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";

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You generate ALIGNMENT options for an emotional clarity tool.

You receive: the user's original words, an initial reframe, and a one-line observation.

Generate TWO short option-style statements (max 10–12 words each) that feel like "which of these fits?".

RULES:
- Specific to THIS person's situation — never generic
- Tentative and exploratory, not certain or conclusive
- Option-like phrase only, not explanation or analysis
- Must NOT repeat or echo the reflection or deepening
- Do NOT use: "you feel", "you are", "you might be", "this is about"
- Start with lowercase ("it's more like", "it's less about", "it's like", etc.)
- OPENING STYLE: frame as possible directions or interpretations — slightly structured, exploratory. (e.g. "it might be less about…", "this could be more about…", "maybe it's not just…")
- Do NOT mirror reflection phrasing or use reflection-style observational openings
- Must NOT sound like DEEPENING clarity or final insight
- Each option must represent a DIFFERENT angle or framing — not two versions of the same idea
- Keep options slightly broad and open-ended — they should open a direction, not land in one
- Do NOT go too specific or conclusive — these are exploratory directions, not answers
- Avoid final-sounding statements; the user is still choosing, not being told

GOOD examples:
- "it's more like you've been invisible while still showing up"
- "it's less about what happened, more about not being seen in it"
- "it's more like you kept waiting for it to matter"
- "it's like you did everything and it still didn't land"

OUTPUT — strict JSON only:
{"option1": "string", "option2": "string"}`,
        },
        {
          role: 'user',
          content: JSON.stringify({ userInput, reflection, deepening }),
        },
      ],
    }),
  });

  if (!response.ok) {
    return res.status(502).json({ error: 'upstream LLM failed' });
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  let parsed: { option1?: string; option2?: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    return res.status(500).json({ error: 'Invalid JSON from alignment LLM' });
  }

  if (!parsed?.option1 || !parsed?.option2) {
    return res.status(500).json({ error: 'Incomplete alignment response' });
  }

  return res.status(200).json({ option1: parsed.option1, option2: parsed.option2 });
}
