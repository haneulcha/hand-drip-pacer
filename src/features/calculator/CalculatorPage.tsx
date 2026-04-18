import { useEffect, useMemo, useState } from 'react'
import { brewMethods } from '@/domain/methods'
import { toCoffeeGrams } from '@/domain/servings'
import type {
  BrewMethodId,
  DripperId,
  InputMode,
  RecipeInput,
  RoastLevel,
  TasteProfile,
} from '@/domain/types'
import { clearParams, loadParams, saveParams } from '@/features/share/storage'
import { decodeState, encodeState } from '@/features/share/urlCodec'
import { InputPanel } from './InputPanel'
import { RecipeView } from './RecipeView'
import { DEFAULT_STATE, mergeState, type AppState } from './state'

const loadInitialState = (): AppState => {
  const fromUrl = decodeState(new URLSearchParams(window.location.search))
  if (Object.keys(fromUrl).length > 0) {
    return mergeState(DEFAULT_STATE, fromUrl)
  }
  const stored = loadParams()
  if (stored) {
    return mergeState(DEFAULT_STATE, decodeState(stored))
  }
  return DEFAULT_STATE
}

export function CalculatorPage() {
  const [state, setState] = useState<AppState>(loadInitialState)

  useEffect(() => {
    const params = encodeState(state)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
    saveParams(params)
  }, [state])

  const patch = (p: Partial<AppState>): void => setState((prev) => mergeState(prev, p))

  const handleInputModeChange = (inputMode: InputMode): void => patch({ inputMode })
  const handleDripperChange = (dripper: DripperId): void => patch({ dripper })
  const handleMethodChange = (method: BrewMethodId): void => patch({ method })
  const handleRoastChange = (roast: RoastLevel): void => patch({ roast })
  const handleTasteChange = (taste: TasteProfile): void => patch({ taste })

  const handleReset = (): void => {
    setState(DEFAULT_STATE)
    clearParams()
  }

  const recipe = useMemo(() => {
    const input: RecipeInput = {
      method: state.method,
      dripper: state.dripper,
      coffee: toCoffeeGrams(state.inputMode),
      roast: state.roast,
      taste: state.taste,
    }
    return brewMethods[state.method].compute(input)
  }, [state])

  const methodMeta = brewMethods[state.method]

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <header className="border-b border-border px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Hand Drip Calculator</h1>
        <p className="mt-0.5 text-xs text-text-muted">파라미터 → 레시피</p>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
        <InputPanel
          inputMode={state.inputMode}
          dripper={state.dripper}
          method={state.method}
          roast={state.roast}
          taste={state.taste}
          onInputModeChange={handleInputModeChange}
          onDripperChange={handleDripperChange}
          onMethodChange={handleMethodChange}
          onRoastChange={handleRoastChange}
          onTasteChange={handleTasteChange}
        />
        <RecipeView recipe={recipe} methodName={methodMeta.name} onReset={handleReset} />
      </main>
    </div>
  )
}
