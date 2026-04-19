import { useEffect, useRef, useState } from 'react'
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
  readonly onComplete: () => void
}

export function BrewingScreen({ session, onExit, onComplete }: Props) {
  const elapsed = useElapsed(session)
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const completedRef = useRef(false)

  const { recipe } = session
  const { pours, totalTimeSec } = recipe
  const activeIdx = activeStepIdx(pours, elapsed)
  const active = pours[activeIdx]!
  const nextIdx = nextStepIdx(pours, elapsed)
  const next = nextIdx !== null ? pours[nextIdx]! : null
  const done = elapsed >= totalTimeSec

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [done, onComplete])

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
        <button
          type="button"
          onClick={() => setStopDialogOpen(true)}
          className="pt-2 text-[11px] text-text-muted hover:text-text-secondary"
        >
          중단
        </button>
      </header>

      {/* Progress rail */}
      <div className="mt-6 flex items-center gap-1.5 px-5">
        {pours.map((p, i) => (
          <div key={p.index} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cx(
                'h-[3px] w-full rounded-pill',
                i < activeIdx ? 'bg-text-primary' : i === activeIdx ? 'bg-pour-bloom' : 'bg-border',
              )}
            />
            <span
              className={cx(
                'text-[9px]',
                i === activeIdx ? 'font-semibold text-text-primary' : 'text-text-muted',
              )}
            >
              {p.label === 'bloom' ? 'bloom' : `${i}차`}
            </span>
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="mt-12 flex flex-col items-center px-5 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-pour-bloom">
          지금
        </span>
        <span className="mt-2 text-[11px] text-text-muted">저울 목표</span>
        <div className="mt-1 flex items-baseline gap-1">
          <span
            data-testid="hero-weight"
            className="text-[96px] font-medium leading-none tabular-nums"
          >
            {active.cumulativeWater}
          </span>
          <span className="text-3xl text-text-muted">g</span>
        </div>
        <div className="mt-2 text-base italic text-text-secondary">
          +{active.pourAmount}g 붓기
        </div>
      </div>

      {/* Time marker */}
      <div className="mt-4 text-center">
        <div className="text-[10px] text-text-muted">시점</div>
        <div className="text-[22px] text-text-secondary tabular-nums">
          {formatTime(active.atSec)}
        </div>
      </div>

      {/* Bottom: next preview */}
      <div className="mt-auto px-5 pb-8">
        {next ? (
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
    const label = pour.label === 'bloom' ? 'bloom' : `${activeIdx}차`
    setAnnounced(`${label}: ${pour.cumulativeWater}그램까지`)
  }, [session, activeIdx])
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {announced}
    </span>
  )
}
