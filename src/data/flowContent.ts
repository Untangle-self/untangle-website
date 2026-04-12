import type { A1Selection, ChipOption } from '../types/flow';

export const USER_INTRO_MESSAGE = "I think I'm trying to handle two different people and I don't know what to do.";

// ─── LIGHT FLOW ───────────────────────────────────────────────────────────────

export const SCREEN1_MESSAGE = `That makes sense.

Trying to handle two different people at once can start to feel like
you're being pulled in both directions…
without really knowing where you stand.

Does any of this feel close?`;

export const SCREEN1_OPTIONS: ChipOption[] = [
  { id: 'overwhelmed', label: 'feeling overwhelmed by it' },
  { id: 'middle',      label: "feeling like you're stuck in the middle" },
  { id: 'other',       label: 'something else' },
];

// Adaptive screen2 message based on screen1 chip selection
export const getScreen2Message = (sel: string): string => {
  if (sel === 'feeling overwhelmed by it')
    return `I hear you.

When everything starts stacking like this,
it can stop feeling like separate situations…
and start feeling like one heavy thing to carry.`;

  if (sel === "feeling like you're stuck in the middle")
    return `I hear you.

When you're in the middle like that,
it can start to feel like you're trying to balance both sides…
without really having a place of your own in it.`;

  // "something else" post-input path
  return `I hear you.

Sometimes when things feel like this,
it's not even one clear thing —
just that something isn't sitting right.`;
};

// Screen 1b — response shown after free-input "something else"
export const SCREEN1b_MESSAGE = `That makes sense.

What you're describing sounds like
you're trying to hold different sides at once…
while also dealing with how it affects you.`;

export const SCREEN3_MESSAGE = `It's not just that you're stuck between them.

It's that you're trying to hold both sides —

**and there isn't really space for you in it.**

That's what's making this feel so heavy.`;

// screen3b — pause after untangle
export const SCREEN3b_MESSAGE = `That can take a second to settle.`;

// Screen 4 — Transition
export const SCREEN4_MESSAGE = `What feels closer right now?`;

export const SCREEN4_OPTIONS: ChipOption[] = [
  { id: 'understand', label: 'stay with this' },
  { id: 'figure-out', label: 'what can I do here' },
  { id: 'unknown',    label: "I'm not sure" },
];

// ─── PATH A — Understand ──────────────────────────────────────────────────────

export const A1_MESSAGE = `If you sit with this for a moment…

what feels strongest right now?`;

export const A1_OPTIONS: ChipOption[] = [
  { id: 'pulled',  label: 'feeling pulled in both directions' },
  { id: 'unseen',  label: "feeling like there's no space for you in it" },
  { id: 'unknown', label: "I don't know" },
];

export const getA2Message = (sel: A1Selection): string => {
  if (sel === 'pulled')
    return `It's like you're being stretched both ways…\n\n**without anywhere to land.**`;
  if (sel === 'unseen')
    return `It's not just the situation —\n\nit's that there isn't really space for you in it.`;
  return `That's okay.\nSometimes it just sits as a weight\n\n**without a clear shape yet.**`;
};

// A3 — Closing message (no chips)
export const A3_MESSAGE = `You've already made sense of what mattered here.

You were holding both sides
without space for yourself.

You don't have to carry this any further right now.`;

// ─── PATH B — What to Do ──────────────────────────────────────────────────────

export const B1_MESSAGE = `If you want to do something here, it doesn't have to be about fixing everything.

What feels more possible right now?`;

export const B2_OPTIONS: ChipOption[] = [
  { id: 'step-back', label: 'step back a little from both sides' },
  { id: 'say-feel',  label: 'say what you feel clearly to one person' },
  { id: 'pause',     label: 'take a pause before responding' },
  { id: 'unknown',   label: "I don't know" },
];

export const getB4Message = (sel: string): string => {
  if (sel === 'step back a little from both sides')
    return `Stepping back here isn't avoidance —\nit's creating space for yourself in something that hasn't had space for you.`;
  if (sel === 'say what you feel clearly to one person')
    return `Saying what you feel isn't about choosing sides —\nit's about finally bringing your side into this.`;
  if (sel === 'take a pause before responding')
    return `Pausing here isn't doing nothing —\nit's not reacting from a place that's already overloaded.`;
  return `That's okay.\nEven knowing you need something different here\nis already a start.`;
};

// B5 — landing
export const B5_MESSAGE = `Even seeing it this way
might already feel a little different.`;

// ─── PATH C — I Don't Know ────────────────────────────────────────────────────

export const C1_MESSAGE = `That's okay.

When something feels this tangled,
it's not always clear what to do.`;

export const C2_MESSAGE = `It's not just confusion —

it's that you've been holding
too much at once.`;

export const C3_MESSAGE = `We don't have to sort it out right now.`;

export const C4_MESSAGE = `You don't have to carry this any further right now.`;

// ─── LOOP ────────────────────────────────────────────────────────────────────

const LOOP_NUDGES = [
  `We can pause here whenever you want.`,
  `We don't have to go further unless it helps.`,
  `There's no rush here — take what feels right.`,
  `You've already done something by sitting with this.`,
];

export function getLoopNudge(loopCount: number): string {
  return LOOP_NUDGES[loopCount % LOOP_NUDGES.length];
}

export const LOOP_DECISION_MESSAGE = `We can pause here if you want — or where do you feel like going from here?`;

export const LOOP_OPTIONS: ChipOption[] = [
  { id: 'loop-stay',   label: 'stay with this a bit more' },
  { id: 'loop-action', label: 'look at what you can do' },
  { id: 'loop-shift',  label: 'shift what we\'re focusing on' },
  { id: 'loop-exit',   label: 'I think I\'m okay for now' },
];

// ─── SUMMARY ──────────────────────────────────────────────────────────────────

export const SUMMARY_S1 = `Before we leave this…

You weren't just dealing with a situation.

You were trying to hold both sides
without space for yourself.

And trying to hold everything together
is what made this feel so heavy.`;

export const SUMMARY_S2 = `That's a lot to carry.`;

export const SUMMARY_S3 = `Even seeing this
might already feel a little different.`;
