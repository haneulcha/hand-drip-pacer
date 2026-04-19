import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pour, Recipe } from '@/domain/types'
import { c, g, ratio, s } from '@/domain/units'
import type { BrewSession } from '@/domain/session'
import { BrewingScreen } from './BrewingScreen'

const mkPour = (i: number, atSec: number, amt: number, cum: number, bloom = false): Pour => ({
  index: i,
  atSec: s(atSec),
  pourAmount: g(amt),
  cumulativeWater: g(cum),
  ...(bloom ? { label: 'bloom' as const } : {}),
})

const recipe: Recipe = {
  method: 'hoffmann_v60',
  dripper: 'v60',
  coffee: g(15),
  totalWater: g(250),
  ratio: ratio(16.67),
  temperature: c(93),
  pours: [
    mkPour(0, 0, 30, 30, true),
    mkPour(1, 45, 120, 150),
    mkPour(2, 75, 100, 250),
  ],
  totalTimeSec: s(210),
  grindHint: 'medium-fine',
  notes: [],
}

// Session with startedAt anchored at mocked Date.now; we override Date.now inside tests.
const makeSession = (startedAt: number): BrewSession => ({ recipe, startedAt })

describe('BrewingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows hero weight of active step (bloom at elapsed=0)', () => {
    vi.setSystemTime(new Date(1_000_000_000_000))
    const session = makeSession(1_000_000_000_000)
    render(<BrewingScreen session={session} onExit={vi.fn()} />)
    // bloom pour cumulativeWater = 30
    expect(screen.getByTestId('hero-weight')).toHaveTextContent('30')
    // label for active step in progress rail
    expect(screen.getByText('뜸')).toBeInTheDocument()
  })

  it('shows done state when elapsed >= totalTime', () => {
    vi.setSystemTime(new Date(1_000_000_000_000))
    const session = makeSession(1_000_000_000_000 - 300_000) // 300s elapsed
    render(<BrewingScreen session={session} onExit={vi.fn()} />)
    expect(screen.getByText('완료')).toBeInTheDocument()
    // totalWater shown as final target
    expect(screen.getByTestId('hero-weight')).toHaveTextContent('250')
  })

  it('opens stop dialog when 중단 tapped', () => {
    vi.setSystemTime(new Date(1_000_000_000_000))
    const session = makeSession(1_000_000_000_000)
    render(<BrewingScreen session={session} onExit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '중단' }))
    expect(screen.getByText('브루잉을 중단할까요?')).toBeInTheDocument()
  })

  it('calls onExit when 처음으로 confirmed in dialog', () => {
    vi.setSystemTime(new Date(1_000_000_000_000))
    const session = makeSession(1_000_000_000_000)
    const onExit = vi.fn()
    render(<BrewingScreen session={session} onExit={onExit} />)
    fireEvent.click(screen.getByRole('button', { name: '중단' }))
    fireEvent.click(screen.getByRole('button', { name: '처음으로' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('shows 처음으로 button when done', () => {
    vi.setSystemTime(new Date(1_000_000_000_000))
    const session = makeSession(1_000_000_000_000 - 300_000)
    const onExit = vi.fn()
    render(<BrewingScreen session={session} onExit={onExit} />)
    fireEvent.click(screen.getByRole('button', { name: '처음으로' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
