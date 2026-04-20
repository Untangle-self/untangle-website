export interface LLMContext {
  userInput: string;
  reflection?: string;
  selectedAlignment?: string;
  deepening?: string;
  currentInput?: string;
}

export async function callLLM(context: LLMContext | string, _messages?: any[]) {
  const payload: LLMContext = typeof context === 'string' ? { userInput: context } : context;
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('API failed');
  }

  return res.json();
}
