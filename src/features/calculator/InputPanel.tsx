import type { ReactNode } from 'react'
import { dripperList } from '@/domain/drippers'
import { methodsForDripper } from '@/domain/methods'
import type {
  BrewMethodId,
  DripperId,
  Grams,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
  TasteProfile,
} from '@/domain/types'
import { Segmented } from '@/ui/Segmented'
import { Slider } from '@/ui/Slider'

const MIN_COFFEE_G = 5
const MAX_COFFEE_G = 50

type Props = {
  readonly coffee: Grams
  readonly dripper: DripperId
  readonly method: BrewMethodId
  readonly roast: RoastLevel
  readonly taste: TasteProfile
  readonly onCoffeeChange: (coffee: number) => void
  readonly onDripperChange: (dripper: DripperId) => void
  readonly onMethodChange: (method: BrewMethodId) => void
  readonly onRoastChange: (roast: RoastLevel) => void
  readonly onTasteChange: (taste: TasteProfile) => void
}

export function InputPanel({
  coffee,
  dripper,
  method,
  roast,
  taste,
  onCoffeeChange,
  onDripperChange,
  onMethodChange,
  onRoastChange,
  onTasteChange,
}: Props) {
  const compat = methodsForDripper(dripper)

  return (
    <section aria-label="입력" className="flex flex-col gap-5">
      <Field label="커피">
        <Slider
          label="커피"
          value={coffee}
          onChange={onCoffeeChange}
          min={MIN_COFFEE_G}
          max={MAX_COFFEE_G}
          suffix="g"
        />
      </Field>

      <Field label="드리퍼">
        <Segmented<DripperId>
          name="dripper"
          label="드리퍼"
          value={dripper}
          onChange={onDripperChange}
          options={dripperList.map((d) => ({ value: d.id, label: d.name }))}
        />
      </Field>

      <Field label="방식">
        <Segmented<BrewMethodId>
          name="method"
          label="방식"
          value={method}
          onChange={onMethodChange}
          options={compat.map((m) => ({ value: m.id, label: m.name }))}
        />
      </Field>

      <Field label="로스팅">
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
      </Field>

      <Field label="맛">
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
      </Field>

      <Field label="강도">
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
      </Field>
    </section>
  )
}

function Field({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</div>
      {children}
    </div>
  )
}
