import type { GrindHint } from '@/domain/types'

export const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const GRIND_HINT_LABEL: Record<GrindHint, string> = {
  fine: '설탕 정도',
  'medium-fine': '고운 소금 정도',
  medium: '굵은 소금 정도',
  'medium-coarse': '거친 설탕 정도',
  coarse: '굵은 후추 정도',
}

export const formatGrindHint = (hint: GrindHint): string => GRIND_HINT_LABEL[hint]
