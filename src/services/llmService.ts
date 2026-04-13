export async function callLLM(input: string) {
  const res = await fetch('https://untangle-two.vercel.app/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  return res.json();
}