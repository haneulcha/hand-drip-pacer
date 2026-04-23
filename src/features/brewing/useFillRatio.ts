import { useEffect, useState } from "react";
import type { BrewSession } from "@/domain/session";

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const ratioFor = (session: BrewSession, totalTimeSec: number, now: number): number =>
  clamp01((now - session.startedAt) / 1000 / totalTimeSec);

/**
 * Continuous fill ratio (0..1) of brewing progress, updated at requestAnimationFrame
 * cadence so the liquid rise reads as a smooth, slow rise rather than 1Hz steps.
 *
 * Step indexing / aria-live / completion logic should still consume `useElapsed`
 * (integer seconds) — only visual fill should depend on this hook.
 */
export function useFillRatio(
  session: BrewSession,
  totalTimeSec: number,
): number {
  const [ratio, setRatio] = useState(() =>
    ratioFor(session, totalTimeSec, Date.now()),
  );

  useEffect(() => {
    let frame = 0;
    let last = -1;
    const tick = () => {
      const r = ratioFor(session, totalTimeSec, Date.now());
      // Only commit a re-render when the change is visually meaningful (~0.05%).
      // Avoids 60 React renders per second when the ratio is effectively static
      // (e.g., when ratio has hit 1 at the end of brew).
      if (Math.abs(r - last) >= 0.0005) {
        last = r;
        setRatio(r);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [session, totalTimeSec]);

  return ratio;
}
