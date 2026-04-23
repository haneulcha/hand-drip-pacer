import { useEffect, useLayoutEffect, type RefObject } from "react";
import type { BrewSession } from "@/domain/session";

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const ratioFor = (
  session: BrewSession,
  totalTimeSec: number,
  now: number,
): number => clamp01((now - session.startedAt) / 1000 / totalTimeSec);

const toPct = (ratio: number): string => `${(ratio * 100).toFixed(2)}%`;

const apply = (
  liquidEl: HTMLElement | null,
  heroEl: HTMLElement | null,
  ratio: number,
): void => {
  const pct = toPct(ratio);
  if (liquidEl) {
    liquidEl.style.height = pct;
  }
  if (heroEl) {
    heroEl.style.bottom = `calc(${pct} + var(--brewing-hero-gap))`;
  }
};

/**
 * Continuously sets the liquid height and hero bottom inline styles via rAF,
 * bypassing React re-renders. The ratio is clamped to `maxRatio` so the hero
 * (which rides on the meniscus) is never pushed past the cup interior's top
 * edge by the rising fill.
 */
export function useFillRatio(
  session: BrewSession,
  totalTimeSec: number,
  liquidRef: RefObject<HTMLElement | null>,
  heroRef: RefObject<HTMLElement | null>,
  maxRatio: number,
): void {
  // Pre-paint sync — first paint has correct value, tests reading style.height
  // immediately after render see the clamped initial value.
  useLayoutEffect(() => {
    const r = ratioFor(session, totalTimeSec, Date.now());
    apply(liquidRef.current, heroRef.current, Math.min(r, maxRatio));
  });

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const r = ratioFor(session, totalTimeSec, Date.now());
      apply(liquidRef.current, heroRef.current, Math.min(r, maxRatio));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [session, totalTimeSec, liquidRef, heroRef, maxRatio]);
}
