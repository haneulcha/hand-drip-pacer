import { methodsForDripper } from '@/domain/methods'
import type {
  BrewMethodId,
  DripperId,
  InputMode,
  RoastLevel,
  TasteProfile,
} from '@/domain/types'
import { g } from '@/domain/units'

export type AppState = {
  readonly inputMode: InputMode
  readonly dripper: DripperId
  readonly method: BrewMethodId
  readonly roast: RoastLevel
  readonly taste: TasteProfile
}

export const DEFAULT_STATE: AppState = {
  inputMode: { kind: 'by-coffee', coffee: g(20) },
  dripper: 'v60',
  method: 'kasuya_4_6',
  roast: 'medium',
  taste: { sweetness: 'balanced', strength: 'medium' },
}

// Merge a partial patch onto base and auto-correct dripper/method incompatibility.
export const mergeState = (base: AppState, patch: Partial<AppState>): AppState => {
  const merged = { ...base, ...patch }
  const compat = methodsForDripper(merged.dripper)
  if (!compat.some((m) => m.id === merged.method)) {
    return { ...merged, method: compat[0]!.id }
  }
  return merged
}
