export const callLLM = async (input: string) => {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  const data = await res.json();

  // 🔥 THIS is the fix — parse string response safely
  try {
    if (data?.reflection) return data;

    const raw =
      typeof data === 'string'
        ? data
        : data?.choices?.[0]?.message?.content || data?.text || '';

    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('LLM parse error:', e);
  }

  // fallback (never empty)
  return {
    reflection: "Something feels off.",
    deepening: "There’s something under that.",
    untangle: "It’s been sitting with you for a while.",
  };
};