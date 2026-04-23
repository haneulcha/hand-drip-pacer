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
  isDrawdown: boolean,
  lastRingRatio: number,
): void => {
  if (liquidEl) {
    liquidEl.style.height = toPct(ratio);
  }
  if (heroEl) {
    if (isDrawdown) {
      // Pin the hero just below the meniscus's position at drawdown start
      // (which is lastRingRatio of cup interior). It stays anchored there
      // while the liquid rises past it to 100%.
      const heroH = heroEl.offsetHeight;
      heroEl.style.bottom = `calc(${(lastRingRatio * 100).toFixed(2)}% - ${heroH + 8}px)`;
    } else {
      heroEl.style.bottom = `calc(${toPct(ratio)} + var(--brewing-hero-gap))`;
    }
  }
};

/**
 * Continuously sets the liquid height and hero bottom inline styles via rAF,
 * bypassing React re-renders.
 *
 * During pour phase (isDrawdown=false):
 *   - liquid height is capped at maxRatio so hero stays visible.
 *   - hero rides the meniscus: bottom = fillRatio% + gap.
 *
 * During drawdown phase (isDrawdown=true):
 *   - cap is released (maxRatio should be 1) → liquid fills freely to 100%.
 *   - hero is anchored just below the lastRing's position so it sinks below
 *     the rising liquid surface.
 */
export function useFillRatio(
  session: BrewSession,
  totalTimeSec: number,
  liquidRef: RefObject<HTMLElement | null>,
  heroRef: RefObject<HTMLElement | null>,
  maxRatio: number,
  isDrawdown: boolean,
  lastRingRatio: number,
): void {
  // Pre-paint sync — first paint has correct value, tests reading style.height
  // immediately after render see the clamped initial value.
  useLayoutEffect(() => {
    const r = ratioFor(session, totalTimeSec, Date.now());
    apply(
      liquidRef.current,
      heroRef.current,
      Math.min(r, maxRatio),
      isDrawdown,
      lastRingRatio,
    );
  });

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const r = ratioFor(session, totalTimeSec, Date.now());
      apply(
        liquidRef.current,
        heroRef.current,
        Math.min(r, maxRatio),
        isDrawdown,
        lastRingRatio,
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [session, totalTimeSec, liquidRef, heroRef, maxRatio, isDrawdown, lastRingRatio]);
}
