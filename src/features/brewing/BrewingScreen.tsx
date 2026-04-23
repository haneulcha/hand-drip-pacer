import { useEffect, useRef, useState } from "react";
import { activeStepIdx, type BrewSession } from "@/domain/session";
import type { Pour } from "@/domain/types";
import { formatTime } from "@/ui/format";
import { cx } from "@/ui/cx";
import { StopConfirmDialog } from "./StopConfirmDialog";
import { useElapsed } from "./useElapsed";

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

  const fillRatio = Math.min(1, Math.max(0, elapsed / totalTimeSec));
  const fillPct = `${(fillRatio * 100).toFixed(2)}%`;

  const handleSkip = () => {
    setManualStepFloor((prev) => Math.max(prev, clockIdx) + 1);
  };

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  // pour 0 (atSec=0) 은 컵 바닥이라 ring 안 그림
  const visibleRings = pours.filter((p) => p.atSec > 0);
  const nextRingIdx = visibleRings.findIndex((p) => p.atSec > elapsed);

  const phaseLabel = active.label === "bloom" ? "bloom" : `${activeIdx}차`;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
      <AriaLiveStep session={session} activeIdx={activeIdx} />

      {/* RIM */}
      <header
        data-region="rim"
        className="relative z-10 flex h-brewing-rim items-start justify-between border-b border-border/60 bg-surface px-5 pt-4 shadow-rim-inset"
      >
        <div>
          <div className="text-2xs text-text-muted">경과</div>
          <div className="mt-0.5 text-xl font-medium tabular-nums">
            {formatTime(elapsed)}
          </div>
        </div>
        <div className="flex items-start gap-3 pt-2">
          {!done && (
            <button
              type="button"
              onClick={handleSkip}
              aria-label="다음 스텝으로 건너뛰기"
              className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary"
            >
              건너뛰기 <span aria-hidden>›</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setStopDialogOpen(true)}
            className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary"
          >
            중단
          </button>
        </div>
      </header>

      {/* CUP INTERIOR */}
      <div className="relative flex-1 overflow-hidden bg-surface">
        {/* Liquid */}
        <div
          data-testid="liquid"
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 transition-[height] duration-DEFAULT ease-DEFAULT"
          style={{
            height: fillPct,
            background:
              "linear-gradient(180deg, var(--color-brewing-liquid-top) 0%, var(--color-brewing-liquid-mid) 22%, var(--color-brewing-liquid-deep) 60%, var(--color-brewing-liquid-bottom) 100%)",
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
          {/* wave shimmer */}
          <div
            className="motion-safe:animate-brewing-wave absolute inset-x-0 top-0 h-2.5"
            style={{
              background:
                "radial-gradient(ellipse at 30% 100%, var(--color-wave-shimmer-a) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, var(--color-wave-shimmer-b) 0%, transparent 60%)",
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
          return (
            <RingMarker
              key={p.index}
              pour={p}
              totalTimeSec={totalTimeSec}
              variant={variant}
              label={ringLabel}
            />
          );
        })}

        {/* Hero floating above meniscus */}
        <div
          data-testid="hero"
          className="pointer-events-none absolute left-3.5 right-24 transition-[bottom] duration-DEFAULT ease-DEFAULT"
          style={{
            bottom: `calc(${fillPct} + var(--brewing-hero-gap))`,
          }}
        >
          <div className="text-2xs font-semibold uppercase tracking-widest text-pour-bloom">
            지금 · <span>{phaseLabel}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              data-testid="hero-weight"
              className="text-brewing-hero font-medium leading-none tabular-nums"
            >
              {active.cumulativeWater}
            </span>
            <span className="text-lg text-text-muted">g</span>
          </div>
          <div className="mt-1.5 text-sm italic text-text-secondary">
            +{active.pourAmount}g 붓기{isLast ? " · 마지막 푸어" : ""}
          </div>
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
}: {
  readonly pour: Pour;
  readonly totalTimeSec: number;
  readonly variant: "below" | "next" | "future";
  readonly label: string;
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
        <span className="text-[8px] uppercase tracking-widest opacity-75">
          {label}
        </span>
      </div>
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
