import { useEffect, useState } from 'react'
import {
  activeStepIdx,
  nextStepIdx,
  type BrewSession,
} from '@/domain/session'
import { formatTime } from '@/ui/format'
import { cx } from '@/ui/cx'
import { StopConfirmDialog } from './StopConfirmDialog'
import { useElapsed } from './useElapsed'

type Props = {
  readonly session: BrewSession
  readonly onExit: () => void
}

export function BrewingScreen({ session, onExit }: Props) {
  const elapsed = useElapsed(session)
  const [stopDialogOpen, setStopDialogOpen] = useState(false)

  const { recipe } = session
  const { pours, totalTimeSec } = recipe
  const activeIdx = activeStepIdx(pours, elapsed)
  const active = pours[activeIdx]!
  const nextIdx = nextStepIdx(pours, elapsed)
  const next = nextIdx !== null ? pours[nextIdx]! : null
  const done = elapsed >= totalTimeSec

  const heroWeight = done ? recipe.totalWater : active.cumulativeWater
  const heroHint = done ? null : `+${active.pourAmount}g 붓기`
  const heroTimeLabel = done ? null : formatTime(active.atSec)

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
      <AriaLiveStep session={session} activeIdx={activeIdx} />

      {/* Top bar */}
      <header className="flex items-start justify-between px-5 pt-14">
        <div>
          <div className="text-[10px] text-text-muted">경과</div>
          <div className="mt-0.5 text-[26px] font-medium tabular-nums">
            {formatTime(elapsed)}
          </div>
        </div>
        {!done && (
          <button
            type="button"
            onClick={() => setStopDialogOpen(true)}
            className="pt-2 text-[11px] text-text-muted hover:text-text-secondary"
          >
            중단
          </button>
        )}
      </header>

      {/* Progress rail */}
      <div className="mt-6 flex items-center gap-1.5 px-5">
        {pours.map((p, i) => (
          <div key={p.index} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cx(
                'h-[3px] w-full rounded-full',
                i < activeIdx || done
                  ? 'bg-text-primary'
                  : i === activeIdx
                  ? 'bg-pour-bloom'
                  : 'bg-border',
              )}
            />
            <span
              className={cx(
                'text-[9px]',
                i === activeIdx && !done
                  ? 'font-semibold text-text-primary'
                  : 'text-text-muted',
              )}
            >
              {p.label === 'bloom' ? '뜸' : `${i}차`}
            </span>
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="mt-12 flex flex-col items-center px-5 text-center">
        {done ? (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-pour-bloom">
            완료
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-pour-bloom">
            지금
          </span>
        )}
        <span className="mt-2 text-[11px] text-text-muted">저울 목표</span>
        <div className="mt-1 flex items-baseline gap-1">
          <span
            data-testid="hero-weight"
            className="text-[96px] font-medium leading-none tabular-nums"
          >
            {heroWeight}
          </span>
          <span className="text-3xl text-text-muted">g</span>
        </div>
        {heroHint && (
          <div className="mt-2 text-base italic text-text-secondary">{heroHint}</div>
        )}
      </div>

      {/* Time marker */}
      {heroTimeLabel && (
        <div className="mt-4 text-center">
          <div className="text-[10px] text-text-muted">시점</div>
          <div className="text-[22px] text-text-secondary tabular-nums">
            {heroTimeLabel}
          </div>
        </div>
      )}

      {/* Bottom: next preview OR done exit button */}
      <div className="mt-auto px-5 pb-8">
        {done ? (
          <button
            type="button"
            onClick={onExit}
            className="flex h-14 w-full items-center justify-center rounded-xl border-[1.6px] border-text-primary bg-surface-subtle text-base font-medium transition-colors hover:bg-surface-inset"
          >
            처음으로
          </button>
        ) : next ? (
          <>
            <div className="mb-2.5 h-px bg-border" />
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-semibold text-text-muted">다음</span>
              <span className="text-[13px] text-text-secondary tabular-nums">
                {formatTime(next.atSec)}
              </span>
              <div className="flex-1" />
              <span className="text-lg font-medium tabular-nums">
                {next.cumulativeWater}
                <span className="ml-0.5 text-[11px] text-text-muted">g</span>
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
  )
}

function AriaLiveStep({
  session,
  activeIdx,
}: {
  readonly session: BrewSession
  readonly activeIdx: number
}) {
  const [announced, setAnnounced] = useState<string>('')
  useEffect(() => {
    const pour = session.recipe.pours[activeIdx]
    if (!pour) return
    const label = pour.label === 'bloom' ? '뜸' : `${activeIdx}차`
    setAnnounced(`${label}: ${pour.cumulativeWater}그램까지`)
  }, [session, activeIdx])
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {announced}
    </span>
  )
}
