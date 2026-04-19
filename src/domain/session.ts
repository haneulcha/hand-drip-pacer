import type { Pour, Recipe } from "./types";

export type Feeling = "calm" | "neutral" | "wave";

export type BrewSession = {
  readonly recipe: Recipe;
  readonly startedAt: number;
  readonly completedAt?: number;
  readonly feeling?: Feeling;
};

export const elapsedSec = (session: BrewSession, now: number): number =>
  Math.max(0, Math.floor((now - session.startedAt) / 1000));

// Largest index i such that pours[i].atSec <= elapsed. Defaults to 0 (first pour).
export const activeStepIdx = (
  pours: readonly Pour[],
  elapsed: number,
): number => {
  if (elapsed < 0 || pours.length === 0) return 0;
  let idx = 0;
  for (let i = 0; i < pours.length; i++) {
    if (pours[i]!.atSec <= elapsed) idx = i;
    else break;
  }
  return idx;
};

// First index j with pours[j].atSec > elapsed, or null if no such pour exists.
export const nextStepIdx = (
  pours: readonly Pour[],
  elapsed: number,
): number | null => {
  for (let i = 0; i < pours.length; i++) {
    if (pours[i]!.atSec > elapsed) return i;
  }
  return null;
};

export const isComplete = (session: BrewSession, now: number): boolean =>
  elapsedSec(session, now) >= session.recipe.totalTimeSec;
