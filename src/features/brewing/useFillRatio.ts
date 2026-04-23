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
 * Continuously sets the liquid's height and the hero's bottom inline styles
 * every animation frame, bypassing React re-renders entirely.
 *
 * Applied synchronously in useLayoutEffect so the first paint has the correct
 * position (important for initial render correctness and tests that read
 * style.height immediately after render).
 */
export function useFillRatio(
  session: BrewSession,
  totalTimeSec: number,
  liquidRef: RefObject<HTMLElement | null>,
  heroRef: RefObject<HTMLElement | null>,
): void {
  // Pre-paint sync — ensures initial value is there before browser paints and
  // that tests reading style.height right after render see the correct value.
  useLayoutEffect(() => {
    apply(
      liquidRef.current,
      heroRef.current,
      ratioFor(session, totalTimeSec, Date.now()),
    );
  });

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      apply(
        liquidRef.current,
        heroRef.current,
        ratioFor(session, totalTimeSec, Date.now()),
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [session, totalTimeSec, liquidRef, heroRef]);
}
