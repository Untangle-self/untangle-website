// src/services/llmService.ts

export async function callLLM(input: string) {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    throw new Error("LLM API failed");
  }

  return await res.json();
}