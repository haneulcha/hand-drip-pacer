import type { BrewMethod, BrewMethodId, DripperId } from '../types'
import { hoffmannV60 } from './hoffmann-v60'
import { kalitaPulse } from './kalita-pulse'
import { kasuya46 } from './kasuya-4-6'

export const brewMethods: Record<BrewMethodId, BrewMethod> = {
  kasuya_4_6: kasuya46,
  hoffmann_v60: hoffmannV60,
  kalita_pulse: kalitaPulse,
}

export const methodList: readonly BrewMethod[] = Object.values(brewMethods)

export const methodsForDripper = (dripper: DripperId): readonly BrewMethod[] =>
  methodList.filter((m) => m.supportedDrippers.includes(dripper))
