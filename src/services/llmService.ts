export async function callLLM(input: string) {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  const data = await res.json();

  // 🔥 IMPORTANT: handle both cases safely
  // case 1: already parsed (ideal)
  if (data.reflection) return data;

  // case 2: string response (your current issue)
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse LLM string:', data);
      return {};
    }
  }

  // case 3: wrapped response (safety)
  if (data?.text) {
    try {
      return JSON.parse(data.text);
    } catch (e) {
      console.error('Failed to parse data.text:', data.text);
      return {};
    }
  }

  return {};
}