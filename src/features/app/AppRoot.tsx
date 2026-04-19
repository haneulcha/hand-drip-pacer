import { useCallback, useEffect, useMemo, useState } from 'react'
import { brewMethods } from '@/domain/methods'
import type {
  BrewMethodId,
  DripperId,
  RecipeInput,
  RoastLevel,
  TasteProfile,
} from '@/domain/types'
import type { BrewSession, Feeling } from '@/domain/session'
import { g } from '@/domain/units'
import { BrewingScreen } from '@/features/brewing/BrewingScreen'
import { CompleteScreen } from '@/features/complete/CompleteScreen'
import { RecipeScreen } from '@/features/recipe/RecipeScreen'
import { WallScreen } from '@/features/wall/WallScreen'
import { loadParams, saveParams, saveSession } from '@/features/share/storage'
import { decodeState, encodeState } from '@/features/share/urlCodec'
import { DEFAULT_STATE, mergeState, type AppState } from './state'

const loadInitialState = (): AppState => {
  const fromUrl = decodeState(new URLSearchParams(window.location.search))
  const hasUrl = Object.keys(fromUrl).length > 0
  if (hasUrl) return mergeState(DEFAULT_STATE, { ...fromUrl, screen: 'recipe' })
  const stored = loadParams()
  if (stored) return mergeState(DEFAULT_STATE, decodeState(stored))
  return DEFAULT_STATE
}

export function AppRoot() {
  const [state, setState] = useState<AppState>(loadInitialState)
  const [session, setSession] = useState<BrewSession | null>(null)

  useEffect(() => {
    const params = encodeState(state)
    if (state.screen === 'wall') {
      window.history.replaceState(null, '', window.location.pathname)
    } else {
      window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
    }
    saveParams(params)
  }, [state])

  const patch = (p: Partial<AppState>): void => setState((prev) => mergeState(prev, p))

  const handleDripperChange = (dripper: DripperId): void => patch({ dripper })
  const handleMethodChange = (method: BrewMethodId): void => patch({ method })
  const handleRoastChange = (roast: RoastLevel): void => patch({ roast })
  const handleTasteChange = (taste: TasteProfile): void => patch({ taste })
  const handleCoffeeChange = (coffee: number): void => patch({ coffee: g(coffee) })

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

  const handleStart = (): void => {
    setSession({ recipe, startedAt: Date.now() })
    patch({ screen: 'brewing' })
  }

  const handleComplete = useCallback((): void => {
    setSession((prev) => (prev ? { ...prev, completedAt: Date.now() } : null))
    setState((prev) => mergeState(prev, { screen: 'complete' }))
  }, [])

  const handleFeeling = (feeling: Feeling | null): void => {
    setSession((prev) => {
      if (!prev) return null
      return { ...prev, feeling: feeling ?? undefined }
    })
  }

  const handleExit = (): void => {
    if (session) saveSession(session)
    setSession(null)
    patch({ screen: 'wall' })
  }

  const handlePickDripper = (dripper: DripperId): void => {
    patch({ dripper, screen: 'recipe' })
  }

  if (state.screen === 'wall') {
    return <WallScreen selectedDripper={state.dripper} onPickDripper={handlePickDripper} />
  }

  if (state.screen === 'brewing' && session) {
    return (
      <BrewingScreen session={session} onExit={handleExit} onComplete={handleComplete} />
    )
  }

  if (state.screen === 'complete' && session) {
    return (
      <CompleteScreen session={session} onFeelingChange={handleFeeling} onExit={handleExit} />
    )
  }

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
