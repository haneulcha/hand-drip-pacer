import { useRef, useState } from 'react'
import type { Recipe } from '@/domain/types'
import { formatGrindHint, formatTime } from '@/ui/format'
import { PourTimeline } from './PourTimeline'

type Props = {
  readonly recipe: Recipe
  readonly methodName: string
  readonly onReset: () => void
}

type CopyStatus = 'idle' | 'copied' | 'failed'

export function RecipeView({ recipe, methodName, onReset }: Props) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopyStatus('idle'), 2000)
  }

  const copyLabel =
    copyStatus === 'copied' ? '복사됨' : copyStatus === 'failed' ? '복사 실패' : '링크 복사'

  return (
    <section
      aria-label="레시피"
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface-subtle p-5"
    >
      <header>
        <h2 className="text-base font-semibold">{methodName}</h2>
        <p className="mt-1 text-sm text-text-muted tabular-nums">
          {recipe.coffee}g × {recipe.totalWater}g · 1:{recipe.ratio} · {recipe.temperature}°C
        </p>
      </header>

      <PourTimeline recipe={recipe} />

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
          차수 · 총 {formatTime(recipe.totalTimeSec)}
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-text-muted">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">시간</th>
              <th className="pb-2 font-medium">양</th>
              <th className="pb-2 text-right font-medium">누적</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {recipe.pours.map((pour) => (
              <tr key={pour.index} className="border-t border-border">
                <td className="py-2">
                  <span className="inline-flex items-center gap-2">
                    {pour.index + 1}
                    {pour.label === 'bloom' && (
                      <span className="rounded border border-pour-bloom px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-pour-bloom">
                        bloom
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-2">{formatTime(pour.atSec)}</td>
                <td className="py-2">+{pour.pourAmount}g</td>
                <td className="py-2 text-right font-medium">{pour.cumulativeWater}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">분쇄도</h3>
        <p className="text-sm">{formatGrindHint(recipe.grindHint)}</p>
      </div>

      <div>
        <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">노트</h3>
        <ul className="flex flex-col gap-1 text-sm text-text-secondary">
          {recipe.notes.map((note) => (
            <li key={note}>· {note}</li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-inset"
        >
          {copyLabel}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-inset"
        >
          초기화
        </button>
      </div>
    </section>
  )
}
