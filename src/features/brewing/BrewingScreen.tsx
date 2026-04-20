import { useEffect, useRef, useState } from "react";
import { activeStepIdx, type BrewSession } from "@/domain/session";
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
  const nextLocalIdx = activeIdx + 1 < pours.length ? activeIdx + 1 : null;
  const next = nextLocalIdx !== null ? pours[nextLocalIdx]! : null;
  const done = elapsed >= totalTimeSec || manualStepFloor >= pours.length;

  const handleSkip = () => {
    setManualStepFloor((prev) => Math.max(prev, clockIdx) + 1);
  };

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
      <AriaLiveStep session={session} activeIdx={activeIdx} />

      {/* Top bar */}
      <header className="flex items-start justify-between px-5 pt-14">
        <div>
          <div className="text-2xs text-text-muted">경과</div>
          <div className="mt-0.5 text-2xl font-medium tabular-nums">
            {formatTime(elapsed)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStopDialogOpen(true)}
          className="pt-2 text-xs text-text-muted hover:text-text-secondary"
        >
          중단
        </button>
      </header>

      {/* Progress rail */}
      <div className="mt-6 flex items-center gap-1.5 px-5">
        {pours.map((p, i) => (
          <div
            key={p.index}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className={cx(
                "h-[3px] w-full rounded-pill",
                i < activeIdx
                  ? "bg-text-primary"
                  : i === activeIdx
                    ? "bg-pour-bloom"
                    : "bg-border",
              )}
            />
            <span
              className={cx(
                "text-2xs",
                i === activeIdx
                  ? "font-semibold text-text-primary"
                  : "text-text-muted",
              )}
            >
              {p.label === "bloom" ? "bloom" : `${i}차`}
            </span>
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="mt-12 flex flex-col items-center px-5 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-pour-bloom">
          지금
        </span>
        <span className="mt-2 text-xs text-text-muted">저울 목표</span>
        <div className="mt-1 flex items-baseline gap-1">
          <span
            data-testid="hero-weight"
            className="text-hero-lg font-medium leading-none tabular-nums"
          >
            {active.cumulativeWater}
          </span>
          <span className="text-2xl text-text-muted">g</span>
        </div>
        <div className="mt-2 text-md italic text-text-secondary">
          +{active.pourAmount}g 붓기
        </div>
      </div>

      {/* Time marker */}
      <div className="mt-4 text-center">
        <div className="text-2xs text-text-muted">시점</div>
        <div className="text-xl text-text-secondary tabular-nums">
          {formatTime(active.atSec)}
        </div>
      </div>

      {/* Skip */}
      {manualStepFloor < pours.length && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleSkip}
            aria-label="다음 스텝으로 건너뛰기"
            className="px-5 py-3 text-sm text-text-secondary hover:text-text-primary"
          >
            건너뛰기 <span aria-hidden>›</span>
          </button>
        </div>
      )}

      {/* Bottom: next preview */}
      <div className="mt-auto px-5 pb-8">
        {next ? (
          <>
            <div className="mb-2.5 h-px bg-border" />
            <div className="flex items-center gap-2.5">
              <span className="text-2xs font-semibold text-text-muted">
                다음
              </span>
              <span className="text-sm text-text-secondary tabular-nums">
                {formatTime(next.atSec)}
              </span>
              <div className="flex-1" />
              <span className="text-lg font-medium tabular-nums">
                {next.cumulativeWater}
                <span className="ml-0.5 text-xs text-text-muted">g</span>
              </span>
            </div>
          </>
        ) : null}
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
