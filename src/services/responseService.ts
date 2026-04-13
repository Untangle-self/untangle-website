// responseService.ts

// SIMPLIFIED responseService.ts (safe version)

export async function generateUntangleResponse(userText: string) {
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: userText }),
    });

    const data = await res.json();

    return {
      reflection: data.reflection || "Something feels off.",
      deepening: data.deepening || "There’s more under this.",
      untangle: data.untangle || "It’s sitting with you longer than expected.",
      patternType: 'generic',
      deepeningChips: [],
      alignmentOptions: [],
      screen4Options: [],
      paths: {},
    };

  } catch (err) {
    console.error("LLM failed:", err);

    return {
      reflection: "Something feels off.",
      deepening: "There’s more under this.",
      untangle: "It’s sitting with you longer than expected.",
      patternType: 'generic',
      deepeningChips: [],
      alignmentOptions: [],
      screen4Options: [],
      paths: {},
    };
  }
}

/*import {
  extractSignal,
  enrichContext,
  detectDominantSignal,
} from './signalService';

import {
  generateReflection,
  generateDeepening,
  generateUntangle,
  generateDeepeningChips,
  generateAlignmentOptions,
  getScreen4Options,
  generatePaths,
} from './generators';

import { PATTERNS } from './patterns';

import type {
  DominantSignal,
  PatternType,
  UntangleResponse,
} from './types';

// 🔑 LLM adapter (safe import)
import { callLLM } from './llmService';

// ─────────────────────────────────────────────
// MAIN ENTRY
// ─────────────────────────────────────────────

export async function generateUntangleResponse(
  userText: string,
  precomputedSignal?: DominantSignal
): Promise<UntangleResponse> {

  // ─────────────────────────────
  // SIGNAL + CONTEXT (unchanged)
  // ─────────────────────────────
  const signal = extractSignal(userText);
  const context = enrichContext(userText);
  const dominantSignal =
    precomputedSignal ?? detectDominantSignal(userText);

  // Pattern type for structure only
  const lower = userText.toLowerCase();
  let patternType: PatternType = 'generic';

  for (const entry of PATTERNS) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      patternType = entry.patternType;
      break;
    }
  }

  // ─────────────────────────────
  // 🧠 TRY LLM FIRST
  // ─────────────────────────────
  let llmResponse: any = null;

  try {
    llmResponse = await callLLM(userText);

    if (
      !llmResponse ||
      !llmResponse.reflection ||
      !llmResponse.deepening ||
      !llmResponse.untangle
    ) {
      throw new Error('Invalid LLM response');
    }
  } catch (err) {
    console.warn('[LLM FAILED — fallback triggered]', err);
  }

  // ─────────────────────────────
  // 🔁 FALLBACK SYSTEM (your logic)
  // ─────────────────────────────
  const reflection =
    llmResponse?.reflection ??
    generateReflection(
      patternType,
      signal,
      context,
      dominantSignal,
      userText
    );

  const deepening =
    llmResponse?.deepening ??
    generateDeepening(
      patternType,
      signal,
      context,
      dominantSignal,
      userText
    );

  const untangle =
    llmResponse?.untangle ??
    generateUntangle(
      patternType,
      signal,
      context,
      dominantSignal,
      userText
    );

  // ─────────────────────────────
  // STRUCTURE (unchanged)
  // ─────────────────────────────
  const deepeningChips = generateDeepeningChips(
    dominantSignal,
    userText
  );

  const alignmentOptions = generateAlignmentOptions(
    patternType,
    signal,
    context,
    dominantSignal,
    userText
  );

  const screen4Options = getScreen4Options(
    patternType,
    userText,
    dominantSignal
  );

  const paths = generatePaths(
    patternType,
    untangle,
    signal,
    context,
    dominantSignal
  );

  return {
    reflection,
    deepening,
    deepeningChips,
    untangle,
    patternType,
    alignmentOptions,
    screen4Options,
    ...paths,
  };
} */