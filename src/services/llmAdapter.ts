// src/services/llmAdapter.ts
//
// Single abstraction point for all generator-level LLM calls.
// Each generator builds a focused prompt and calls callLLM() to get back
// a plain string. Callers are responsible for catching errors and falling
// back to their template logic.
//
// Failure contract:
//   - Network error     → throws
//   - Non-2xx response  → throws
//   - Empty text        → throws
// Callers MUST wrap in try/catch.

export async function callLLM(prompt: string): Promise<string> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error(`[llmAdapter] /api/generate returned ${res.status}`);
  }

  const data: { text?: string; error?: string } = await res.json();

  if (!data.text?.trim()) {
    throw new Error('[llmAdapter] Empty text in response');
  }

  return data.text.trim();
}
