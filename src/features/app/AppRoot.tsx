import { useEffect, useMemo, useState } from 'react'
import { brewMethods } from '@/domain/methods'
import type {
  BrewMethodId,
  DripperId,
  RecipeInput,
  RoastLevel,
  TasteProfile,
} from '@/domain/types'
import { g } from '@/domain/units'
import { CalculatorPage } from '@/features/calculator/CalculatorPage'
import { clearParams, loadParams, saveParams } from '@/features/share/storage'
import { decodeState, encodeState } from '@/features/share/urlCodec'
import { DEFAULT_STATE, mergeState, type AppState } from './state'

const loadInitialState = (): AppState => {
  const fromUrl = decodeState(new URLSearchParams(window.location.search))
  const hasUrl = Object.keys(fromUrl).length > 0
  if (hasUrl) return mergeState({ ...DEFAULT_STATE, screen: 'recipe' }, fromUrl)
  const stored = loadParams()
  if (stored) return mergeState(DEFAULT_STATE, decodeState(stored))
  return DEFAULT_STATE
}

export function AppRoot() {
  const [state, setState] = useState<AppState>(loadInitialState)

  useEffect(() => {
    const params = encodeState(state)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
    saveParams(params)
  }, [state])

  const patch = (p: Partial<AppState>): void => setState((prev) => mergeState(prev, p))

  const handleDripperChange = (dripper: DripperId): void => patch({ dripper })
  const handleMethodChange = (method: BrewMethodId): void => patch({ method })
  const handleRoastChange = (roast: RoastLevel): void => patch({ roast })
  const handleTasteChange = (taste: TasteProfile): void => patch({ taste })
  const handleCoffeeChange = (coffee: number): void => patch({ coffee: g(coffee) })

  const handleReset = (): void => {
    setState(DEFAULT_STATE)
    clearParams()
  }

  const recipe = useMemo(() => {
    const input: RecipeInput = {
      method: state.method,
      dripper: state.dripper,
      coffee: state.coffee,
      roast: state.roast,
      taste: state.taste,
    }
    return brewMethods[state.method].compute(input)
  }, [state.method, state.dripper, state.coffee, state.roast, state.taste])

  const methodMeta = brewMethods[state.method]

  // Phase 0: screen 상태는 추가됐지만 'recipe' 하나만 라우팅.
  // Phase 1에서 RecipeScreen으로 교체, Phase 2~4에서 분기 확장.
  if (state.screen === 'recipe') {
    return (
      <CalculatorPage
        state={state}
        recipe={recipe}
        methodName={methodMeta.name}
        onCoffeeChange={handleCoffeeChange}
        onDripperChange={handleDripperChange}
        onMethodChange={handleMethodChange}
        onRoastChange={handleRoastChange}
        onTasteChange={handleTasteChange}
        onReset={handleReset}
      />
    )
  }

  return null
}
