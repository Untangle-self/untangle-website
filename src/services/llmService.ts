export async function callLLM(input: string) {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  const data = await res.json();

  if (data.reflection) return data;

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  if (data?.text) {
    try {
      return JSON.parse(data.text);
    } catch {
      return {};
    }
  }

  return {};
}