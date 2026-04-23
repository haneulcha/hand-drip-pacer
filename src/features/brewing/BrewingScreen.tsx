import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { activeStepIdx, type BrewSession } from "@/domain/session";
import type { Pour } from "@/domain/types";
import { formatTime } from "@/ui/format";
import { cx } from "@/ui/cx";
import { StopConfirmDialog } from "./StopConfirmDialog";
import { useElapsed } from "./useElapsed";
import { useFillRatio } from "./useFillRatio";

type Props = {
  readonly session: BrewSession;
  readonly onExit: () => void;
  readonly onComplete: () => void;
};

export function BrewingScreen({ session, onExit, onComplete }: Props) {
  const elapsed = useElapsed(session);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [manualStepFloor, setManualStepFloor] = useState(0);
  const completedRef = useRef(false);

  const { recipe } = session;
  const { pours, totalTimeSec } = recipe;
  const clockIdx = activeStepIdx(pours, elapsed);
  const activeIdx = Math.min(
    pours.length - 1,
    Math.max(clockIdx, manualStepFloor),
  );
  const active = pours[activeIdx]!;
  const isLast = activeIdx === pours.length - 1;
  const done = elapsed >= totalTimeSec || manualStepFloor >= pours.length;

  // pour 0 (atSec=0) 은 컵 바닥이라 ring 안 그림
  const visibleRings = pours.filter((p) => p.atSec > 0);
  const nextRingIdx = visibleRings.findIndex((p) => p.atSec > elapsed);

  const lastRingAt = visibleRings.length > 0
    ? Math.max(...visibleRings.map((p) => p.atSec))
    : 0;
  const isDrawdown = lastRingAt > 0 && elapsed >= lastRingAt;
  const lastRingRatio = totalTimeSec > 0 ? lastRingAt / totalTimeSec : 0;

  const cupRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const liquidRef = useRef<HTMLDivElement | null>(null);
  const [topRingFallback, setTopRingFallback] = useState(false);
  const [maxFillRatio, setMaxFillRatio] = useState(1);

  useFillRatio(
    session,
    totalTimeSec,
    liquidRef,
    heroRef,
    isDrawdown ? 1 : maxFillRatio,
    isDrawdown,
    lastRingRatio,
  );

  const handleSkip = () => {
    setManualStepFloor((prev) => Math.max(prev, clockIdx) + 1);
  };

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  // Measure cup interior + hero, compute --cup-height CSS var (for liquid
  // gradient sizing), maxFillRatio (cap so hero stays visible), and
  // topRingFallback (if topmost ring would overlap hero).
  useLayoutEffect(() => {
    const cupEl = cupRef.current;
    const heroEl = heroRef.current;
    if (!cupEl) return;

    const update = () => {
      const cupH = cupEl.clientHeight;
      cupEl.style.setProperty("--cup-height", `${cupH}px`);

      if (!heroEl) return;
      const heroH = heroEl.offsetHeight;

      if (cupH === 0 || heroH === 0) {
        setMaxFillRatio(1);
        setTopRingFallback(false);
        return;
      }

      const gapPx = 12; // matches --brewing-hero-gap
      const safetyPx = 8;
      const reserved = heroH + gapPx + safetyPx;
      const newMax = Math.max(
        0.2,
        Math.min(1, (cupH - reserved) / cupH),
      );
      setMaxFillRatio(newMax);

      if (visibleRings.length > 0) {
        const lastRingRatio =
          Math.max(...visibleRings.map((p) => p.atSec)) / totalTimeSec;
        const heroBottomPx = newMax * cupH + gapPx;
        const heroTopPx = heroBottomPx + heroH;
        const ringPx = lastRingRatio * cupH;
        // Topmost ring overlaps hero's vertical span → push its label to RIM.
        setTopRingFallback(
          ringPx >= heroBottomPx - 4 && ringPx <= heroTopPx + 4,
        );
      } else {
        setTopRingFallback(false);
      }
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(cupEl);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [visibleRings, totalTimeSec]);

  const phaseLabel = active.label === "bloom" ? "bloom" : `${activeIdx}차`;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
      <AriaLiveStep session={session} activeIdx={activeIdx} />

      {/* RIM */}
      <header
        data-region="rim"
        className="relative z-10 flex h-brewing-rim items-start justify-between border-b border-border/60 bg-surface px-5 pt-4 shadow-rim-inset"
      >
        <div className="flex items-start gap-4">
          <div>
            <div className="text-2xs text-text-muted">경과</div>
            <div className="mt-0.5 text-xl font-medium tabular-nums">
              {formatTime(elapsed)}
            </div>
          </div>
          {topRingFallback && visibleRings.length > 0 && (
            <div className="pt-1">
              <div className="text-2xs text-text-muted">최종</div>
              <div className="mt-0.5 text-xs tabular-nums text-text-secondary">
                {formatTime(visibleRings[visibleRings.length - 1]!.atSec)}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!done && (
            <button
              type="button"
              onClick={handleSkip}
              aria-label="다음 스텝으로 건너뛰기"
              className="flex min-h-11 items-center px-2 text-xs text-text-muted hover:text-text-secondary"
            >
              건너뛰기 <span aria-hidden>›</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setStopDialogOpen(true)}
            className="flex min-h-11 items-center px-2 text-xs text-text-muted hover:text-text-secondary"
          >
            중단
          </button>
        </div>
      </header>

      {/* CUP INTERIOR */}
      <div ref={cupRef} className="relative flex-1 overflow-hidden bg-surface shadow-cup-inset">
        {/* Liquid */}
        <div
          ref={liquidRef}
          data-testid="liquid"
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0"
          style={{
            background:
              "linear-gradient(180deg, var(--color-brewing-liquid-top) 0%, var(--color-brewing-liquid-mid) 32%, var(--color-brewing-liquid-deep) 78%, var(--color-brewing-liquid-bottom) 100%) no-repeat bottom / 100% var(--cup-height, 100%)",
          }}
        >
          {/* meniscus highlight */}
          <div
            className="absolute inset-x-0 top-0 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-meniscus-highlight), transparent)",
            }}
          />
        </div>

        {/* Rings */}
        {visibleRings.map((p, i) => {
          const variant: "below" | "next" | "future" =
            p.atSec <= elapsed
              ? "below"
              : i === nextRingIdx
                ? "next"
                : "future";
          const localIdx = pours.indexOf(p);
          const ringLabel =
            p.label === "bloom" ? "bloom" : `${localIdx}차`;
          const isTopRing = i === visibleRings.length - 1;
          return (
            <RingMarker
              key={p.index}
              pour={p}
              totalTimeSec={totalTimeSec}
              variant={variant}
              label={ringLabel}
              hideLabel={isTopRing && topRingFallback}
            />
          );
        })}

        {/* Hero floating above meniscus (pour phase) or anchored below it (drawdown) */}
        <div
          ref={heroRef}
          data-testid="hero"
          className="pointer-events-none absolute left-3.5 right-24"
        >
          <div
            className={cx(
              "text-2xs font-semibold uppercase tracking-widest",
              isDrawdown ? "text-text-on-liquid" : "text-pour-bloom",
            )}
          >
            {isDrawdown ? (
              "드로우다운"
            ) : (
              <>
                지금 · <span>{phaseLabel}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              data-testid="hero-weight"
              className={cx(
                "text-brewing-hero font-medium leading-none tabular-nums",
                isDrawdown ? "text-text-on-liquid" : "text-text-primary",
              )}
            >
              {active.cumulativeWater}
            </span>
            <span
              className={cx(
                "text-lg",
                isDrawdown ? "text-text-on-liquid opacity-70" : "text-text-muted",
              )}
            >
              g
            </span>
          </div>
          {!isDrawdown && (
            <div className="mt-1.5 text-sm italic text-text-secondary">
              +{active.pourAmount}g 붓기{isLast ? " · 마지막 푸어" : ""}
            </div>
          )}
        </div>
      </div>

      {stopDialogOpen && (
        <StopConfirmDialog
          onCancel={() => setStopDialogOpen(false)}
          onConfirm={onExit}
        />
      )}
    </div>
  );
}

function RingMarker({
  pour,
  totalTimeSec,
  variant,
  label,
  hideLabel = false,
}: {
  readonly pour: Pour;
  readonly totalTimeSec: number;
  readonly variant: "below" | "next" | "future";
  readonly label: string;
  readonly hideLabel?: boolean;
}) {
  const positionPct = `${((pour.atSec / totalTimeSec) * 100).toFixed(2)}%`;
  const lineColor =
    variant === "below"
      ? "var(--color-ring-on-liquid)"
      : variant === "next"
        ? "var(--color-text-primary)"
        : "var(--color-ring-future)";
  const labelColor =
    variant === "below"
      ? "var(--color-ring-on-liquid-label)"
      : variant === "next"
        ? "var(--color-text-primary)"
        : "var(--color-text-muted)";
  return (
    <div
      data-testid={variant === "next" ? "ring-next" : undefined}
      data-ring-variant={variant}
      data-at-sec={pour.atSec}
      className="pointer-events-none absolute inset-x-0 z-[3] h-px"
      style={{ bottom: positionPct }}
    >
      <div
        className="absolute left-3.5 right-24 top-0"
        style={{
          height: variant === "next" ? "1.5px" : "1px",
          background: lineColor,
        }}
      />
      {!hideLabel && (
        <div
          className={cx(
            "absolute right-4 -top-1.5 flex items-baseline gap-1.5 text-2xs tabular-nums",
            variant === "next" && "font-semibold",
          )}
          style={{ color: labelColor }}
        >
          <time
            aria-label={`${label} 경계, ${Math.floor(pour.atSec / 60)}분 ${pour.atSec % 60}초`}
            dateTime={`PT${Math.floor(pour.atSec / 60)}M${pour.atSec % 60}S`}
          >
            {formatTime(pour.atSec)}
          </time>
          <span className="uppercase tracking-widest opacity-75">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

function AriaLiveStep({
  session,
  activeIdx,
}: {
  readonly session: BrewSession;
  readonly activeIdx: number;
}) {
  const [announced, setAnnounced] = useState<string>("");
  useEffect(() => {
    const pour = session.recipe.pours[activeIdx];
    if (!pour) return;
    const label = pour.label === "bloom" ? "bloom" : `${activeIdx}차`;
    setAnnounced(`${label}: ${pour.cumulativeWater}그램까지`);
  }, [session, activeIdx]);
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {announced}
    </span>
  );
}
