import type { Recipe } from '@/domain/types'
import type { AppState } from '@/features/app/state'
import type {
  BrewMethodId,
  DripperId,
  RoastLevel,
  TasteProfile,
} from '@/domain/types'
import { InputPanel } from './InputPanel'
import { RecipeView } from './RecipeView'

type Props = {
  readonly state: AppState
  readonly recipe: Recipe
  readonly methodName: string
  readonly onCoffeeChange: (coffee: number) => void
  readonly onDripperChange: (dripper: DripperId) => void
  readonly onMethodChange: (method: BrewMethodId) => void
  readonly onRoastChange: (roast: RoastLevel) => void
  readonly onTasteChange: (taste: TasteProfile) => void
  readonly onReset: () => void
}

export function CalculatorPage({
  state,
  recipe,
  methodName,
  onCoffeeChange,
  onDripperChange,
  onMethodChange,
  onRoastChange,
  onTasteChange,
  onReset,
}: Props) {
  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <header className="border-b border-border px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight">핸드드립 계산기</h1>
        <p className="mt-0.5 text-xs text-text-muted">파라미터 → 레시피</p>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
        <InputPanel
          coffee={state.coffee}
          dripper={state.dripper}
          method={state.method}
          roast={state.roast}
          taste={state.taste}
          onCoffeeChange={onCoffeeChange}
          onDripperChange={onDripperChange}
          onMethodChange={onMethodChange}
          onRoastChange={onRoastChange}
          onTasteChange={onTasteChange}
        />
        <RecipeView recipe={recipe} methodName={methodName} onReset={onReset} />
      </main>
    </div>
  )
}
