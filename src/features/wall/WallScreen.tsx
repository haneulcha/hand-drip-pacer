import { dripperList } from '@/domain/drippers'
import type { DripperId } from '@/domain/types'
import { cx } from '@/ui/cx'
import { DripperIcon } from '@/ui/DripperIcon'

type Props = {
  readonly selectedDripper: DripperId
  readonly onPickDripper: (id: DripperId) => void
}

export function WallScreen({ selectedDripper, onPickDripper }: Props) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-wall text-text-primary">
      {/* 브랜드 마크 zone */}
      <header className="flex flex-col items-center gap-2 px-5 pt-16">
        <h1 className="text-5xl font-medium leading-none tracking-tight">뜸</h1>
        <p className="text-base italic text-text-secondary">오늘 한 잔</p>
      </header>

      {/* breathing room */}
      <div className="flex-1" />

      {/* shelf */}
      <section aria-label="드리퍼 선반" className="px-8 pb-16">
        <div className="flex items-end justify-around gap-4 pb-3">
          {dripperList.map((d) => {
            const isSelected = d.id === selectedDripper
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onPickDripper(d.id)}
                aria-pressed={isSelected}
                aria-label={d.name}
                style={{ viewTransitionName: `dripper-${d.id}` }}
                className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-surface-inset/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <DripperIcon type={d.id} size={96} selected={isSelected} />
                <span
                  className={cx(
                    'text-sm',
                    isSelected ? 'font-medium text-text-primary' : 'text-text-secondary',
                  )}
                >
                  {d.name}
                </span>
              </button>
            )
          })}
        </div>
        <div className="h-px bg-border" />
        <p className="mt-4 text-center text-xs italic text-text-muted">
          도구를 집어듭니다.
        </p>
      </section>
    </div>
  )
}
