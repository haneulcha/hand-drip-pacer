import { useState } from 'react'
import { dripperList } from '@/domain/drippers'
import { brewMethods, methodsForDripper } from '@/domain/methods'
import type {
  BrewMethodId,
  DripperId,
  Grams,
  Recipe,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
  TasteProfile,
} from '@/domain/types'
import { Segmented } from '@/ui/Segmented'
import { Slider } from '@/ui/Slider'
import { DripperIcon } from '@/ui/DripperIcon'
import { formatGrindHint, formatTime } from '@/ui/format'
import { DripperPopover } from './DripperPopover'
import { PourVerticalPreview } from './PourVerticalPreview'

const MIN_COFFEE_G = 5
const MAX_COFFEE_G = 50

type Props = {
  readonly coffee: Grams
  readonly dripper: DripperId
  readonly method: BrewMethodId
  readonly roast: RoastLevel
  readonly taste: TasteProfile
  readonly recipe: Recipe
  readonly onCoffeeChange: (coffee: number) => void
  readonly onDripperChange: (dripper: DripperId) => void
  readonly onMethodChange: (method: BrewMethodId) => void
  readonly onRoastChange: (roast: RoastLevel) => void
  readonly onTasteChange: (taste: TasteProfile) => void
  readonly onStart: () => void
}

export function RecipeScreen({
  coffee,
  dripper,
  method,
  roast,
  taste,
  recipe,
  onCoffeeChange,
  onDripperChange,
  onMethodChange,
  onRoastChange,
  onTasteChange,
  onStart,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const compatMethods = methodsForDripper(dripper)
  const methodMeta = brewMethods[method]

  const ratioDisplay = `1:${Math.round(recipe.ratio)}`
  const recommendedLine = `${recipe.temperature}° · ${ratioDisplay} · ${formatTime(recipe.totalTimeSec)} · ${formatGrindHint(recipe.grindHint)}`

  const popoverOptions = dripperList.map((d) => {
    const firstMethod = methodsForDripper(d.id)[0]
    return {
      id: d.id,
      name: d.name,
      methodSubtitle: firstMethod?.name ?? '',
    }
  })

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
      {/* top bar */}
      <header className="flex items-center gap-3 px-5 pt-12">
        <span style={{ viewTransitionName: `dripper-${dripper}` }}>
          <DripperIcon type={dripper} size={56} selected />
        </span>
        <div className="flex-1">
          <div className="text-lg font-medium">{dripperList.find((d) => d.id === dripper)?.name}</div>
          <div className="text-[11px] text-text-muted">{methodMeta.name}</div>
        </div>
        <button
          type="button"
          onClick={() => setPopoverOpen(true)}
          className="whitespace-nowrap text-[11px] text-text-muted hover:text-text-secondary"
        >
          바꾸기 ›
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div className="h-px bg-border" />

        {/* controls */}
        <Row label="커피">
          <Slider
            label="커피"
            value={coffee}
            onChange={onCoffeeChange}
            min={MIN_COFFEE_G}
            max={MAX_COFFEE_G}
            suffix="g"
          />
        </Row>

        <Row label="맛">
          <Segmented<SweetnessProfile>
            name="sweetness"
            label="맛"
            value={taste.sweetness}
            onChange={(v) => onTasteChange({ ...taste, sweetness: v })}
            options={[
              { value: 'sweet', label: '달게' },
              { value: 'balanced', label: '균형' },
              { value: 'bright', label: '산뜻하게' },
            ]}
          />
        </Row>

        <Row label="강도">
          <Segmented<StrengthProfile>
            name="strength"
            label="강도"
            value={taste.strength}
            onChange={(v) => onTasteChange({ ...taste, strength: v })}
            options={[
              { value: 'light', label: '연하게' },
              { value: 'medium', label: '보통' },
              { value: 'strong', label: '진하게' },
            ]}
          />
        </Row>

        <Row label="방식">
          <Segmented<BrewMethodId>
            name="method"
            label="방식"
            value={method}
            onChange={onMethodChange}
            options={compatMethods.map((m) => ({ value: m.id, label: m.name }))}
          />
        </Row>

        <Row label="로스팅">
          <Segmented<RoastLevel>
            name="roast"
            label="로스팅"
            value={roast}
            onChange={onRoastChange}
            options={[
              { value: 'light', label: '라이트' },
              { value: 'medium', label: '미디엄' },
              { value: 'dark', label: '다크' },
            ]}
          />
        </Row>

        {/* recommended row */}
        <div className="mt-1 flex items-center gap-2 text-[10px] text-text-muted">
          <span className="whitespace-nowrap">권장</span>
          <span className="flex-1 tabular-nums">{recommendedLine}</span>
        </div>

        <div className="h-px bg-border" />

        {/* pour schedule */}
        <section className="flex min-h-0 flex-1 flex-col gap-2" aria-label="푸어 스케줄">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              푸어 스케줄
            </span>
            <span className="text-xs text-text-muted tabular-nums">
              {recipe.totalWater}g · {formatTime(recipe.totalTimeSec)} · {recipe.pours.length} pours
            </span>
          </div>
          <div className="flex-1">
            <PourVerticalPreview pours={recipe.pours} totalTimeSec={recipe.totalTimeSec} />
          </div>
        </section>
      </main>

      {/* start button */}
      <div className="px-5 pb-6">
        <button
          type="button"
          onClick={onStart}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border-[1.6px] border-text-primary bg-surface-subtle text-lg font-medium transition-colors hover:bg-surface-inset"
        >
          <svg width={14} height={16} viewBox="0 0 14 16" aria-hidden="true">
            <path d="M 2 2 L 12 8 L 2 14 Z" fill="currentColor" />
          </svg>
          시작
        </button>
      </div>

      {popoverOpen && (
        <DripperPopover
          options={popoverOptions}
          selected={dripper}
          onSelect={(id) => {
            onDripperChange(id)
            setPopoverOpen(false)
          }}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  )
}

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[44px_1fr] items-center gap-3">
      <span className="text-[11px] text-text-secondary">{label}</span>
      <div>{children}</div>
    </div>
  )
}
