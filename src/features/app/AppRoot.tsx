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
import { RecipeScreen } from '@/features/recipe/RecipeScreen'
import { loadParams, saveParams } from '@/features/share/storage'
import { decodeState, encodeState } from '@/features/share/urlCodec'
import { DEFAULT_STATE, mergeState, type AppState } from './state'

const loadInitialState = (): AppState => {
  const fromUrl = decodeState(new URLSearchParams(window.location.search))
  const hasUrl = Object.keys(fromUrl).length > 0
  if (hasUrl) return mergeState(DEFAULT_STATE, fromUrl)
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

  const handleStart = (): void => {
    // Phase 2: patch({ screen: 'brewing', startedAt: Date.now() })
    // Phase 1: placeholder
    // eslint-disable-next-line no-console
    console.log('[Phase 1] 시작 tapped — Brewing 화면은 Phase 2에서.')
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

  if (state.screen === 'recipe') {
    return (
      <RecipeScreen
        coffee={state.coffee}
        dripper={state.dripper}
        method={state.method}
        roast={state.roast}
        taste={state.taste}
        recipe={recipe}
        onCoffeeChange={handleCoffeeChange}
        onDripperChange={handleDripperChange}
        onMethodChange={handleMethodChange}
        onRoastChange={handleRoastChange}
        onTasteChange={handleTasteChange}
        onStart={handleStart}
      />
    )
  }

  return null
}
