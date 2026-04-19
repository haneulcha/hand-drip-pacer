import { brewMethods } from '@/domain/methods'
import { drippers } from '@/domain/drippers'
import type { BrewSession, Feeling } from '@/domain/session'
import { cx } from '@/ui/cx'
import { formatBrewedAt, formatGrindHint, formatTime } from '@/ui/format'
import { FeelingGlyph } from './FeelingGlyph'

type Props = {
  readonly session: BrewSession
  readonly onFeelingChange: (feeling: Feeling | null) => void
  readonly onExit: () => void
}

const FEELINGS: readonly { id: Feeling; label: string }[] = [
  { id: 'calm', label: '고요했다' },
  { id: 'neutral', label: '잘 몰라' },
  { id: 'wave', label: '어수선했다' },
]

export function CompleteScreen({ session, onFeelingChange, onExit }: Props) {
  const { recipe } = session
  const dripperName = drippers[recipe.dripper].name
  const methodName = brewMethods[recipe.method].name
  const dateText = formatBrewedAt(session.startedAt)

  const handleFeelingTap = (feeling: Feeling): void => {
    onFeelingChange(session.feeling === feeling ? null : feeling)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-surface px-6 pb-10 pt-16 text-text-primary">
      {/* quiet header */}
      <header className="flex flex-col items-center gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-pour-bloom">
          완료
        </span>
        <span className="text-[11px] text-text-muted tabular-nums">{dateText}</span>
      </header>

      {/* hero */}
      <section aria-label="총 시간" className="mt-6 flex flex-col items-center">
        <span className="text-[11px] text-text-muted">오늘의 한 잔</span>
        <span className="mt-1 text-[72px] font-medium leading-none tabular-nums">
          {formatTime(recipe.totalTimeSec)}
        </span>
        <span className="mt-2 text-sm italic text-text-secondary">잘 내렸습니다.</span>
      </section>

      {/* recipe summary card */}
      <section aria-label="레시피 요약" className="mt-10">
        <div className="h-px bg-border" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-5">
          <SummaryCell label="드리퍼" value={dripperName} />
          <SummaryCell label="레시피" value={methodName} small />
          <SummaryCell label="원두 · 물" value={`${recipe.coffee} · ${recipe.totalWater} g`} />
          <SummaryCell
            label="온도 · 분쇄"
            value={`${recipe.temperature}° · ${formatGrindHint(recipe.grindHint)}`}
          />
        </div>
        <div className="h-px bg-border" />
      </section>

      {/* feeling */}
      <section aria-label="감정 기록" className="mt-10 flex flex-col items-center gap-3">
        <p className="text-sm italic text-text-secondary">오늘의 시간은 어땠나요?</p>
        <div className="flex w-full gap-2">
          {FEELINGS.map((f) => {
            const isSelected = session.feeling === f.id
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={f.label}
                onClick={() => handleFeelingTap(f.id)}
                className={cx(
                  'flex h-20 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border transition-colors',
                  isSelected
                    ? 'border-text-primary bg-surface-subtle font-medium text-text-primary'
                    : 'border-border text-text-secondary hover:bg-surface-inset/60',
                )}
              >
                <FeelingGlyph kind={f.id} size={34} />
                <span className="text-xs">{f.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* bottom buttons */}
      <div className="mt-auto flex gap-2 pt-10">
        <button
          type="button"
          onClick={onExit}
          className="h-13 flex-1 rounded-xl border-[1.6px] border-text-primary bg-surface-subtle py-3.5 text-sm font-medium transition-colors hover:bg-surface-inset"
        >
          처음으로
        </button>
        <button
          type="button"
          disabled
          aria-label="공유"
          className="h-13 w-16 rounded-xl border border-border py-3.5 text-text-muted opacity-40"
        >
          공유
        </button>
      </div>
    </div>
  )
}

function SummaryCell({
  label,
  value,
  small,
}: {
  readonly label: string
  readonly value: string
  readonly small?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <span className={cx('tabular-nums', small ? 'text-[13px] text-text-secondary' : 'text-base')}>
        {value}
      </span>
    </div>
  )
}
