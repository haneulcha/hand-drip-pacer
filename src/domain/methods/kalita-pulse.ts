import { c, g, ratio, s } from '../units'
import type {
  BrewMethod,
  Pour,
  Recipe,
  RecipeInput,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from '../types'

const METHOD_RATIO = 16
const BLOOM_RATIO_TO_COFFEE = 2
const PULSE_INTERVAL_SEC = 30
const DRAWDOWN_SEC = 30

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 96,
  medium: 93,
  dark: 90,
}

const bloomDurationBySweetness: Record<SweetnessProfile, number> = {
  sweet: 60,
  balanced: 45,
  bright: 30,
}

// Weight pattern for pulses after bloom. Relative only — normalized to remaining water.
// design.md는 medium/strong을 5푸어로 묶어 사이즈 차등이 없음. strong은 중간 펄스를
// 더 키워 체감 농도를 강화 (사용자 결정 반영).
const pulseWeightsByStrength: Record<StrengthProfile, readonly number[]> = {
  light: [3, 4, 3],
  medium: [3, 4, 4, 3],
  strong: [3, 5, 5, 3],
}

const compute = (input: RecipeInput): Recipe => {
  const { coffee, roast, taste } = input
  const totalWater = coffee * METHOD_RATIO
  const bloom = Math.round(coffee * BLOOM_RATIO_TO_COFFEE)
  const remaining = totalWater - bloom

  const weights = pulseWeightsByStrength[taste.strength]
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const pulses = weights.map((w) => Math.round((remaining * w) / weightSum))

  // absorb rounding drift into the final pulse so bloom + sum(pulses) === totalWater
  const pulseSum = pulses.reduce((a, b) => a + b, 0)
  const lastIdx = pulses.length - 1
  pulses[lastIdx] = pulses[lastIdx]! + (remaining - pulseSum)

  const bloomDuration = bloomDurationBySweetness[taste.sweetness]
  const amounts = [bloom, ...pulses]

  let cumulative = 0
  const pours: readonly Pour[] = amounts.map((amt, i) => {
    cumulative += amt
    const atSec = i === 0 ? 0 : bloomDuration + (i - 1) * PULSE_INTERVAL_SEC
    const base = {
      index: i,
      atSec: s(atSec),
      pourAmount: g(amt),
      cumulativeWater: g(cumulative),
    }
    return i === 0 ? { ...base, label: 'bloom' as const } : base
  })

  const lastAtSec = pours[pours.length - 1]!.atSec

  return {
    method: 'kalita_pulse',
    dripper: 'kalita_wave',
    coffee,
    totalWater: g(totalWater),
    ratio: ratio(METHOD_RATIO),
    temperature: c(temperatureByRoast[roast]),
    pours,
    totalTimeSec: s(lastAtSec + DRAWDOWN_SEC),
    grindHint: 'medium',
    notes: [
      '각 푸어는 물이 거의 다 빠지기 전에 시작. 수위를 일정하게 유지.',
      '중심만 좁게 붓고 외곽은 건드리지 않기.',
    ],
  }
}

export const kalitaPulse: BrewMethod = {
  id: 'kalita_pulse',
  name: 'Kalita Wave 펄스',
  description: '평평한 바닥의 Kalita에 맞춘 펄스 추출. 짧게 끊어 부어 수위를 일정하게 유지.',
  supportedDrippers: ['kalita_wave'],
  defaultRatio: ratio(METHOD_RATIO),
  compute,
}
