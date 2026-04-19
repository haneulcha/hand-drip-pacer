import type { ReactNode } from 'react'
import { dripperList } from '@/domain/drippers'
import { methodsForDripper } from '@/domain/methods'
import { COFFEE_PER_SERVING, MAX_SERVINGS } from '@/domain/servings'
import type {
  BrewMethodId,
  DripperId,
  InputMode,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
  TasteProfile,
} from '@/domain/types'
import { g } from '@/domain/units'
import { Segmented } from '@/ui/Segmented'
import { Slider } from '@/ui/Slider'
import { Stepper } from '@/ui/Stepper'

const MIN_COFFEE_G = 5
const MAX_COFFEE_G = 50

type Props = {
  readonly inputMode: InputMode
  readonly dripper: DripperId
  readonly method: BrewMethodId
  readonly roast: RoastLevel
  readonly taste: TasteProfile
  readonly onInputModeChange: (mode: InputMode) => void
  readonly onDripperChange: (dripper: DripperId) => void
  readonly onMethodChange: (method: BrewMethodId) => void
  readonly onRoastChange: (roast: RoastLevel) => void
  readonly onTasteChange: (taste: TasteProfile) => void
}

export function InputPanel({
  inputMode,
  dripper,
  method,
  roast,
  taste,
  onInputModeChange,
  onDripperChange,
  onMethodChange,
  onRoastChange,
  onTasteChange,
}: Props) {
  const compat = methodsForDripper(dripper)

  const switchEntryMode = (target: 'by-coffee' | 'by-servings'): void => {
    if (target === inputMode.kind) return
    if (target === 'by-coffee') {
      const coffee =
        inputMode.kind === 'by-servings'
          ? g(inputMode.servings * COFFEE_PER_SERVING)
          : inputMode.coffee
      onInputModeChange({ kind: 'by-coffee', coffee })
    } else {
      const servings =
        inputMode.kind === 'by-coffee'
          ? Math.max(
              1,
              Math.min(MAX_SERVINGS, Math.round(inputMode.coffee / COFFEE_PER_SERVING)),
            )
          : inputMode.servings
      onInputModeChange({ kind: 'by-servings', servings })
    }
  }

  return (
    <section aria-label="입력" className="flex flex-col gap-5">
      <Field label="입력 방식">
        <Segmented<'by-coffee' | 'by-servings'>
          name="entry"
          label="입력 방식"
          value={inputMode.kind}
          onChange={switchEntryMode}
          options={[
            { value: 'by-coffee', label: '커피 (g)' },
            { value: 'by-servings', label: '인원' },
          ]}
        />
      </Field>

      {inputMode.kind === 'by-coffee' ? (
        <Field label="커피">
          <Slider
            label="커피"
            value={inputMode.coffee}
            onChange={(v) => onInputModeChange({ kind: 'by-coffee', coffee: g(v) })}
            min={MIN_COFFEE_G}
            max={MAX_COFFEE_G}
            suffix="g"
          />
        </Field>
      ) : (
        <Field label={`인원 (1인당 ${COFFEE_PER_SERVING}g)`}>
          <Stepper
            label="인원"
            value={inputMode.servings}
            onChange={(v) => onInputModeChange({ kind: 'by-servings', servings: v })}
            min={1}
            max={MAX_SERVINGS}
            suffix="명"
          />
        </Field>
      )}

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
