import type { PatternType, ChipOption } from '../types/flow';

// ─── Path content interfaces ──────────────────────────────────────────────────

export interface PathAContent {
  message: string;
  options: ChipOption[];
  miniUntangles: Record<string, string>;
  closingMessage: string;
}

export interface PathBContent {
  message: string;
  options: ChipOption[];
  miniUntangles: Record<string, string>;
  landingMessage: string;
}

export interface PathCContent {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
}

export interface UntangleResponse {
  reflection: string;
  deepening: string;
  deepeningChips: ChipOption[];
  untangle: string;
  patternType: PatternType;
  alignmentOptions: ChipOption[];
  screen4Options: ChipOption[];
  pathA: PathAContent;
  pathB: PathBContent;
  pathC: PathCContent;
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface Context {
  mentionsTravel: boolean;
  mentionsFatigue: boolean;
  mentionsLowEnergy: boolean;
}

// ─── Signal extraction ────────────────────────────────────────────────────────

export function extractSignal(input: string): string {
  const sentences = input
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const genericOpenerRe =
    /^(i feel |i'm feeling |i just feel |it's just |i think |i don't know |well |so |basically |honestly )/i;
  const feelingStartRe = /^(feeling |felt |been feeling |having a )/i;

  for (const sentence of sentences) {
    if (genericOpenerRe.test(sentence)) continue;
    const stripped = sentence
      .replace(/^i(?:'ve been|'m| am| keep| have been)\s+/i, '')
      .trim();
    if (feelingStartRe.test(stripped) && sentences.length > 1) continue;
    if (stripped.length <= 80) return stripped;
    const cut = stripped.slice(0, 80);
    const lastSpace = cut.lastIndexOf(' ');
    return lastSpace > 20 ? cut.slice(0, lastSpace) : cut;
  }

  const first = sentences[0] || input;
  const stripped = first.replace(/^i(?:'ve been|'m| am| keep| have been)\s+/i, '').trim();
  if (stripped.length <= 80) return stripped;
  const cut = stripped.slice(0, 80);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 20 ? cut.slice(0, lastSpace) : cut;
}

// ─── Context enrichment ───────────────────────────────────────────────────────

export function enrichContext(input: string): Context {
  const lower = input.toLowerCase();
  return {
    mentionsTravel: /\b(travel(?:led|ing|s)?|commut|back and forth|back-and-forth|journey|train|bus|driv|on the road|long way|far away|hour.? (to|from)|transit|getting there|getting home|distance)\b/.test(lower),
    mentionsFatigue: /\b(tired|exhaust|drained|burnout|burnt out|no energy|run down|depleted|worn out|running on empty)\b/.test(lower),
    mentionsLowEnergy: /\b(blah|numb|flat|hollow|void|disconnected|switched off)\b|(feel(ing)? empty|feel(ing)? nothing|feel(ing)? numb|everything feels flat|can'?t feel anything|not feeling anything|low energy|no energy at all)/.test(lower),
  };
}

// ─── Source term extraction (SOURCE LOCK RULE) ───────────────────────────────
// Extracts the user's own words for deepening + untangle construction.
// Pattern type = DIRECTION only. Content = built from user's actual input.
//
// Each field tracks whether it came from the user's text (fromUser: true)
// or fell back to a default (fromUser: false).
// Generation collapses to the vague path when no user terms are present.

interface SourceTerm {
  value: string;
  fromUser: boolean;
}

interface SourceTerms {
  feeling: SourceTerm;   // user's own feeling/state word
  action: SourceTerm;    // what they described doing or experiencing
  context: SourceTerm;   // key subject, target, or situation they named
}

/** Count how many terms were actually extracted from user input (not fallback). */
function userTermCount(t: SourceTerms): number {
  return [t.feeling.fromUser, t.action.fromUser, t.context.fromUser].filter(Boolean).length;
}

/**
 * SOURCE DEPENDENCY RULE enforcement.
 * Checks that at least one user-derived term appears in the generated output.
 * If output contains none of the user's actual words → it is invalid.
 */
function hasSourceDependency(output: string, t: SourceTerms): boolean {
  const lower = output.toLowerCase();
  const userTerms = [t.feeling, t.action, t.context]
    .filter(term => term.fromUser)
    .map(term => term.value.toLowerCase());
  if (userTerms.length === 0) return false;
  return userTerms.some(term => lower.includes(term));
}

/**
 * Extracts the primary feeling word from user input.
 * Used to preserve emotional continuity across deepening rounds.
 * Returns '' if no feeling word is found.
 */
export function extractPrimaryFeeling(input: string): string {
  const m = input.match(
    /\b(burnt out|running on empty|worn out|nothing left|run down|depleted|exhausted|drained|empty|hollow|numb|flat|blah|tired|low|off|lost|stuck|disconnected|overwhelmed|frustrated|stressed)\b/i,
  );
  return m ? m[0].toLowerCase() : '';
}

function extractSourceTerms(input: string, signalType: DominantSignalType): SourceTerms {
  // Feeling/state words — depletion first (more specific), then frustration/anxiety/sadness
  const feelingM = input.match(
    /\b(burnt out|running on empty|worn out|nothing left|run down|depleted|exhausted|drained|empty|hollow|numb|flat|blah|tired|low|off|lost|stuck|disconnected|frustrated|stressed|anxious|angry|sad|lonely|worried|scared|confused|guilty|annoyed|irritated|overwhelmed|helpless|defeated|hopeless)\b/i,
  );
  const feeling: SourceTerm = feelingM
    ? { value: feelingM[0].toLowerCase(), fromUser: true }
    : { value: 'drained', fromUser: false };

  switch (signalType) {
    case 'obligation-travel': {
      const travelM = input.match(
        /\b(drove|drove up|drove down|flew|traveled|travelled|traveling|commuted|made the drive|made the trip|took the train|took a flight|went up|went back)\b/i,
      );
      const eventM = input.match(
        /\b(wedding|funeral|function|anniversary|birthday|party|reunion|ceremony|celebration|event|gathering)\b/i,
      );
      const familyM = input.match(
        /\b(family|parents|mum|mom|dad|mother|father|sister|brother|siblings|relatives|in-?laws|grandparents)\b/i,
      );
      const eventRef  = eventM?.[0]?.toLowerCase() ?? null;
      const familyRef = familyM?.[0]?.toLowerCase() ?? null;
      return {
        feeling,
        action:  travelM  ? { value: travelM[0].toLowerCase(), fromUser: true }
                          : { value: 'went', fromUser: false },
        context: eventRef  ? { value: eventRef, fromUser: true }
               : familyRef ? { value: `${familyRef} thing`, fromUser: true }
                           : { value: 'the occasion', fromUser: false },
      };
    }

    case 'daily-drain': {
      const commuteM   = input.match(/\b(commute|drive|train|bus|travel(?:led|ing|s)?|journey|ride|back and forth)\b/i);
      const frequencyM = input.match(/\b(every day|each day|daily|all week|constantly|always|every morning|every night|twice a day)\b/i);
      return {
        feeling,
        action:  commuteM   ? { value: commuteM[0].toLowerCase(),   fromUser: true }
                            : { value: 'commute', fromUser: false },
        context: frequencyM ? { value: frequencyM[0].toLowerCase(), fromUser: true }
                            : { value: 'every day', fromUser: false },
      };
    }

    case 'conflict-middle': {
      const positionM = input.match(/\b(caught|stuck|in the middle|pulled in|pulled between|handling)\b/i);
      const partiesM  = input.match(/\b(two people|both of them|both sides|manager and team|manager|team|partner|colleagues|everyone|them all)\b/i);
      return {
        feeling,
        action:  positionM ? { value: positionM[0].toLowerCase(), fromUser: true }
                           : { value: 'in the middle', fromUser: false },
        context: partiesM  ? { value: partiesM[0].toLowerCase(),  fromUser: true }
                           : { value: 'both sides', fromUser: false },
      };
    }

    case 'not-seen': {
      const notSeenM = input.match(/\b(judged|misunderstood|not heard|unseen|invisible|dismissed|ignored|not seen)\b/i);
      const whoM     = input.match(/\b(my team|my manager|my partner|my family|my friends|everyone|people|nobody|no one)\b/i);
      return {
        feeling: notSeenM ? { value: notSeenM[0].toLowerCase(), fromUser: true }
                          : feeling,
        action:  notSeenM ? { value: notSeenM[0].toLowerCase(), fromUser: true }
                          : { value: 'not heard', fromUser: false },
        context: whoM     ? { value: whoM[0].toLowerCase(), fromUser: true }
                          : { value: 'the people around you', fromUser: false },
      };
    }

    case 'running-low': {
      const depletionM = input.match(/\b(burnt out|exhausted|depleted|running on empty|worn out|run down|running low)\b/i);
      const sleepM     = input.match(/no sleep|couldn'?t sleep|barely slept|didn'?t sleep|can'?t sleep|no rest/i);
      const durationM  = input.match(/\b(for weeks|for months|a long time|for a while|ages|so long|all year|for days|for some time)\b/i);
      return {
        feeling: depletionM ? { value: depletionM[0].toLowerCase(), fromUser: true }
                            : feeling,
        action:  durationM  ? { value: durationM[0].toLowerCase(), fromUser: true }
                            : { value: 'for a while', fromUser: false },
        context: sleepM    ? { value: sleepM[0].toLowerCase(), fromUser: true }
               : durationM ? { value: durationM[0].toLowerCase(), fromUser: true }
                           : { value: 'for a while', fromUser: false },
      };
    }

    case 'pile-up': {
      const accumulantM = input.match(/\b(everything|all of it|work|tasks|demands|projects|responsibilities|things|it all)\b/i);
      const patternM    = input.match(/\b(piling up|stacking|building up|mounting|accumulating|adding up)\b/i);
      return {
        feeling,
        action:  patternM    ? { value: patternM[0].toLowerCase(),    fromUser: true }
                             : { value: 'piling up', fromUser: false },
        context: accumulantM ? { value: accumulantM[0].toLowerCase(), fromUser: true }
                             : { value: 'everything', fromUser: false },
      };
    }

    case 'flat-nothing': {
      const flatM = input.match(/\b(nothing|flat|empty|blah|numb|hollow|disconnected|switched off)\b/i);
      return {
        feeling: flatM ? { value: flatM[0].toLowerCase(), fromUser: true }
                       : { value: 'nothing', fromUser: false },
        action:  { value: 'nothing landing', fromUser: false },
        context: flatM ? { value: flatM[0].toLowerCase(), fromUser: true }
                       : { value: 'flat', fromUser: false },
      };
    }

    case 'compound': {
      // Extract the first concrete event (what started it) as 'action' — noun phrase form.
      // Extract the final depleting element (what it ended with) as 'context' — noun phrase form.
      // Both are nominalized so they fit naturally into deepening templates.
      const travelM  = input.match(/\b(travel(?:led|ing|s)?|commuted|drove|flew|made the trip)\b/i);
      const hecticM  = input.match(/\b(hectic|chaotic|non-?stop|packed|busy)\b/i);
      const sleepM   = input.match(/no sleep|couldn'?t sleep|barely slept|no rest/i);
      const depleteM = input.match(/\b(exhausted|drained|depleted|worn out|running on empty)\b/i);

      // Nominalize travel verbs so they work as subjects
      const travelNoun = travelM ? (() => {
        const v = travelM[0].toLowerCase();
        if (v === 'drove') return 'the drive';
        if (v === 'flew') return 'the flight';
        if (v === 'commuted') return 'the commute';
        return 'the travelling';
      })() : null;

      const action: SourceTerm = travelNoun
        ? { value: travelNoun, fromUser: true }
        : hecticM
        ? { value: `the ${hecticM[0].toLowerCase()} day`, fromUser: true }
        : { value: 'one thing after another', fromUser: false };

      // Context = the end state / depleting element
      const context: SourceTerm = sleepM
        ? { value: 'no sleep', fromUser: true }
        : depleteM
        ? { value: depleteM[0].toLowerCase(), fromUser: true }
        : hecticM
        ? { value: `the ${hecticM[0].toLowerCase()} day`, fromUser: true }
        : { value: 'no real recovery', fromUser: false };

      return { feeling, action, context };
    }

    default: {
      // Try to extract a person or situation the user named
      const personM  = input.match(/\b(boss|manager|partner|colleague|coworker|friend|family|work|job|future|career|money|health)\b/i);
      const situationM = input.match(/\b(relationship|situation|pressure|deadline|meeting|project|life|everything)\b/i);
      const contextRef = personM ?? situationM;
      return {
        feeling,
        action:  contextRef ? { value: contextRef[0].toLowerCase(), fromUser: true }
                            : { value: 'carrying this', fromUser: false },
        context: contextRef ? { value: contextRef[0].toLowerCase(), fromUser: true }
                            : { value: 'it', fromUser: false },
      };
    }
  }
}

// ─── Reflection term extraction ──────────────────────────────────────────────
// Broader extraction for reflection + deepening: pulls the user's feeling word
// and situational target/context. Separate from extractSourceTerms (which is
// optimised for untangle's structural templates).

interface ReflectionTerms {
  feeling: SourceTerm;  // frustrated, anxious, exhausted, sad, etc.
  target: SourceTerm;   // boss, work, future, family, etc.
}

// function reflectionTermCount(t: ReflectionTerms): number {
//  return [t.feeling.fromUser, t.target.fromUser].filter(Boolean).length;
// }

/** Convert adjective/verb feelings to noun form for templates that need "the X". */
function feelingAsNoun(f: string): string {
  const map: Record<string, string> = {
    frustrated: 'frustration', anxious: 'anxiety', exhausted: 'exhaustion',
    stressed: 'stress', angry: 'anger', confused: 'confusion', sad: 'sadness',
    lonely: 'loneliness', guilty: 'guilt', worried: 'worry', annoyed: 'annoyance',
    irritated: 'irritation', nervous: 'nervousness', defeated: 'defeat',
    helpless: 'helplessness', hopeless: 'hopelessness', ashamed: 'shame',
    resentful: 'resentment', pressured: 'pressure', trapped: 'feeling of being trapped',
    disconnected: 'disconnection', overwhelmed: 'overwhelm', invisible: 'invisibility',
    stuck: 'feeling of being stuck', lost: 'feeling of being lost',
    drained: 'depletion', depleted: 'depletion', 'burnt out': 'burnout',
    'running on empty': 'depletion', 'worn out': 'exhaustion', 'wiped out': 'exhaustion',
    low: 'low feeling', flat: 'flatness', numb: 'numbness',
    hollow: 'hollowness', blah: 'flatness', empty: 'emptiness',
    uneasy: 'unease', unsettled: 'unsettledness', restless: 'restlessness',
  };
  return map[f] ?? f;
}

function extractReflectionTerms(input: string, _signalType: DominantSignalType): ReflectionTerms {
  // Feeling — broad emotion words (multi-word first)
  const feelingM = input.match(
    /\b(burnt out|running on empty|worn out|nothing left|run down|not good enough|let down|left out|shut out|pushed away|given up|fed up|wiped out|depleted|exhausted|drained|empty|hollow|numb|flat|blah|tired|low|lost|stuck|disconnected|overwhelmed|frustrated|stressed|anxious|angry|scared|confused|sad|lonely|guilty|ashamed|worried|resentful|helpless|hopeless|defeated|annoyed|irritated|unsettled|restless|uneasy|nervous|tense|pressured|trapped|suffocated|invisible|dismissed|ignored)\b/i,
  );
  const feeling: SourceTerm = feelingM
    ? { value: feelingM[0].toLowerCase(), fromUser: true }
    : { value: '', fromUser: false };

  // Normalize "my X" → "your X" for second-person output
  const normaliseTarget = (raw: string): string =>
    raw.toLowerCase().replace(/^my\b/, 'your');

  // Target — multi-word context phrases first
  const targetMulti = input.match(
    /\b(my boss|my manager|my partner|my wife|my husband|my family|my parents|my mum|my mom|my dad|my kids|my children|my friend|my friends|my team|my colleague|my colleagues|my job|my work|my relationship|my health|my future|my past|my finances|my money|my career|my studies|my body|my weight|the commute|the workload|the pressure|the situation|the uncertainty|the news|the move|the change)\b/i,
  );
  if (targetMulti) {
    return { feeling, target: { value: normaliseTarget(targetMulti[0]), fromUser: true } };
  }

  // Target — single-word fallback
  const targetSingle = input.match(
    /\b(boss|manager|partner|wife|husband|family|parents|parent|mum|mom|dad|kids|children|friend|friends|team|colleague|colleagues|work|job|relationship|health|future|past|money|finances|school|career|commute|workload|pressure|travel|traveling|travelling|move|studies|exam|exams|interview|deadline)\b/i,
  );
  if (targetSingle) {
    return { feeling, target: { value: targetSingle[0].toLowerCase(), fromUser: true } };
  }

  return { feeling, target: { value: 'this', fromUser: false } };
}

// ─── Clarity check (NON-LINEAR FLOW RULE) ────────────────────────────────────
// Untangle is triggered by CLARITY, not step position.
//
// Clarity requires ALL THREE of:
//   1. A clear state (feeling word)
//   2. An external cause or context (event, situation, condition — NOT another feeling)
//   3. A structural relationship between them (sequence, accumulation, cause-effect)
//
// Rules:
//   - Feeling alone → NOT clear, even if multiple feelings are named
//   - Feeling + context but no relationship → NOT clear
//   - Flat/empty/blah without external context → NEVER clear (internal state only)
//   - Do NOT infer or assume missing context — if unsure → deepen
//
// Compound shortcut: two or more distinct event types in one input already
// satisfies all three requirements (events = context, ordering = relationship).

export function hasClarity(input: string): boolean {
  const wordCount = input.trim().split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 5) return false;

  // ── Category 1: Sequence / progression ────────────────────────────────────
  // User describes movement across time or across multiple events.
  const hasSequence =
    /\band then\b/i.test(input) ||
    /,\s*then\b/i.test(input) ||
    /\bwent from\b/i.test(input) ||
    /\bcame back\b/i.test(input) ||
    /\bstraight into\b/i.test(input) ||
    /\bback to back\b/i.test(input) ||
    (/\bafter\b/i.test(input) && !/\bafter all\b/i.test(input) && !/\bafter the fact\b/i.test(input));

  if (hasSequence) return true;

  // ── Category 2: Contrast / mismatch ───────────────────────────────────────
  // User expresses expectation vs reality.
  const hasContrast =
    /\b(thought i'?d|thought i would|expected (to|it)|was supposed to|meant to|planned to|hoping to)\b.{0,50}\b(but|and then|yet|instead|ended up)\b/i.test(input) ||
    /\bbut ended up\b/i.test(input);

  if (hasContrast) return true;

  // ── Category 3: Causal explanation ────────────────────────────────────────
  // User explains WHY — structural signal regardless of what they name.
  if (/\b(because|due to|partly because)\b/i.test(input)) return true;

  // ── Category 4: Directed state ────────────────────────────────────────────
  // User names a state AND points it at something: "feel X about/from Y".
  // Two sub-checks: verb-anchored ("feel/was/been ... about/from") and
  // feeling-word-anchored (catches "I'm anxious about X" where "am" is contracted).
  const hasFeeling =
    /\b(exhausted|drained|empty|tired|depleted|worn out|hollow|flat|blah|numb|burnt out|running on empty|nothing left|frustrated|overwhelmed|stressed|lost|stuck|disconnected|judged|misunderstood|low|off|struggling|drowning|heavy|anxious|worried|tense|irritable)\b/i.test(input);

  if (/\b(feel|feels|felt|feeling|am|was|been|getting)\b.{0,50}\b(about|from)\b/i.test(input)) return true;
  if (hasFeeling && /\b(about|from)\b.{3,}/i.test(input)) return true;

  // ── Category 5: Multiple elements ─────────────────────────────────────────
  // Any 2 of: event, feeling, consequence.
  // Keyword lists can SUPPORT detection here but are not the only path —
  // Categories 1–4 above handle structure without requiring keyword matches.
  const hasEvent =
    /\b(travel(?:led|ing|s)?|commut(?:e|ed|ing)|trip|flew|flight|drove|drive|journey)\b/i.test(input) ||
    /\b(work|job|boss|colleague|team|project|deadline|meeting|office|client|presentation|exam|interview|review|evaluation)\b/i.test(input) ||
    /\b(family|friend|partner|kids|child|parent|relationship|wedding|function|event|occasion|school|class)\b/i.test(input) ||
    /\b(hectic|chaotic|non-?stop|nonstop|busy|packed)\b/i.test(input);

  const hasConsequence =
    /no sleep|couldn'?t sleep|barely slept|didn'?t sleep|can'?t sleep|no rest/i.test(input) ||
    /\b(for weeks|for months|for days|in weeks|in months|over weeks|these past|past few|all week|all day|for so long|hasn'?t let up|hasn'?t stopped|no break)\b/i.test(input) ||
    /\b(left me|ended up|can'?t stop|won'?t stop)\b/i.test(input);

  const elementCount = [hasEvent, hasFeeling, hasConsequence].filter(Boolean).length;
  return elementCount >= 2;
}

// ─── Dominant signal detection ───────────────────────────────────────────────
// PRIMARY rule: detect ONE dominant signal. All generators anchor to it.
// Priority order = most immediate / most emotionally human first.

export type DominantSignalType =
  | 'flat-nothing'       // nothing landing, energy flat, blah/numb
  | 'obligation-travel'  // gave up personal time for family/duty trip
  | 'daily-drain'        // commute / work travel taking energy routinely
  | 'conflict-middle'    // caught between people / both sides
  | 'not-seen'           // unseen, judged, misunderstood
  | 'running-low'        // chronic fatigue / burnt out
  | 'pile-up'            // too much accumulating, overwhelm
  | 'compound'           // 2+ distinct sequential events — structure preserved, not collapsed
  | 'generic';           // no clear dominant signal

export interface DominantSignal {
  type: DominantSignalType;
  /** Compound only: ordered list of event-type tokens extracted from input */
  events?: string[];
  /** Compound only: overall theme driving the compound */
  dominantTheme?: 'depletion' | 'overload';
  /**
   * true when input is short / vague / non-specific.
   * Generators must stay at pattern level — no actors, events, or story inference.
   */
  isVague: boolean;
}

/**
 * EARLY STAGE UNCERTAINTY RULE:
 * If input is short, vague, or has no specific situation context,
 * the system must NOT infer a full situation.
 * Stay at the pattern level. Allow multiple interpretations.
 */
export function isVagueInput(input: string): boolean {
  const trimmed = input.trim();
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;

  // RULE: Any clear feeling word is a valid emotional signal → NOT vague.
  // Feeling words do not require situational context to be grounded.
  const hasFeelingWord =
    /\b(frustrated|stressed|anxious|angry|sad|lonely|worried|scared|confused|guilty|annoyed|irritated|overwhelmed|helpless|defeated|hopeless|exhausted|drained|burnt out|tired|low|numb|flat|blah|hollow|empty|lost|stuck|disconnected|worn out|depleted|running on empty|miserable|heartbroken|ashamed|embarrassed|resentful|fed up|pressured|unsettled|restless|uneasy|nervous)\b/i.test(input);
  if (hasFeelingWord) return false;

  // Explicit situational context — specific enough to anchor to
  const hasSpecificContext =
    /\b(travel(?:led|ing|s)?|commut|trip|flew|flight|drive|drove|back and forth)\b/i.test(input) ||
    /\b(work|job|boss|colleague|team|project|deadline|meeting|office|client|hectic)\b/i.test(input) ||
    /\b(family|friend|partner|kids|child|parent|relationship|wedding|function|event)\b/i.test(input) ||
    /\b(future|past|career|school|money|finances|health|move|exam|interview)\b/i.test(input) ||
    /\b(between|middle|caught|both sides|two people)\b/i.test(input) ||
    /\b(because|when i|after i|before i|since i|it happened|what happened)\b/i.test(input) ||
    /no sleep|couldn'?t sleep|barely slept|didn'?t sleep|can'?t sleep|sleep deprived|no rest/i.test(input);

  // Short AND no clear situational grounding → vague
  if (wordCount < 15 && !hasSpecificContext) return true;

  // Long but still no concrete context → vague
  if (wordCount < 25 && !hasSpecificContext) return true;

  return false;
}

export function detectDominantSignal(input: string): DominantSignal {
  const lower = input.toLowerCase();

  const vague = isVagueInput(input);

  // 0. COMPOUND — 2+ distinct sequential event types in a single input.
  // Must be checked BEFORE individual signals so structure is not collapsed.
  // Each event type is a distinct category: travel, high-activity, sleep-deprivation,
  // obligation, acute fatigue. Two or more → compound.
  {
    const compoundEvents = {
      travel:      /\b(travel(?:led|ing|s)?|commut|trip|flew|flight|drive|drove|journey)\b/i.test(input),
      hectic:      /\b(hectic|chaotic|non-?stop|busy day|back to back|no break|no gap|packed)\b/i.test(input),
      sleep:       /no sleep|couldn'?t sleep|barely slept|didn'?t sleep|can'?t sleep|no rest|sleep deprived/i.test(input),
      obligation:  /\b(family|function|wedding|funeral|event|occasion|relatives?|parents?)\b/i.test(input),
      acuteFatigue:/\b(exhausted|drained|depleted|worn out|running on empty)\b/i.test(input),
    };
    const activeTypes = Object.entries(compoundEvents)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (activeTypes.length >= 2) {
      // Build ordered event list (travel → obligation → hectic → sleep → fatigue)
      const ordered = ['travel', 'obligation', 'hectic', 'sleep', 'acuteFatigue']
        .filter(k => activeTypes.includes(k));
      const dominantTheme: 'depletion' | 'overload' =
        (compoundEvents.sleep || compoundEvents.acuteFatigue) ? 'depletion' : 'overload';
      return { type: 'compound', isVague: false, events: ordered, dominantTheme };
    }
  }

  // 1. Flat / nothing pulling (most immediate — felt right now)
  if (
    /\b(blah|numb|flat|hollow|void|disconnected|switched off)\b/.test(lower) ||
    /(feel(ing)? empty|feel(ing)? nothing|everything feels flat|not feeling anything|low energy|no energy)/.test(lower)
  ) {
    return { type: 'flat-nothing', isVague: vague };
  }

  // 2. Obligation travel — family/event trip that cost personal time
  if (
    /\b(family|function|wedding|funeral|event|occasion|relative|relatives|parents|parent)\b/.test(lower) &&
    /\b(travel(?:led|ing|s)?|flew|flight|drive|drove|back and forth|back-and-forth|commut|journey)\b/.test(lower)
  ) {
    return { type: 'obligation-travel', isVague: vague };
  }

  // 3. Conflict / caught in the middle
  if (
    /\b(between|both sides|caught|stuck in the middle|two people|multiple people|handling people|pulled in)\b/.test(lower)
  ) {
    return { type: 'conflict-middle', isVague: vague };
  }

  // 4. Not seen / unseen / judged
  if (
    /\b(judged|misunderstood|not heard|nobody gets|no one understands|unseen|invisible|not seen)\b/.test(lower)
  ) {
    return { type: 'not-seen', isVague: vague };
  }

  // 5. Chronic fatigue — mentioned explicitly (not tied to a single trip)
  if (
    /\b(exhausted|drained|burnt out|burnout|run down|running on empty|depleted|worn out)\b/.test(lower) ||
    /no sleep|couldn'?t sleep|barely slept|didn'?t sleep|can'?t sleep|sleep deprived|no rest/i.test(lower)
  ) {
    return { type: 'running-low', isVague: vague };
  }

  // 6. Daily commute / routine work travel
  if (
    /\b(commut|every day|daily|each day|back and forth|back-and-forth|so much travel|a lot of travel)\b/.test(lower)
  ) {
    return { type: 'daily-drain', isVague: vague };
  }

  // Any travel not already caught = daily-drain
  if (
    /\b(travel(?:led|ing|s)?|journey|on the road|getting there|getting home)\b/.test(lower)
  ) {
    return { type: 'daily-drain', isVague: vague };
  }

  // 7. Pile-up / overwhelm
  if (
    /\b(overwhelmed|too much|everything at once|all at once|piling up|stacking|so much|can'?t handle|hectic)\b/.test(lower)
  ) {
    return { type: 'pile-up', isVague: vague };
  }

  // 8. Tiredness without context
  if (/\b(tired|no energy)\b/.test(lower)) {
    return { type: 'running-low', isVague: vague };
  }

  return { type: 'generic', isVague: vague };
}

// ─── Intent layer ─────────────────────────────────────────────────────────────
// System decides intent before generation. LLM (generators) only handles phrasing.

interface ReflectionIntent {
  /** What to anchor the user in — their situation, not their feeling */
  anchor: string;
}

interface DeepeningIntent {
  /** The vague reading to move away from */
  fromVague: string;
  /** The more specific direction to move toward */
  toSpecific: string;
}

interface UntangleIntent {
  /** "It's not just X" — the surface reading */
  notJust: string;
  /** "It's that Y" — the actual pattern */
  butRather: string;
  /** "And that's why it feels Z" — the consequence */
  therefore: string;
}

interface ResponseIntent {
  reflection: ReflectionIntent;
  deepening: DeepeningIntent;
  untangle: UntangleIntent;
}

/**
 * System-controlled intent layer.
 * Pattern is decided here. Generators work within these constraints.
 */
export function buildIntent(pattern: PatternType, context: Context): ResponseIntent {
  if (context.mentionsLowEnergy) {
    return {
      reflection: {
        anchor: 'nothing landing, things feeling flat',
      },
      deepening: {
        fromVague: 'something being wrong',
        toSpecific: 'nothing generating pull right now',
      },
      untangle: {
        notJust: "that you're feeling off",
        butRather: 'right now, nothing is pulling your energy in any direction — and when there\'s no pull, everything feels like effort',
        therefore: "you don't have to fix this — you just have to wait it out",
      },
    };
  }

  switch (pattern) {
    case 'conflict':
      return {
        reflection: {
          anchor: 'being in the middle, absorbing from both sides',
        },
        deepening: {
          fromVague: 'the pressure of being in the middle',
          toSpecific: 'having lost your own footing in it',
        },
        untangle: {
          notJust: "you're stuck between them",
          butRather: "you've been holding both sides without keeping any room for where you actually land in it",
          therefore: "you're not in your own equation — and that's what makes it so heavy",
        },
      };

    case 'overwhelm':
      if (context.mentionsTravel) {
        return {
          reflection: {
            anchor: 'commute taking energy before the day starts, and again at the end',
          },
          deepening: {
            fromVague: 'how far you travel',
            toSpecific: 'neither end of the day giving you any recovery time',
          },
          untangle: {
            notJust: "the volume of what you're managing",
            butRather: 'the travel itself is part of the load — and it comes before the day has even started',
            therefore: "you're always already behind",
          },
        };
      }
      if (context.mentionsFatigue) {
        return {
          reflection: {
            anchor: 'running on low, tank depleted not just today',
          },
          deepening: {
            fromVague: 'needing rest',
            toSpecific: "what's been going out hasn't been matched by what's coming back in",
          },
          untangle: {
            notJust: "you're tired",
            butRather: "you've been giving more than you've been getting back for long enough that the gap is showing",
            therefore: "a weekend doesn't fix it",
          },
        };
      }
      return {
        reflection: {
          anchor: 'everything pressing at once, no gap between demands',
        },
        deepening: {
          fromVague: 'how much there is',
          toSpecific: "there's no real break in it — no moment to actually set any of it down",
        },
        untangle: {
          notJust: "there's a lot",
          butRather: "you've been absorbing it all without any space built in to recover",
          therefore: "it feels like a deficit, not just a busy stretch",
        },
      };

    case 'judgment':
      return {
        reflection: {
          anchor: 'not feeling seen or received, carrying it without support',
        },
        deepening: {
          fromVague: 'what happened',
          toSpecific: 'having to carry it without feeling like anyone was really with you in it',
        },
        untangle: {
          notJust: 'you feel misunderstood',
          butRather: "you've been trying to make sense of something difficult without feeling held by the people around you",
          therefore: "it's been so much harder to carry",
        },
      };

    default:
      return {
        reflection: {
          anchor: "something sitting with you that doesn't have a name yet",
        },
        deepening: {
          fromVague: 'the situation itself',
          toSpecific: "what's underneath it that hasn't fully landed yet",
        },
        untangle: {
          notJust: 'one thing',
          butRather: "something hasn't had space to fully land yet — and that's part of why it keeps coming back",
          therefore: 'giving it some room is already doing something',
        },
      };
  }
}

// ─── Output validation ────────────────────────────────────────────────────────

const BANNED_OUTPUT_PHRASES = [
  // Generic filler (note: "it can feel like" / "it can start to feel" are ALLOWED in deepening —
  // they are the correct register for experience-only exploration. Banned from untangle only.)
  'there\'s a kind of',
  'that makes sense',
  'i hear you',
  'it\'s not always easy',
  'sometimes it feels',
  'low-activation state',
  'emotional spike',
  // Abstract / refill language
  'start neutral',
  'earn energy back',
  'earn any back',
  // Passive hold language
  'you don\'t have to fix this',
  'just sit with it',
  'just sitting with it',
  'wait it out',
  'sustainable',
  // DEEPENING GROUNDING RULE — banned abstract layer phrases
  'on the surface',
  'underneath it',
  'what\'s underneath',
  'what\'s happening underneath',
  'deeper level',
  // UNTANGLE SAFETY RULE — banned new-story phrases
  'anyone who wasn\'t there',
  'from the outside',
  'that usually passes',
  'talking about it starts to help',
  'this is already a start',
  // SOURCE DEPENDENCY RULE — banned generic filler that passes without user input
  'whatever it is',
  'something is there',
  'it keeps coming back',
  'sit down with it and',
  'something has been sitting',
  'been sitting with you',
  'without much room to land',
  'what it\'s been doing to you',
  'it hasn\'t had space',
  'stays with you',
  'sit down with this',
  // LANGUAGE RULE — banned abstract / metaphor phrases (Rule 8)
  'it adds up',
  'been adding up',
  'could settle',
  'could land',
  'space to land',
  'sits with you',
];

interface ValidationResult {
  valid: boolean;
  issues: string[];
}

export function validateOutput(reflection: string, deepening: string, untangle: string): ValidationResult {
  const issues: string[] = [];
  const fields = { reflection, deepening, untangle };

  for (const [field, text] of Object.entries(fields)) {
    const lower = text.toLowerCase();
    for (const phrase of BANNED_OUTPUT_PHRASES) {
      if (lower.includes(phrase)) {
        issues.push(`[${field}] contains banned phrase: "${phrase}"`);
      }
    }
  }

  // Untangle must be ≤ 60 words (stripped of markdown)
  const untangleWords = untangle.replace(/\*\*/g, '').trim().split(/\s+/).length;
  if (untangleWords > 65) {
    issues.push(`[untangle] too long: ${untangleWords} words (max 65)`);
  }

  // Reflection and deepening must not start the same way
  const reflStart = reflection.split(' ').slice(0, 5).join(' ').toLowerCase();
  const deepStart = deepening.split(' ').slice(0, 5).join(' ').toLowerCase();
  if (reflStart === deepStart) {
    issues.push('[deepening] starts the same as reflection');
  }

  return { valid: issues.length === 0, issues };
}

// ─── Banned phrase cleaner ────────────────────────────────────────────────────

export function cleanGenericPhrases(text: string): string {
  return text
    .replace(/that makes sense[.,]?\s*/gi, '')
    .replace(/i hear you[.,]?\s*/gi, '')
    .replace(/it'?s not always easy[.,]?\s*/gi, '')
    .replace(/sometimes it feels like\s*/gi, '')
    .trim();
}

// ─── Generator functions ──────────────────────────────────────────────────────
// Each generator receives the system-decided pattern and intent.
// LLM role: phrase the intent. System role: decide the intent.

/**
 * Reflection — anchors user in their situation.
 * Driven by dominantSignal (PRIMARY rule). Does NOT copy signal verbatim.
 */
export function generateReflection(
  _pattern: PatternType,
  _signal: string,
  _context: Context,
  dominantSignal: DominantSignal,
  rawInput: string,
): string {
  // Extract user's feeling + target — always first, before any vague check.
  // A feeling word is a valid signal on its own; it must never be discarded.
  const rt = extractReflectionTerms(rawInput, dominantSignal.type);
  const hasFeeling = rt.feeling.fromUser;
  const hasTarget  = rt.target.fromUser;
  const f  = rt.feeling.value;
  const F  = f.charAt(0).toUpperCase() + f.slice(1); // capitalised form
  const tgt = rt.target.value;
  const Tgt = tgt.charAt(0).toUpperCase() + tgt.slice(1);

  // EARLY STAGE UNCERTAINTY RULE: stay at pattern level only when NO feeling
  // was extracted. If a feeling word exists it drives the response regardless
  // of whether the input has situational context.
  if (dominantSignal.isVague && !hasFeeling) {
    return `Something's there — even if it doesn't have a clear shape yet.`;
  }

  // ── Feeling + target ─────────────────────────────────────────────────────────
  if (hasFeeling && hasTarget) {
    switch (dominantSignal.type) {
      case 'flat-nothing':
        return `When even ${tgt} isn't giving anything back, ${f} is where you end up.`;
      case 'obligation-travel':
        return `Giving your time to ${tgt} and still feeling ${f} after — that's its own kind of drain.`;
      case 'daily-drain':
        return `When ${tgt} takes from you before the day even starts, feeling ${f} is exactly where that leads.`;
      case 'conflict-middle':
        return `Being caught between ${tgt} doesn't leave much room — no wonder you're feeling ${f}.`;
      case 'not-seen':
        return `Feeling ${f} when ${tgt} isn't really seeing it — that's a lot to carry on your own.`;
      case 'running-low':
        return `${F} like this builds — especially when ${tgt} has been pulling on you for a while.`;
      case 'pile-up':
        return `When ${tgt} keeps coming without a gap, ${f} is exactly where that lands.`;
      case 'compound':
        return `Going from one thing straight into the next with ${tgt} in it — feeling ${f} by the end of that is real.`;
      default: {
        const forwardFeelings = ['anxious', 'worried', 'nervous', 'scared', 'uneasy', 'unsettled', 'restless'];
        const frustrationFeelings = ['frustrated', 'annoyed', 'irritated', 'angry', 'resentful', 'fed up', 'pressured'];
        if (forwardFeelings.includes(f)) {
          return `${F} around ${tgt} tends to sit heavy — even when nothing specific has happened yet.`;
        }
        if (frustrationFeelings.includes(f)) {
          return `Feeling ${f} about ${tgt} — that's not a small thing to absorb.`;
        }
        return `${F} around ${tgt} — that kind of weight doesn't just appear out of nowhere.`;
      }
    }
  }

  // ── Feeling only ─────────────────────────────────────────────────────────────
  if (hasFeeling) {
    const forwardFeelings = ['anxious', 'worried', 'nervous', 'scared', 'uneasy', 'unsettled', 'restless'];
    const frustrationFeelings = ['frustrated', 'annoyed', 'irritated', 'angry', 'resentful', 'fed up', 'pressured'];
    switch (dominantSignal.type) {
      case 'flat-nothing':
        return `${F} like that can land even without a clear reason — it just quietly occupies the space.`;
      case 'running-low':
        return `${F} like this tends to build quietly — the kind you don't fully notice until it's already heavy.`;
      case 'pile-up':
        return `When everything keeps coming without a real gap, ${f} is where it ends up.`;
      case 'compound':
        return `When things just keep stacking without a pause, ${f} is what's left at the end of it.`;
      default:
        if (forwardFeelings.includes(f)) {
          return `${F} without something specific to point it at can be hard to settle — it just keeps circling.`;
        }
        if (frustrationFeelings.includes(f)) {
          return `That kind of ${f} — without an obvious place to put it — just sits.`;
        }
        return `That kind of ${f} — the quiet kind that doesn't announce itself — tends to stay.`;
    }
  }

  // ── Target only ──────────────────────────────────────────────────────────────
  if (hasTarget) {
    switch (dominantSignal.type) {
      case 'obligation-travel':
        return `Giving your time to ${tgt} costs more than it looks — and you came back with less than you started with.`;
      case 'daily-drain':
        return `${Tgt} takes something out of you before the day has even started.`;
      case 'conflict-middle':
        return `Being in the middle of ${tgt} means absorbing from both sides — there's not much room left for where you actually land.`;
      case 'not-seen':
        return `When ${tgt} isn't really seeing it, you're not just dealing with the situation — you're dealing with it alone.`;
      default:
        return `There's a weight to ${tgt} — even when it's hard to put into words.`;
    }
  }

  // ── Fallback — no user terms extracted ──────────────────────────────────────
  switch (dominantSignal.type) {
    case 'flat-nothing':
      return `When nothing is really landing — not the things you'd usually reach for — that's its own kind of weight.`;
    case 'obligation-travel':
      return `You gave up your whole day to be there — and came back with less than you started with.`;
    case 'daily-drain':
      return `That commute takes something out of you before the day has even started. And again at the end.`;
    case 'conflict-middle':
      return `Being in the middle means absorbing pressure from both sides — without much room left for what you actually think.`;
    case 'not-seen':
      return `When the people around you aren't really seeing it, you're not just dealing with the situation — you're dealing with it alone.`;
    case 'running-low':
      return `This isn't ordinary tiredness — you've been running low for a while now.`;
    case 'pile-up':
      return `When this much is pressing in at once, there's no real gap between demands.`;
    case 'compound':
      return `You went from one thing straight into the next — and there wasn't really a point where it slowed down.`;
    default:
      return `Something's been there — even if it doesn't quite have a name yet.`;
  }
}

/**
 * Deepening — a single continuation line that extends the reflection.
 * ONE line only. No insight, no resolution, no question.
 * Tone: grounded, simple, easy to read in an overwhelmed state.
 */
export function generateDeepening(
  _pattern: PatternType,
  _signal: string,
  _context: Context,
  dominantSignal: DominantSignal,
  rawInput: string,
): string {
  const rt = extractReflectionTerms(rawInput, dominantSignal.type);
  const hasFeeling = rt.feeling.fromUser;
  const f = rt.feeling.value;

  if (hasFeeling) {
    switch (dominantSignal.type) {
      case 'flat-nothing':    return `Like nothing quite reaches you right now.`;
      case 'obligation-travel': return `Like you came back with less than you went with.`;
      case 'daily-drain':     return `Like the day starts with a deficit before it's even begun.`;
      case 'conflict-middle': return `Like there's no clear space in it that's actually yours.`;
      case 'not-seen':        return `Like you've been carrying something no one's really acknowledged.`;
      case 'running-low':     return `Like rest doesn't quite reach where it needs to.`;
      case 'pile-up':         return `Like there's never a real gap to set any of it down.`;
      case 'compound':        return `Like things kept stacking before you had a chance to catch up.`;
      default: {
        const forwardFeelings = ['anxious', 'worried', 'nervous', 'scared', 'uneasy', 'unsettled', 'restless'];
        if (forwardFeelings.includes(f)) return `Like something's bracing even when nothing's happened yet.`;
        return `Like it's been there longer than just today.`;
      }
    }
  }

  switch (dominantSignal.type) {
    case 'flat-nothing':    return `Like nothing quite reaches you right now.`;
    case 'obligation-travel': return `Like you came back with less than you went with.`;
    case 'daily-drain':     return `Like the day starts with a deficit before it's even begun.`;
    case 'conflict-middle': return `Like there's no clear space in it that's actually yours.`;
    case 'not-seen':        return `Like you've been carrying something no one's really acknowledged.`;
    case 'running-low':     return `Like rest doesn't quite reach where it needs to.`;
    case 'pile-up':         return `Like there's never a real gap to set any of it down.`;
    case 'compound':        return `Like things kept stacking before you had a chance to catch up.`;
    default:                return `Like something's there — even if it doesn't have a shape yet.`;
  }
}

/**
 * Deepening chips — 2 expressive chips generated from user input.
 * Format: "it's more like [felt experience]"
 * Must reflect emotional texture of the input — NOT generic labels.
 * Combined with 2 static chips ("yeah… part of it", "something else") in the UI.
 */
export function generateDeepeningChips(
  dominantSignal: DominantSignal,
  rawInput: string,
): ChipOption[] {
  const rt = extractReflectionTerms(rawInput, dominantSignal.type);
  const hasFeeling = rt.feeling.fromUser;
  const hasTarget  = rt.target.fromUser;
  const f = rt.feeling.value;
  const tgt = rt.target.value;

  // Dynamic path — both feeling and target
  if (hasFeeling && hasTarget) {
    switch (dominantSignal.type) {
      case 'flat-nothing':
        return [
          { id: 'deep-expressive-1', label: `it's more like nothing is landing right now` },
          { id: 'deep-expressive-2', label: `it's more like I'm just going through the motions` },
        ];
      case 'obligation-travel':
        return [
          { id: 'deep-expressive-1', label: `it's more like I gave more than I got back` },
          { id: 'deep-expressive-2', label: `it's more like I showed up but it cost me` },
        ];
      case 'daily-drain':
        return [
          { id: 'deep-expressive-1', label: `it's more like I'm always starting behind` },
          { id: 'deep-expressive-2', label: `it's more like the ${tgt} takes more than it should` },
        ];
      case 'conflict-middle':
        return [
          { id: 'deep-expressive-1', label: `it's more like I've lost track of where I actually stand` },
          { id: 'deep-expressive-2', label: `it's more like I'm absorbing from both sides` },
        ];
      case 'not-seen':
        return [
          { id: 'deep-expressive-1', label: `it's more like I'm carrying it without anyone noticing` },
          { id: 'deep-expressive-2', label: `it's more like I've stopped expecting ${tgt} to get it` },
        ];
      case 'running-low':
        return [
          { id: 'deep-expressive-1', label: `it's more like rest doesn't touch it` },
          { id: 'deep-expressive-2', label: `it's more like it's been going on too long` },
        ];
      case 'pile-up':
        return [
          { id: 'deep-expressive-1', label: `it's more like everything keeps coming at once` },
          { id: 'deep-expressive-2', label: `it's more like there's no gap to actually breathe` },
        ];
      case 'compound':
        return [
          { id: 'deep-expressive-1', label: `it's more like I never got a real pause` },
          { id: 'deep-expressive-2', label: `it's more like I went from one thing straight into the next` },
        ];
      default: {
        const forwardFeelings = ['anxious', 'worried', 'nervous', 'scared', 'uneasy', 'unsettled', 'restless'];
        const frustrationFeelings = ['frustrated', 'annoyed', 'irritated', 'angry', 'resentful', 'fed up', 'pressured'];
        if (forwardFeelings.includes(f)) {
          return [
            { id: 'deep-expressive-1', label: `it's more like I can't switch off` },
            { id: 'deep-expressive-2', label: `it's more like something's always bracing` },
          ];
        }
        if (frustrationFeelings.includes(f)) {
          return [
            { id: 'deep-expressive-1', label: `it's more like I keep showing up and it doesn't land` },
            { id: 'deep-expressive-2', label: `it's more like I'm doing everything right and it doesn't matter` },
          ];
        }
        return [
          { id: 'deep-expressive-1', label: `it's more like it's been sitting with me` },
          { id: 'deep-expressive-2', label: `it's more like I can't quite put it down` },
        ];
      }
    }
  }

  // Feeling only
  if (hasFeeling) {
    switch (dominantSignal.type) {
      case 'flat-nothing':
        return [
          { id: 'deep-expressive-1', label: `it's more like nothing is landing right now` },
          { id: 'deep-expressive-2', label: `it's more like I'm just going through the motions` },
        ];
      case 'running-low':
        return [
          { id: 'deep-expressive-1', label: `it's more like rest doesn't touch it` },
          { id: 'deep-expressive-2', label: `it's more like it's been building for a long time` },
        ];
      case 'pile-up':
        return [
          { id: 'deep-expressive-1', label: `it's more like everything keeps piling up` },
          { id: 'deep-expressive-2', label: `it's more like there's no gap to breathe` },
        ];
      default: {
        const forwardFeelings = ['anxious', 'worried', 'nervous', 'scared', 'uneasy', 'unsettled', 'restless'];
        if (forwardFeelings.includes(f)) {
          return [
            { id: 'deep-expressive-1', label: `it's more like I can't switch off` },
            { id: 'deep-expressive-2', label: `it's more like something's always bracing` },
          ];
        }
        return [
          { id: 'deep-expressive-1', label: `it's more like it won't quite settle` },
          { id: 'deep-expressive-2', label: `it's more like it keeps coming back` },
        ];
      }
    }
  }

  // Signal only — no extracted terms
  switch (dominantSignal.type) {
    case 'flat-nothing':
      return [
        { id: 'deep-expressive-1', label: `it's more like nothing is landing right now` },
        { id: 'deep-expressive-2', label: `it's more like I'm just going through the motions` },
      ];
    case 'obligation-travel':
      return [
        { id: 'deep-expressive-1', label: `it's more like I gave more than I got back` },
        { id: 'deep-expressive-2', label: `it's more like it cost more than it looked like it would` },
      ];
    case 'daily-drain':
      return [
        { id: 'deep-expressive-1', label: `it's more like I'm always starting behind` },
        { id: 'deep-expressive-2', label: `it's more like it takes something before the day's even begun` },
      ];
    case 'conflict-middle':
      return [
        { id: 'deep-expressive-1', label: `it's more like I've lost track of where I actually stand` },
        { id: 'deep-expressive-2', label: `it's more like I'm absorbing from both sides` },
      ];
    case 'not-seen':
      return [
        { id: 'deep-expressive-1', label: `it's more like I'm carrying it without anyone noticing` },
        { id: 'deep-expressive-2', label: `it's more like I've stopped expecting anyone to get it` },
      ];
    case 'running-low':
      return [
        { id: 'deep-expressive-1', label: `it's more like rest doesn't touch it` },
        { id: 'deep-expressive-2', label: `it's more like it's been going on too long` },
      ];
    case 'pile-up':
      return [
        { id: 'deep-expressive-1', label: `it's more like everything keeps coming at once` },
        { id: 'deep-expressive-2', label: `it's more like there's no gap to actually breathe` },
      ];
    case 'compound':
      return [
        { id: 'deep-expressive-1', label: `it's more like I never got a real pause` },
        { id: 'deep-expressive-2', label: `it's more like I went from one thing straight into the next` },
      ];
    default:
      return [
        { id: 'deep-expressive-1', label: `it's more like something hasn't landed yet` },
        { id: 'deep-expressive-2', label: `it's more like I can't quite name what it is` },
      ];
  }
}

/**
 * Untangle — reveals the core insight.
 * Driven by dominantSignal for DIRECTION only. Content built from rawInput.
 *
 * Structure (spoken, light):
 *   Line 1 → recognition ("It's not just X")
 *   Line 2 → what actually happened
 *   Line 3 → why it feels the way it does (bold)
 *
 * SOURCE LOCK RULE:
 * - Must be constructed ONLY from words the user used or direct logical extensions
 * - Must NOT use pattern templates blindly or insert pre-written interpretations
 * - Must NOT introduce new people, new intentions, or new story elements
 * - extractSourceTerms() pulls user's exact words — pattern = angle, NOT content
 * - Test: if you remove the user input, the untangle should not exist
 */
export function generateUntangle(
  _pattern: PatternType,
  _signal: string,
  _context: Context,
  dominantSignal: DominantSignal,
  rawInput: string,
): string {
  // EARLY STAGE UNCERTAINTY RULE: vague input → cannot form grounded untangle.
  // hasClarity() should block this path from ever being shown — but kept as safe fallback.
  if (dominantSignal.isVague) {
    return `It's not just one thing.\n\n` +
      `There isn't a clear word for it yet — and that's part of why it feels heavy.\n\n` +
      `**You don't need to name it to know it's real.**`;
  }

  // SOURCE LOCK: extract terms directly from the user's input
  const t = extractSourceTerms(rawInput, dominantSignal.type);

  // SOURCE DEPENDENCY RULE (Rules 7 + 8):
  // If no user terms extracted → DO NOT generate untangle.
  // hasClarity() gates this before showing — return empty so caller knows it's invalid.
  if (userTermCount(t) === 0) {
    return '';
  }

  // PRIORITY SIGNAL DETECTION
  // Scans raw input for emotionally specific signals that override the generic switch.
  // Priority order: (1) explicit emotional signals → (2) inferred deeper patterns → (3) generic.
  // const lower = rawInput.toLowerCase();

  // Relational need: user is explicitly naming unmet support, intimacy, or connection.
  const hasRelationalNeed =
    /\b(support|supported|there for me|listen|heard|understand|close|connection|intimacy|presence|someone to talk to|needs? (me|them|you|him|her)|needing (you|him|her|them)|want(ed|s)? (more |emotional )?(support|connection|intimacy)|feel alone with (it|this|them))\b/i.test(rawInput) ||
    /\b(partner|husband|wife|boyfriend|girlfriend|spouse)\b/i.test(rawInput) && /\b(need|want|wish|miss|not there|doesn't|don't|not getting)\b/i.test(rawInput);

  // Identity pain: user names failure, falling behind, not enough, comparison to others.
  const hasIdentityPain =
    /\b(fail(ed|ing|ure)?|behind|falling behind|not enough|behind where|should be|supposed to (be|have)|everyone else|falling short|missed|let (myself|everyone|them) down|disappointed in myself|can't keep up|losing ground|mediocre|wasted|nothing to show)\b/i.test(rawInput);

  const feeling = t.feeling.value;

  // RELATIONAL + IDENTITY COMBINED: both signals present → name both dimensions.
  if (hasRelationalNeed && hasIdentityPain) {
    const relationalTarget = rawInput.match(/\b(partner|husband|wife|boyfriend|girlfriend|spouse|friend|family|them|him|her|people)\b/i)?.[0]?.toLowerCase() ?? 'the people around you';
    return (
      `It's not just that you're ${feeling}.\n\n` +
      `Part of you feels like you're falling short — and part of you is needing support from ${relationalTarget} to get through it.\n\n` +
      `**When you're not getting either, it compounds into something harder to name.**`
    );
  }

  // RELATIONAL NEED: user is asking for connection or support, not getting it.
  if (hasRelationalNeed) {
    const relationalTarget = rawInput.match(/\b(partner|husband|wife|boyfriend|girlfriend|spouse|friend|family|them|him|her|people)\b/i)?.[0]?.toLowerCase() ?? 'someone';
    return (
      `It's not just that you're ${feeling}.\n\n` +
      `It's that you're needing something from ${relationalTarget} — and not getting it.\n\n` +
      `**That gap between what you need and what's actually there — that's what's making this hard.**`
    );
  }

  // IDENTITY PAIN: user is naming failure, falling behind, or not being enough.
  if (hasIdentityPain) {
    return (
      `It's not just that you're ${feeling}.\n\n` +
      `It's that part of you feels like you're falling behind — and doesn't know how to catch up.\n\n` +
      `**That's a different kind of heavy. It's not just what happened. It's what you're telling yourself about it.**`
    );
  }

  let output: string;

  switch (dominantSignal.type) {
    case 'flat-nothing':
      // Deeper layer: flatness isn't the absence of feeling — it's what happens when you've been
      // running without enough to replenish. You've gone through the motions so long nothing lands.
      output =
        `It's not just that things feel ${t.feeling.value}.\n\n` +
        `It's that you've been going through the motions for long enough that nothing is actually reaching you anymore.\n\n` +
        `**That's not emptiness. That's what depletion looks like from the inside.**`;
      break;

    case 'obligation-travel':
      // Deeper layer: the cost isn't tiredness — it's that you went for someone else's moment,
      // with nothing in it for you, and came back with less than you left with.
      output =
        `It wasn't just ${t.feeling.value} after ${t.context.value}.\n\n` +
        `It's that you showed up for something that wasn't really for you — and came back emptier than when you left.\n\n` +
        `**That kind of giving doesn't show up anywhere. But you feel it.**`;
      break;

    case 'daily-drain':
      // Deeper layer: the problem isn't the commute itself — it's that you're paying a cost
      // before the day even begins, with nothing to show for it and no way to recover.
      output =
        `It's not just that the ${t.action.value} is draining.\n\n` +
        `It's that you're spending the best part of yourself getting there — and arriving with less than you need.\n\n` +
        `**That's not a commute problem. That's a cost nobody sees you paying.**`;
      break;

    case 'conflict-middle':
      // Deeper layer: the problem isn't being caught between people — it's that you've
      // disappeared from the equation. There's no room for where you actually stand.
      output =
        `It's not just being ${t.action.value} between ${t.context.value}.\n\n` +
        `It's that you've become the one who holds it together — and nobody's asking how you feel about it.\n\n` +
        `**That's what makes it invisible. You're in it, but you're not in it for yourself.**`;
      break;

    case 'not-seen':
      // Deeper layer: not being seen by anyone is hard. Not being seen by the people
      // who are supposed to see you — that's what makes you question yourself.
      output =
        `It's not just feeling ${t.action.value}.\n\n` +
        `It's that ${t.context.value} are the ones not getting it — and these are the people who matter.\n\n` +
        `**When the people closest to it don't see it, you start wondering if it's even real.**`;
      break;

    case 'running-low':
      // Deeper layer: the exhaustion isn't just physical — it's that you've been the one
      // holding things together, with nobody doing that for you.
      output =
        `It's not just that you're ${t.feeling.value}.\n\n` +
        `It's that you've been the one keeping things going — and nobody's doing that for you.\n\n` +
        `**That's not an energy problem. That's a support problem.**`;
      break;

    case 'pile-up':
      // Deeper layer: the problem isn't the volume — it's the invisible expectation that
      // you'll just absorb all of it, without anyone asking if it's too much.
      output =
        `It's not just that ${t.context.value} keeps ${t.action.value}.\n\n` +
        `It's that the expectation is that you'll handle it — and nobody's checking whether that's actually okay.\n\n` +
        `**The weight isn't the things. It's carrying them alone.**`;
      break;

    case 'compound':
      // Deeper layer: it's not that too much happened — it's that you were still expected
      // to function through all of it, with no acknowledgment of what that cost.
      if (t.action.fromUser && t.context.fromUser) {
        output =
          `It wasn't just ${t.context.value} — and then ${t.action.value}.\n\n` +
          `It's that you kept going through all of it, and nobody stopped to ask how you were doing.\n\n` +
          `**That gap between what you carried and what anyone saw — that's the thing that wears you down.**`;
      } else if (t.action.fromUser) {
        output =
          `It wasn't just that ${t.action.value} happened.\n\n` +
          `It's that you were still expected to show up — and you did — and nobody acknowledged what that took.\n\n` +
          `**Functioning through something and being okay with it aren't the same thing.**`;
      } else {
        const term = t.feeling.fromUser ? t.feeling.value : t.context.value;
        output =
          `It wasn't just feeling ${term} about all of it.\n\n` +
          `It's that there was no space to actually put any of it down.\n\n` +
          `**You kept moving. That doesn't mean it didn't cost you.**`;
      }
      break;

    default: {
      // Uses feeling + context. Deeper layer: carrying something specific, unsupported.
      const ctx = t.context.fromUser ? t.context.value : null;
      const action = t.action.fromUser ? t.action.value : null;
      const anchor = ctx ?? action;
      if (anchor) {
        output =
          `It's not just that you're ${t.feeling.value}.\n\n` +
          `It's that you've been needing something from ${anchor} — and not getting it.\n\n` +
          `**That's the gap that's actually draining you.**`;
      } else {
        output =
          `It's not just that you're ${t.feeling.value}.\n\n` +
          `It's that you've been holding this by yourself — with no one noticing how much that takes.\n\n` +
          `**That kind of invisible weight is the hardest kind to carry.**`;
      }
      break;
    }
  }

  // SOURCE DEPENDENCY VALIDATION (Rule 7): reject if no user term appears in output.
  // Return empty string — hasClarity() ensures this is never shown to the user.
  if (!hasSourceDependency(output, t)) {
    return '';
  }

  return output;
}

/**
 * Alignment options — grounded experiential descriptions for the user to confirm.
 * Always generated from user input. No static fallbacks. No vague shortcuts.
 * Each option is a specific lived framing — different angle, different texture.
 */
export function generateAlignmentOptions(
  _pattern: PatternType,
  _signal: string,
  _context: Context,
  dominantSignal: DominantSignal,
  rawInput: string,
): ChipOption[] {
  const rt = extractReflectionTerms(rawInput, dominantSignal.type);
  const hasFeeling = rt.feeling.fromUser;
  const hasTarget  = rt.target.fromUser;
  const f = rt.feeling.value;
  const tgt = rt.target.value;

  // Vague input — open-ended but still grounded in what the user gave
  if (dominantSignal.isVague) {
    const forwardFeelings = ['anxious', 'worried', 'nervous', 'scared', 'uneasy', 'unsettled', 'restless'];
    const frustrationFeelings = ['frustrated', 'annoyed', 'irritated', 'angry', 'resentful', 'fed up', 'pressured'];
    const depletionFeelings = ['exhausted', 'drained', 'burnt out', 'tired', 'sad', 'low', 'depleted', 'worn out', 'empty', 'hollow', 'numb', 'flat', 'blah', 'wiped out'];

    if (hasFeeling) {
      if (forwardFeelings.includes(f)) return [
        { id: 'align-a', label: `the ${f} has been there even without anything obvious causing it` },
        { id: 'align-b', label: `there's a low hum of it in the background` },
        { id: 'align-c', label: `it's been harder to feel settled lately` },
        { id: 'something-else-align', label: 'something else' },
      ];
      if (frustrationFeelings.includes(f)) return [
        { id: 'align-a', label: `the ${f} has been building without a clear release` },
        { id: 'align-b', label: `something about your situation has been getting to you` },
        { id: 'align-c', label: `it's been there longer than feels reasonable` },
        { id: 'something-else-align', label: 'something else' },
      ];
      if (depletionFeelings.includes(f)) return [
        { id: 'align-a', label: `the ${f} has been there even without an obvious reason` },
        { id: 'align-b', label: `it's been low in a way that's hard to shake` },
        { id: 'align-c', label: `nothing specific set it off — it's just kind of there` },
        { id: 'something-else-align', label: 'something else' },
      ];
      // Generic feeling word
      return [
        { id: 'align-a', label: `you've been feeling ${f} and it's not tied to one thing` },
        { id: 'align-b', label: `it's been sitting there longer than usual` },
        { id: 'align-c', label: `nothing specific triggered it — it's more general` },
        { id: 'something-else-align', label: 'something else' },
      ];
    }

    // No feeling word extracted — use signal type to generate non-generic descriptions
    switch (dominantSignal.type) {
      case 'running-low':
        return [
          { id: 'align-a', label: `you've been running on less than usual for a while` },
          { id: 'align-b', label: `the pace has been taking more than you have` },
          { id: 'align-c', label: `rest doesn't quite reach it anymore` },
          { id: 'something-else-align', label: 'something else' },
        ];
      case 'flat-nothing':
        return [
          { id: 'align-a', label: `nothing is really landing, even the things that usually would` },
          { id: 'align-b', label: `you're going through the motions but not quite in it` },
          { id: 'align-c', label: `it's more like an absence than a feeling` },
          { id: 'something-else-align', label: 'something else' },
        ];
      default:
        return [
          { id: 'align-a', label: `something has been off lately — even without a clear cause` },
          { id: 'align-b', label: `it's been sitting heavier than you'd expect` },
          { id: 'align-c', label: `you haven't been able to quite place what it is` },
          { id: 'something-else-align', label: 'something else' },
        ];
    }
  }

  // Dynamic path — both feeling and target available
  if (hasFeeling && hasTarget) {
    switch (dominantSignal.type) {
      case 'flat-nothing':
        return [
          { id: 'align-a', label: `${tgt} isn't giving anything back right now` },
          { id: 'align-b', label: `you're going through the motions but nothing lands` },
          { id: 'align-c', label: `the ${f} is more like an absence than a reaction` },
          { id: 'something-else-align', label: 'something else' },
        ];
      case 'obligation-travel':
        return [
          { id: 'align-a', label: `${tgt} cost more than you expected` },
          { id: 'align-b', label: `you showed up but came back ${f}` },
          { id: 'align-c', label: `nobody saw what it took to be there` },
          { id: 'something-else-align', label: 'something else' },
        ];
      case 'daily-drain':
        return [
          { id: 'align-a', label: `${tgt} is taking something out of you before the day starts` },
          { id: 'align-b', label: `you're ${f} and there's no break from it` },
          { id: 'align-c', label: `the routine itself is the problem` },
          { id: 'something-else-align', label: 'something else' },
        ];
      case 'conflict-middle':
        return [
          { id: 'align-a', label: `you're ${f} between ${tgt}` },
          { id: 'align-b', label: `there's no room for what you actually think` },
          { id: 'align-c', label: `you keep absorbing what isn't yours to carry` },
          { id: 'something-else-align', label: 'something else' },
        ];
      case 'not-seen':
        return [
          { id: 'align-a', label: `${tgt} isn't really seeing what you're going through` },
          { id: 'align-b', label: `the ${f} hit harder because you're dealing with it alone` },
          { id: 'align-c', label: `it's not just what happened — it's not being understood` },
          { id: 'something-else-align', label: 'something else' },
        ];
      case 'running-low':
        return [
          { id: 'align-a', label: `you've been ${f} for longer than just today` },
          { id: 'align-b', label: `${tgt} keeps asking more than you have` },
          { id: 'align-c', label: `rest isn't really reaching it anymore` },
          { id: 'something-else-align', label: 'something else' },
        ];
      case 'pile-up':
        return [
          { id: 'align-a', label: `${tgt} keeps coming without a gap` },
          { id: 'align-b', label: `you're ${f} and there's nowhere to put any of it` },
          { id: 'align-c', label: `you never quite get a chance to catch up` },
          { id: 'something-else-align', label: 'something else' },
        ];
      case 'compound':
        return [
          { id: 'align-a', label: `it all came at once — ${tgt} and the rest` },
          { id: 'align-b', label: `you're ${f} because there was no gap between any of it` },
          { id: 'align-c', label: `there was no real point where you got to stop` },
          { id: 'something-else-align', label: 'something else' },
        ];
      default:
        return [
          { id: 'align-a', label: `${tgt} is weighing on you more than usual` },
          { id: 'align-b', label: `you're ${f} and it's not just about one thing` },
          { id: 'align-c', label: `something about this has been building` },
          { id: 'something-else-align', label: 'something else' },
        ];
    }
  }

  // Feeling only — no target, but clear feeling word
  if (hasFeeling) {
    const forwardFeelings = ['anxious', 'worried', 'nervous', 'scared', 'uneasy', 'unsettled', 'restless'];
    const frustrationFeelings = ['frustrated', 'annoyed', 'irritated', 'angry', 'resentful', 'fed up', 'pressured'];
    if (forwardFeelings.includes(f)) return [
      { id: 'align-a', label: `the ${f} has been there without something obvious to point to` },
      { id: 'align-b', label: `it's hard to feel settled when it's in the background like this` },
      { id: 'align-c', label: `it's been pressing more than usual without a clear reason` },
      { id: 'something-else-align', label: 'something else' },
    ];
    if (frustrationFeelings.includes(f)) return [
      { id: 'align-a', label: `the ${f} keeps coming up without a clear outlet` },
      { id: 'align-b', label: `something about your situation has been getting to you` },
      { id: 'align-c', label: `it's been sitting longer than feels right` },
      { id: 'something-else-align', label: 'something else' },
    ];
    return [
      { id: 'align-a', label: `you've been ${f} without it being tied to one clear thing` },
      { id: 'align-b', label: `the ${f} has been sitting there even on ordinary days` },
      { id: 'align-c', label: `it's been going on longer than you'd want it to` },
      { id: 'something-else-align', label: 'something else' },
    ];
  }

  // Target only — no feeling word, but clear context
  if (hasTarget) {
    return [
      { id: 'align-a', label: `${tgt} has been weighing on you more than it probably should` },
      { id: 'align-b', label: `something about ${tgt} hasn't felt right for a while` },
      { id: 'align-c', label: `it keeps coming up even when you're not thinking about it` },
      { id: 'something-else-align', label: 'something else' },
    ];
  }

  // Signal-type fallback — no terms extracted, use signal for specificity
  switch (dominantSignal.type) {
    case 'running-low':
      return [
        { id: 'align-a', label: `you've been running on less than usual` },
        { id: 'align-b', label: `the pace has been taking more than you have` },
        { id: 'align-c', label: `rest doesn't quite reach it anymore` },
        { id: 'something-else-align', label: 'something else' },
      ];
    case 'pile-up':
      return [
        { id: 'align-a', label: `it keeps coming without a real gap` },
        { id: 'align-b', label: `there's no moment where it actually lets up` },
        { id: 'align-c', label: `you never quite get a chance to catch up` },
        { id: 'something-else-align', label: 'something else' },
      ];
    default:
      return [
        { id: 'align-a', label: `something has been off without a clear cause` },
        { id: 'align-b', label: `it's been sitting heavier than you'd expect` },
        { id: 'align-c', label: `you haven't been able to quite place what it is` },
        { id: 'something-else-align', label: 'something else' },
      ];
  }
}

/**
 * Paths are derived from the untangle insight.
 * Three modes — understand (deepen awareness), act (small step), hold (reduce pressure).
 * No new meaning introduced. Each mode behaves differently.
 */
export function generatePaths(
  pattern: PatternType,
  _untangle: string,
  _signal: string,
  _context: Context,
  dominantSignal: DominantSignal,
): { pathA: PathAContent; pathB: PathBContent; pathC: PathCContent } {

  // C1 is anchored to dominant signal — names their specific reality
  const c1BySignal: Record<DominantSignalType, string> = {
    'flat-nothing':
      `That's okay.\n\nWhen nothing is pulling you, even deciding what to do with that takes something you don't have right now.`,
    'obligation-travel':
      `That's okay.\n\nWhen you gave your whole day and came back empty — figuring out next steps can wait.`,
    'daily-drain':
      `That's okay.\n\nWhen you're running this low, figuring out next steps takes energy you don't have right now.`,
    'conflict-middle':
      `That's okay.\n\nWhen you're caught in the middle like this, just knowing how it feels is enough for now.`,
    'not-seen':
      `That's okay.\n\nWhen something hits like that, you don't always know what to do with it right away.`,
    'running-low':
      `That's okay.\n\nWhen you've been going at this pace, even thinking clearly takes something you don't have right now.`,
    'pile-up':
      `That's okay.\n\nWhen everything is piling up, even knowing where to start feels like too much.`,
    'generic':
      `That's okay.\n\nWhen something feels tangled, knowing what to do isn't always the first step.`,
    'compound':
      `That's okay.\n\nWhen everything hits at once like that, figuring out next steps takes energy you don't have right now.`,
  };
  const c1 = c1BySignal[dominantSignal.type];

  // Path A/B messages and static content still driven by pattern
  // (path structure = what kind of help; content tone = from dominant signal above)
  if (dominantSignal.type === 'flat-nothing') {
    return {
      pathA: {
        message: `When you stay with that for a moment — the flatness, nothing pulling —\n\nwhat feels closest to what's going on?`,
        ...GENERIC_PATH_A_CONTENT,
      },
      pathB: {
        message: `Is there anything here that feels doable for now?`,
        ...GENERIC_PATH_B_CONTENT,
      },
      pathC: { c1, ...OVERWHELM_PATH_C_TAIL },
    };
  }

  if (dominantSignal.type === 'obligation-travel' || dominantSignal.type === 'daily-drain' || dominantSignal.type === 'running-low' || dominantSignal.type === 'compound') {
    const pathAMsg = dominantSignal.type === 'obligation-travel'
      ? `When you stay with that — the sense that you gave something and came back empty —\n\nwhat stands out most?`
      : `When you stay with that — no real break, the weight of it building —\n\nwhat stands out most?`;
    const pathBMsg = `Is there anything here that feels doable for now?`;
    return {
      pathA: { message: pathAMsg, ...OVERWHELM_PATH_A_CONTENT },
      pathB: { message: pathBMsg, ...OVERWHELM_PATH_B_CONTENT },
      pathC: { c1, ...OVERWHELM_PATH_C_TAIL },
    };
  }

  switch (pattern) {
    case 'overwhelm':
      return {
        pathA: {
          message: `When you stay with that — no real break, absorbing it all —\n\nwhat stands out most?`,
          ...OVERWHELM_PATH_A_CONTENT,
        },
        pathB: {
          message: `Is there anything here that feels doable for now?`,
          ...OVERWHELM_PATH_B_CONTENT,
        },
        pathC: { c1, ...OVERWHELM_PATH_C_TAIL },
      };

    case 'conflict':
      return {
        pathA: {
          message: `When you stay with that — the weight of holding both sides — where do you feel it most?`,
          ...CONFLICT_PATH_A_CONTENT,
        },
        pathB: {
          message: `What would feel right to do from here — even if it's small?`,
          ...CONFLICT_PATH_B_CONTENT,
        },
        pathC: { ...CONFLICT_PATH_C, c1 },
      };

    case 'judgment':
      return {
        pathA: {
          message: `When you stay with that — carrying this without feeling held — what part of it stays with you most?`,
          ...JUDGMENT_PATH_A_CONTENT,
        },
        pathB: {
          message: `What would feel right from here?`,
          ...JUDGMENT_PATH_B_CONTENT,
        },
        pathC: { ...JUDGMENT_PATH_C, c1 },
      };

    default:
      return {
        pathA: {
          message: `When you sit with this for a moment — what feels most true right now?`,
          ...GENERIC_PATH_A_CONTENT,
        },
        pathB: {
          message: `Is there anything here that feels doable?`,
          ...GENERIC_PATH_B_CONTENT,
        },
        pathC: { ...GENERIC_PATH_C, c1 },
      };
  }
}

// ─── Dynamic screen4 chips ────────────────────────────────────────────────────

export function getScreen4Options(_patternType: PatternType, rawInput?: string, dominantSignal?: DominantSignal): ChipOption[] {
  // Always generate dynamically — no static fallbacks, no vague shortcuts
  if (rawInput && dominantSignal) {
    const rt = extractReflectionTerms(rawInput, dominantSignal.type);
    const hasFeeling = rt.feeling.fromUser;
    const hasTarget  = rt.target.fromUser;
    const f = rt.feeling.value;
    const fn = feelingAsNoun(f);
    const tgt = rt.target.value;

    const forwardFeelings = ['anxious', 'worried', 'nervous', 'scared', 'uneasy', 'unsettled', 'restless'];
    const frustrationFeelings = ['frustrated', 'annoyed', 'irritated', 'angry', 'resentful', 'fed up', 'pressured'];
    const depletionFeelings = ['exhausted', 'drained', 'burnt out', 'tired', 'sad', 'low', 'depleted',
      'worn out', 'running on empty', 'wiped out', 'empty', 'hollow', 'numb', 'flat', 'blah',
      'lonely', 'lost', 'defeated', 'helpless', 'hopeless'];

    // Each option is generated independently from its intent.
    // Understanding: introspective — notice / look at / spend a moment / see what
    // Action: forward — decide / do something / find / pick
    // Regulation: grounding — ease / give yourself / bring back / let

    let understand: string;
    let action: string;
    let regulation: string;

    // ── FEELING + TARGET (most specific) ──
    if (hasFeeling && hasTarget) {
      if (forwardFeelings.includes(f)) {
        understand  = `look at what about ${tgt} is making this feel so uncertain`;
        action      = `decide one thing you actually have some control over right now`;
        regulation  = `bring your attention back to something steady in the present`;
      } else if (frustrationFeelings.includes(f)) {
        understand  = `notice what exactly about ${tgt} keeps landing so hard`;
        action      = `decide how you actually want to handle ${tgt}`;
        regulation  = `let some of the charge out of this before doing anything`;
      } else if (depletionFeelings.includes(f)) {
        understand  = `spend a moment with what this ${fn} around ${tgt} is actually about`;
        action      = `find one thing that might give you back a bit of ground`;
        regulation  = `give yourself permission to do less with ${tgt} right now`;
      } else {
        understand  = `look at what this ${fn} around ${tgt} is really pointing to`;
        action      = `decide what, if anything, you want to do about ${tgt}`;
        regulation  = `take some of the weight off this moment`;
      }

    // ── FEELING ONLY (vague or no clear target) ──
    } else if (hasFeeling) {
      if (forwardFeelings.includes(f)) {
        understand  = `spend a moment with what this ${fn} is actually pointing to`;
        action      = `see if there's one thing that would feel less uncertain right now`;
        regulation  = `bring your attention to something steady for now`;
      } else if (frustrationFeelings.includes(f)) {
        understand  = `notice what's been driving the ${fn}`;
        action      = `decide what, if anything, you actually want to do about this`;
        regulation  = `let some of the charge out of this before deciding anything`;
      } else if (depletionFeelings.includes(f)) {
        understand  = `spend a moment noticing what this ${fn} feels like right now`;
        action      = `do something small that might shift how this moment feels`;
        regulation  = `give yourself a bit of space without needing to fix anything`;
      } else {
        understand  = `look at what this ${fn} is actually about`;
        action      = `see if there's something specific you need right now`;
        regulation  = `take some of the weight off this moment`;
      }

    // ── TARGET ONLY (no feeling word, but clear context) ──
    } else if (hasTarget) {
      understand  = `look at what ${tgt} has actually been doing to you`;
      action      = `decide how you want to handle ${tgt} from here`;
      regulation  = `ease the pressure around ${tgt} a little for now`;

    // ── SIGNAL-BASED (no terms extracted, use signal type) ──
    } else {
      switch (dominantSignal.type) {
        case 'running-low':
          understand  = `notice where the tiredness is actually coming from`;
          action      = `find one thing you could ease off on right now`;
          regulation  = `give yourself permission to do less`;
          break;
        case 'flat-nothing':
          understand  = `spend a moment with what the flatness is actually like`;
          action      = `see if there's one small thing that might shift the moment`;
          regulation  = `let yourself be where you are without pushing`;
          break;
        case 'pile-up':
          understand  = `look at what's actually pressing most right now`;
          action      = `pick one thing and set the rest aside for now`;
          regulation  = `ease the pressure a little before deciding anything`;
          break;
        case 'conflict-middle':
          understand  = `notice what you're actually carrying in this`;
          action      = `decide what you actually want to do here`;
          regulation  = `take some of the pressure off this moment`;
          break;
        case 'not-seen':
          understand  = `spend a moment with what hurt most about it`;
          action      = `decide what, if anything, you want to do next`;
          regulation  = `give yourself some room before acting on this`;
          break;
        default:
          understand  = `spend a moment noticing what this actually feels like`;
          action      = `see if there's one thing that might help right now`;
          regulation  = `ease some of the pressure before doing anything`;
      }
    }

    return [
      { id: 'llm-a', label: understand },
      { id: 'llm-b', label: action },
      { id: 'llm-c', label: regulation },
      { id: 'something-else-screen4', label: 'something else' },
    ];
  }

  // Legacy callers — no rawInput available (should not occur in normal flow)
  return [
    { id: 'llm-a', label: 'spend a moment with what this is actually about' },
    { id: 'llm-b', label: 'see if there\'s one thing that might help right now' },
    { id: 'llm-c', label: 'ease some of the pressure before deciding anything' },
    { id: 'something-else-screen4', label: 'something else' },
  ];
}

// ─── Static path option/miniUntangle content ──────────────────────────────────
// Combined with dynamically-generated message fields in generatePaths.
// Closures are nudges — "you can leave here" not "here's what you learned".

type PathABase = Omit<PathAContent, 'message'>;
type PathBBase = Omit<PathBContent, 'message'>;
type PathCTail = Omit<PathCContent, 'c1'>;

// CONFLICT ─────────────────────────────────────────────────────────────────────

const CONFLICT_PATH_A_CONTENT: PathABase = {
  options: [
    { id: 'dyn-a1', label: "how much I'm carrying for both sides" },
    { id: 'dyn-a2', label: "feeling like there's no space for me in it" },
    { id: 'unknown', label: "I don't know" },
  ],
  miniUntangles: {
    "how much I'm carrying for both sides":
      `It's not just the tension between them.\n\nIt's that you've been absorbing both sides **on top of your own weight.**`,
    "feeling like there's no space for me in it":
      `In all the work of managing the middle,\n**you've had to make yourself very small.**`,
  },
  // Closure: nudge, not conclusion
  closingMessage: `We can leave it here — or there's more to look at, if that feels useful.`,
};

const CONFLICT_PATH_B_CONTENT: PathBBase = {
  options: [
    { id: 'dyn-b1', label: 'step back from it for the rest of today' },
    { id: 'dyn-b2', label: 'say something brief to one person' },
    { id: 'dyn-b3', label: 'take more time before responding' },
    { id: 'dyn-b4', label: 'leave it alone for now' },
  ],
  miniUntangles: {
    'step back from it for the rest of today':
      `Stepping back isn't abandoning it —\nit's choosing not to keep absorbing what isn't yours to carry.`,
    'say something brief to one person':
      `Even something short, said simply —\n**it's enough to bring yourself back into it.**`,
    'take more time before responding':
      `Slowing down isn't passivity —\n**it's not letting someone else's urgency become your obligation.**`,
    'leave it alone for now':
      `Sometimes the most useful move is to stop engaging with it.\n\n**That's a real choice.**`,
  },
  landingMessage: `That's something. We can leave it here if that feels right.`,
};

const CONFLICT_PATH_C: PathCContent = {
  c1: `That's okay.\n\nWhen you're caught in the middle like this, just knowing how it feels is enough for now.`,
  // mini-untangle: new angle — "stopped having a side of your own"
  c2: `It's not just the pressure between them.\n\nIt's that somewhere in all of it, you stopped having a side of your own.`,
  // hold: name the reality, give insight — not passive permission
  c3: `Being in the middle is genuinely draining. Most people would've stepped back by now.`,
  c4: `You can leave this here.`,
};

// OVERWHELM ────────────────────────────────────────────────────────────────────

const OVERWHELM_PATH_A_CONTENT: PathABase = {
  options: [
    { id: 'dyn-a1', label: 'the sense that it never stops' },
    { id: 'dyn-a2', label: "feeling like I can't keep up" },
    { id: 'unknown', label: "I don't know" },
  ],
  miniUntangles: {
    'the sense that it never stops':
      `When there's no real break in it,\nyour body starts bracing instead of recovering.\n\n**That takes a toll even when nothing dramatic happens.**`,
    "feeling like I can't keep up":
      `That feeling isn't a failure.\n\nIt's what happens when the load has been\n**too high for too long.**`,
  },
  // Closure: nudge
  closingMessage: `Even seeing this is something. You don't have to do anything with it right now.`,
};

const OVERWHELM_PATH_B_CONTENT: PathBBase = {
  options: [
    { id: 'dyn-b1', label: 'take a proper break tomorrow, even if it\'s short' },
    { id: 'dyn-b2', label: 'slow one part of my day down' },
    { id: 'dyn-b3', label: 'leave one thing undone for now' },
    { id: 'dyn-b4', label: 'leave things as they are for now' },
  ],
  miniUntangles: {
    'take a proper break tomorrow, even if it\'s short':
      `A break that actually stops things is different from just pausing.\n\n**Even a short one gives something back.**`,
    'slow one part of my day down':
      `You don't have to slow all of it. Just one part.\n\n**That's enough to change how the rest of it feels.**`,
    'leave one thing undone for now':
      `Not everything needs to be done today.\n\n**Choosing what to leave is deciding what actually needs you right now.**`,
    'leave things as they are for now':
      `Sometimes the most useful thing is to stop trying to fix it.\n\n**That's a real choice.**`,
  },
  landingMessage: `That's something. You can carry it lightly from here.`,
};

const OVERWHELM_PATH_C_TAIL: PathCTail = {
  // mini-untangle: new angle — not "you're tired" but "no day that was just yours"
  c2: `It's not just that you're tired.\n\nIt's that you haven't had a day that was just yours in a while.`,
  // hold: name the reality, give insight — not passive permission
  c3: `The load is real. And you've been carrying it without much help.`,
  c4: `That's a lot to hold. You've been doing that quietly.`,
};

// JUDGMENT ─────────────────────────────────────────────────────────────────────

const JUDGMENT_PATH_A_CONTENT: PathABase = {
  options: [
    { id: 'dyn-a1', label: "feeling like I wasn't really seen" },
    { id: 'dyn-a2', label: 'what it made me feel about myself' },
    { id: 'unknown', label: "I don't know" },
  ],
  miniUntangles: {
    "feeling like I wasn't really seen":
      `When you're not seen, the instinct is often to wonder if you explained yourself clearly.\n\nBut the issue often isn't your explanation —\n**people just weren't really looking.**`,
    'what it made me feel about myself':
      `That's the part that tends to stick.\n\nThe situation passes, but what it stirred up\n**inside you** stays.`,
  },
  // Closure: nudge
  closingMessage: `We can leave it here. You don't have to carry this any further right now.`,
};

const JUDGMENT_PATH_B_CONTENT: PathBBase = {
  options: [
    { id: 'dyn-b1', label: 'say something to the person involved' },
    { id: 'dyn-b2', label: 'step back and let it settle' },
    { id: 'dyn-b3', label: 'talk to someone else about it' },
    { id: 'dyn-b4', label: 'leave it alone for now' },
  ],
  miniUntangles: {
    'say something to the person involved':
      `Saying how something landed isn't asking for too much —\n**it's giving someone the chance to understand.**`,
    'step back and let it settle':
      `Not everything needs a response right away.\n\n**Letting it settle is a form of deciding.**`,
    'talk to someone else about it':
      `Saying it out loud — even once, even to someone else —\n**can make it feel less like just yours to carry.**`,
    'leave it alone for now':
      `Choosing not to engage isn't giving up —\n**it's recognising that the conversation isn't ready yet.**`,
  },
  landingMessage: `That's already something. You can carry this lightly for now.`,
};

const JUDGMENT_PATH_C: PathCContent = {
  c1: `That's okay.\n\nWhen something hits like that, you don't always know what to do with it right away.`,
  // mini-untangle: new angle — "hit somewhere already tender"
  c2: `It's not just what happened.\n\nIt's that it hit somewhere that was already a bit tender.`,
  // hold: name what's real, reduce pressure, give insight
  c3: `What you felt was real. You don't have to explain it to anyone.`,
  c4: `You can leave this here.`,
};

// GENERIC ──────────────────────────────────────────────────────────────────────

const GENERIC_PATH_A_CONTENT: PathABase = {
  options: [
    { id: 'dyn-a1', label: "that something isn't right, but I can't place it" },
    { id: 'dyn-a2', label: "that I've been carrying this alone" },
    { id: 'unknown', label: "I don't know" },
  ],
  miniUntangles: {
    "that something isn't right, but I can't place it":
      `That feeling is information —\n**even when it doesn't have a clear name yet.**`,
    "that I've been carrying this alone":
      `That's one of the heaviest parts —\n\nnot just the thing itself, but\n**holding it without somewhere to put it.**`,
  },
  // Closure: nudge
  closingMessage: `Just naming what's true can be enough. We can leave it here.`,
};

const GENERIC_PATH_B_CONTENT: PathBBase = {
  options: [
    { id: 'dyn-b1', label: 'take a bit of space from it today' },
    { id: 'dyn-b2', label: 'say something to someone about it' },
    { id: 'dyn-b3', label: 'do one small thing differently tomorrow' },
    { id: 'dyn-b4', label: 'leave things as they are for now' },
  ],
  miniUntangles: {
    'take a bit of space from it today':
      `Space from it isn't avoidance —\n**it's giving yourself room without the pressure.**`,
    'say something to someone about it':
      `Saying it out loud — even once —\n**can make it feel less like just yours to carry.**`,
    'do one small thing differently tomorrow':
      `One small thing doesn't solve it —\n**it just starts a different direction.**`,
    'leave things as they are for now':
      `Sometimes naming what's going on is enough for now.\n\n**You don't have to do anything else with it.**`,
  },
  landingMessage: `Something has shifted. We can leave it here for now.`,
};

const GENERIC_PATH_C: PathCContent = {
  c1: `That's okay.\n\nWhen something feels tangled, knowing what to do isn't always the first step.`,
  // mini-untangle: new angle — "been the only one holding it"
  c2: `It's not just that it's tangled.\n\nIt's that you've been the only one holding it.`,
  // hold: name the reality, give insight
  c3: `That feeling has been there for a reason. It doesn't need a label.`,
  c4: `You can leave it here.`,
};

// ─── Pattern keyword → type mapping ──────────────────────────────────────────

const PATTERNS: Array<{ keywords: string[]; patternType: PatternType }> = [
  {
    keywords: [
      'between', 'both sides', 'two people', 'two sides',
      'stuck in the middle', 'pulled in', 'multiple people', 'handling people',
    ],
    patternType: 'conflict',
  },
  {
    keywords: [
      'overwhelmed', 'too much', 'everything at once', 'all at once',
      "can't handle", 'piling up', 'stacking', 'so much',
      'travel', 'commut', 'back and forth', 'back-and-forth', 'journey', 'distance',
      'physically exhausting', 'managing the house', 'managing kids',
    ],
    patternType: 'overwhelm',
  },
  {
    keywords: [
      'judged', 'misunderstood', 'not heard', 'nobody gets',
      'no one understands', 'unseen', 'invisible',
    ],
    patternType: 'judgment',
  },
  {
    keywords: [
      'tired', 'exhausted', 'drained', 'no energy',
      "can't anymore", 'burnt out', 'burnout', 'run down',
    ],
    patternType: 'overwhelm',
  },
  {
    keywords: ['alone', 'lonely', 'no one', 'by myself', 'isolated', 'on my own'],
    patternType: 'judgment',
  },
  {
    keywords: [
      'angry', 'frustrated', 'unfair', "isn't fair", 'not fair',
      'resentful', 'resentment',
    ],
    patternType: 'conflict',
  },
  {
    keywords: [
      'scared', 'afraid', 'fear', 'anxious', 'anxiety',
      'worried', 'worry', 'what if',
    ],
    patternType: 'generic',
  },
  {
    keywords: [
      'lost', "don't know what to do", 'no direction',
      'unclear', 'confused', 'fog', 'foggy', "can't decide",
    ],
    patternType: 'generic',
  },
  {
    keywords: [
      'blah', 'empty', 'numb', 'nothing', 'flat',
      'hollow', 'disconnected', 'switched off', 'low energy',
    ],
    patternType: 'generic',
  },
];

// ─── Main export ──────────────────────────────────────────────────────────────
// Pipeline: detect pattern → build intent → generate → validate
// TODO: Replace generators with Claude API calls constrained by intent.

export async function generateUntangleResponse(userText: string, precomputedSignal?: DominantSignal): Promise<UntangleResponse> {
  await new Promise(resolve => setTimeout(resolve, 900));

  const signal         = extractSignal(userText);
  const context        = enrichContext(userText);
  // STATE RECOMPUTATION RULE: use caller-provided signal (computed fresh per input).
  // Callers must always call detectDominantSignal(userText) and pass it in.
  // Fallback to internal detection only when no signal is provided (e.g. legacy callers).
  const dominantSignal = precomputedSignal ?? detectDominantSignal(userText);

  // Pattern type still used for path structure (A/B/C content, mini-untangles)
  const lower = userText.toLowerCase();
  let patternType: PatternType = 'generic';
  for (const entry of PATTERNS) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      patternType = entry.patternType;
      break;
    }
  }

  // System builds intent — constrains what generators are allowed to say
  const intent = buildIntent(patternType, context);
  void intent;

  // Generators: dominantSignal drives reflection/alignment direction
  // Deepening + Untangle: SOURCE LOCK — userText passed, content built from user's words
  const reflection       = generateReflection(patternType, signal, context, dominantSignal, userText);
  const deepening        = generateDeepening(patternType, signal, context, dominantSignal, userText);
  const deepeningChips   = generateDeepeningChips(dominantSignal, userText);
  const untangle         = generateUntangle(patternType, signal, context, dominantSignal, userText);
  const alignmentOptions = generateAlignmentOptions(patternType, signal, context, dominantSignal, userText);
  const screen4Options   = getScreen4Options(patternType, userText, dominantSignal);
  const paths            = generatePaths(patternType, untangle, signal, context, dominantSignal);

  // Validate output (catches any banned phrases, length violations, repetition)
  const validation = validateOutput(reflection, deepening, untangle);
  if (!validation.valid) {
    console.warn('[UnTangle] Output validation issues:', validation.issues);
    // In stub mode this should never fail; in LLM mode, regenerate here
  }

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
}

// ─── Partial alignment merge generators ──────────────────────────────────────
// PARTIAL ALIGNMENT RULE:
// "part of it fits" = MERGE, not reset.
// Previous feeling is preserved. New context is integrated.
// Every output must answer: "why does the original feeling exist?"
// NOT: "what happened" (that's the reset path).

/**
 * Extracts Deepening-2-specific context from user input.
 * Goes beyond extractReflectionTerms — captures wants/needs, failure concepts,
 * and key noun phrases that standard extraction misses.
 */
function extractDeepeningContext(input: string): {
  want: string | null;        // object of wanting: "emotional support", "connection"
  failureTopic: string | null; // milestone/expectation failure topic
  keyPhrase: string | null;   // most specific phrase to surface verbatim
} {
  const lower = input.toLowerCase();

  // Want/craving extraction
  const wantM = lower.match(
    /\b(?:craving|longing for|wanting|want|need|needing|looking for|searching for|missing)\s+((?:some\s+)?(?:emotional\s+|real\s+|genuine\s+|more\s+)?[a-z]+(?:\s+[a-z]+)?)/,
  );
  const want = wantM ? wantM[1].trim() : null;

  // Failure/expectation shortfall
  const failureM = lower.match(
    /\b(?:failed?|failing|fallen? behind|falling short|not (?:where|what) (?:i|you) (?:should|thought|expected|wanted)|behind (?:on|where)|not (?:good|far) enough|haven'?t (?:done|made|achieved|reached))\b.{0,40}?(?:milestone|goal|where i|what i|career|life|expectation|standard|where you|what you)?/,
  );
  const failureTopicM = lower.match(
    /\b(milestone|milestones|career|life goal|expectation|where (?:i|you) (?:should|thought)|what (?:i|you) (?:should|thought)|standard|achievement|succeed|success)\b/,
  );
  const failureTopic = (failureM || failureTopicM) ? (failureTopicM?.[1] ?? 'where you expected to be') : null;

  // Key phrase — most specific emotional noun/verb phrase in input
  // Prefer want object > failure topic > raw notable words
  const keyPhrase = want ?? failureTopic ??
    (lower.match(/\b(connection|belonging|recognition|purpose|direction|clarity|rest|peace|space|stability)\b/)?.[1] ?? null);

  return { want, failureTopic, keyPhrase };
}

/**
 * Merged reflection — bridges the original emotional state to new context.
 * Used when user selects "part of it fits": carries forward previous feeling word.
 * INPUT-DRIVEN: extracts terms from newInput to ground the bridge.
 */
export function generateMergedReflection(
  previousFeeling: string,
  newSignal: DominantSignal,
  newInput: string,
): string {
  const prev = previousFeeling || 'that feeling';
  const rt = extractReflectionTerms(newInput, newSignal.type);
  const hasTarget = rt.target.fromUser;
  const tgt = rt.target.value;

  // Dynamic path — user-derived target grounds the bridge
  if (hasTarget) {
    switch (newSignal.type) {
      case 'compound':
        return `That '${prev}' makes more sense now.\n\nWith ${tgt} in the mix, things just kept stacking.`;
      case 'obligation-travel':
        return `That '${prev}' makes more sense now.\n\nGiving up your time for ${tgt} costs more than it looks.`;
      case 'running-low':
        return `That '${prev}' makes sense.\n\nWith ${tgt} going on this long, it builds up.`;
      case 'daily-drain':
        return `That '${prev}' makes more sense now.\n\nWhen ${tgt} takes from you before the day's even started, that shows.`;
      case 'conflict-middle':
        return `That '${prev}' makes sense.\n\nBeing in the middle of ${tgt} isn't easy to carry.`;
      case 'not-seen':
        return `That '${prev}' makes sense.\n\nWhen ${tgt} isn't really seeing it — that's its own kind of weight.`;
      case 'pile-up':
        return `That '${prev}' makes sense.\n\nWith ${tgt} pressing in like that, there's no real gap.`;
      case 'flat-nothing':
        return `That '${prev}' makes sense.\n\nWhen even ${tgt} isn't giving anything back, that's its own kind of hard.`;
      default:
        return `That '${prev}' makes sense.\n\nEspecially with ${tgt} weighing on you.`;
    }
  }

  // Fallback — no target extracted, stay at signal level
  switch (newSignal.type) {
    case 'compound':
      return `That '${prev}' makes more sense now.\n\nSounds like things just kept stacking without much of a gap.`;
    case 'obligation-travel':
      return `That '${prev}' makes more sense now.\n\nThose kinds of days cost more than they look like they will.`;
    case 'running-low':
      return `That '${prev}' makes sense.\n\nSounds like it's been going on for longer than just today.`;
    case 'daily-drain':
      return `That '${prev}' makes more sense now.\n\nWhen something takes from you before the day's even started, that shows.`;
    case 'conflict-middle':
      return `That '${prev}' makes sense.\n\nBeing in the middle of something like that isn't easy to carry.`;
    case 'not-seen':
      return `That '${prev}' makes sense.\n\nWhen it feels like the people around you aren't really seeing it — that's its own kind of weight.`;
    case 'pile-up':
      return `That '${prev}' makes sense.\n\nSounds like there's been a lot pressing in at once.`;
    case 'flat-nothing':
      return `That '${prev}' makes sense.\n\nWhen nothing is really pulling you, that's its own kind of hard.`;
    default:
      return `That '${prev}' makes sense.\n\nSounds like it's had some weight to it.`;
  }
}

/**
 * Merged deepening — used in the non-clarity partial path (deepening round 2).
 * INPUT-DRIVEN: extracts terms from newInput to ground the expansion.
 * Uses previousFeeling word to maintain emotional continuity.
 */
export function generateMergedDeepening(
  previousFeeling: string,
  newSignal: DominantSignal,
  newInput: string,
): string {
  const prev = previousFeeling || 'that feeling';
  const rt = extractReflectionTerms(newInput, newSignal.type);
  const hasTarget = rt.target.fromUser;
  const tgt = rt.target.value;
  const dc = extractDeepeningContext(newInput);

  // ── Want/craving path — highest specificity ───────────────────────────────
  // e.g. "craving emotional support", "wanting connection"
  if (dc.want) {
    return (
      `You're ${prev} — and you need ${dc.want} and it's not there.\n\n` +
      `Those two things together are what's making this hard.`
    );
  }

  // ── Failure/expectation-shortfall path ────────────────────────────────────
  // e.g. "feeling like I've failed at life milestones"
  if (dc.failureTopic) {
    const topic = dc.failureTopic === 'where you expected to be'
      ? dc.failureTopic
      : dc.failureTopic;
    return (
      `You're ${prev} — and you feel like you've fallen behind on ${topic}.\n\n` +
      `Both of those are real, and they make each other worse.`
    );
  }

  // ── Dynamic path — user-derived target (standard extraction) ─────────────
  if (hasTarget) {
    switch (newSignal.type) {
      case 'compound':
        return (
          `You're already ${prev} — and ${tgt} kept coming on top of that.\n\n` +
          `There was no real break.`
        );
      case 'obligation-travel':
        return (
          `You're already ${prev} — and ${tgt} took more from you on top of that.\n\n` +
          `You gave more than you got back.`
        );
      case 'running-low':
        return (
          `You're ${prev} — and it's been that way around ${tgt} for a while.\n\n` +
          `Resting doesn't fix it.`
        );
      case 'conflict-middle':
        return (
          `You're ${prev} — and ${tgt} is still pulling you in two directions.\n\n` +
          `There's no room to settle.`
        );
      case 'not-seen':
        return (
          `You're ${prev} — and ${tgt} isn't really seeing it.\n\n` +
          `You're carrying it alone.`
        );
      default:
        return (
          `You're ${prev} — and ${tgt} is in the mix too.\n\n` +
          `Two things at once.`
        );
    }
  }

  // ── Fallback — no standard target, but signal-specific ───────────────────
  // Key rule: no time-flattening, no "something/it/this" generics
  switch (newSignal.type) {
    case 'compound':
      return (
        `You're already ${prev} — and more kept coming.\n\n` +
        `There was no real break in it.`
      );
    case 'obligation-travel':
      return (
        `You're already ${prev} — and you had to give more on top of that.\n\n` +
        `You gave more than you got back.`
      );
    case 'running-low':
      return (
        `You're ${prev} — and resting doesn't fix it.\n\n` +
        `It goes deeper than that.`
      );
    case 'not-seen':
      return (
        `You're ${prev} — and nobody around you is really noticing.\n\n` +
        `You're carrying it alone.`
      );
    case 'conflict-middle':
      return (
        `You're ${prev} — and you're still being pulled in two directions.\n\n` +
        `There's no room to settle.`
      );
    case 'flat-nothing':
      return (
        `The ${prev} is quiet — it doesn't shout, it just sits.\n\n` +
        `Even reaching for something better doesn't quite work right now.`
      );
    default: {
      if (dc.keyPhrase) {
        return (
          `You're ${prev} — and you're looking for ${dc.keyPhrase} and it's not there.\n\n` +
          `That's what makes it harder.`
        );
      }
      return (
        `The ${prev} is real — even if you can't fully name what's driving it yet.`
      );
    }
  }
}

/**
 * STATE RECOMPUTATION RULE export.
 * Alias for detectDominantSignal — always called fresh per user input.
 * Import and call this in every handler before generateUntangleResponse.
 * Never pass a stored/cached signal from a previous input.
 */
export const classifySignal = detectDominantSignal;
