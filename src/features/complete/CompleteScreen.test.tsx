import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Pour, Recipe } from '@/domain/types'
import type { BrewSession } from '@/domain/session'
import { c, g, ratio, s } from '@/domain/units'
import { CompleteScreen } from './CompleteScreen'

const mkPour = (i: number, atSec: number, amt: number, cum: number, bloom = false): Pour => ({
  index: i,
  atSec: s(atSec),
  pourAmount: g(amt),
  cumulativeWater: g(cum),
  ...(bloom ? { label: 'bloom' as const } : {}),
})

const recipe: Recipe = {
  method: 'kasuya_4_6',
  dripper: 'v60',
  coffee: g(20),
  totalWater: g(300),
  ratio: ratio(15),
  temperature: c(90),
  pours: [mkPour(0, 0, 60, 60), mkPour(1, 45, 60, 120), mkPour(2, 90, 90, 210), mkPour(3, 135, 90, 300)],
  totalTimeSec: s(208), // 3:28
  grindHint: 'medium-coarse',
  notes: [],
}

const baseSession: BrewSession = {
  recipe,
  startedAt: new Date(2026, 2, 14, 7, 42).getTime(),
  completedAt: new Date(2026, 2, 14, 7, 42).getTime() + 208_000,
}

describe('CompleteScreen', () => {
  it('renders 완료 header and formatted date', () => {
    render(<CompleteScreen session={baseSession} onFeelingChange={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('2026 · 03 · 14 · 오전 7:42')).toBeInTheDocument()
  })

  it('renders hero total time', () => {
    render(<CompleteScreen session={baseSession} onFeelingChange={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByText('오늘의 한 잔')).toBeInTheDocument()
    expect(screen.getByText('3:28')).toBeInTheDocument()
    expect(screen.getByText('잘 내렸습니다.')).toBeInTheDocument()
  })

  it('renders recipe summary fields', () => {
    render(<CompleteScreen session={baseSession} onFeelingChange={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByText('드리퍼')).toBeInTheDocument()
    expect(screen.getByText('V60')).toBeInTheDocument()
    expect(screen.getByText('레시피')).toBeInTheDocument()
    expect(screen.getByText('Kasuya 4:6')).toBeInTheDocument()
    expect(screen.getByText('원두 · 물')).toBeInTheDocument()
    expect(screen.getByText('20 · 300 g')).toBeInTheDocument()
    expect(screen.getByText('온도 · 분쇄')).toBeInTheDocument()
    expect(screen.getByText(/90° · 거친 설탕 정도/)).toBeInTheDocument()
  })

  it('renders 3 feeling buttons', () => {
    render(<CompleteScreen session={baseSession} onFeelingChange={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByRole('button', { name: '고요했다' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '잘 몰라' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '어수선했다' })).toBeInTheDocument()
  })

  it('calls onFeelingChange with feeling when tapped', () => {
    const onFeelingChange = vi.fn()
    render(<CompleteScreen session={baseSession} onFeelingChange={onFeelingChange} onExit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '고요했다' }))
    expect(onFeelingChange).toHaveBeenCalledWith('calm')
  })

  it('calls onFeelingChange with null when same feeling re-tapped', () => {
    const onFeelingChange = vi.fn()
    const sessionWithFeeling: BrewSession = { ...baseSession, feeling: 'calm' }
    render(
      <CompleteScreen
        session={sessionWithFeeling}
        onFeelingChange={onFeelingChange}
        onExit={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '고요했다' }))
    expect(onFeelingChange).toHaveBeenCalledWith(null)
  })

  it('marks selected feeling with aria-pressed', () => {
    const sessionWithFeeling: BrewSession = { ...baseSession, feeling: 'neutral' }
    render(
      <CompleteScreen
        session={sessionWithFeeling}
        onFeelingChange={vi.fn()}
        onExit={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: '잘 몰라' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '고요했다' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onExit when 처음으로 tapped', () => {
    const onExit = vi.fn()
    render(<CompleteScreen session={baseSession} onFeelingChange={vi.fn()} onExit={onExit} />)
    fireEvent.click(screen.getByRole('button', { name: '처음으로' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('renders 공유 button as disabled', () => {
    render(<CompleteScreen session={baseSession} onFeelingChange={vi.fn()} onExit={vi.fn()} />)
    const shareBtn = screen.getByRole('button', { name: '공유' })
    expect(shareBtn).toBeDisabled()
  })
})
