import { describe, expect, it } from 'vitest'
import { g } from '@/domain/units'
import { DEFAULT_STATE, type AppState } from '../calculator/state'
import { decodeState, encodeState } from './urlCodec'

describe('urlCodec', () => {
  describe('round-trip', () => {
    it('default state survives encode → decode', () => {
      const decoded = decodeState(encodeState(DEFAULT_STATE))
      expect({ ...DEFAULT_STATE, ...decoded }).toEqual(DEFAULT_STATE)
    })

    it('preserves by-servings mode', () => {
      const state: AppState = {
        ...DEFAULT_STATE,
        inputMode: { kind: 'by-servings', servings: 3 },
      }
      const decoded = decodeState(encodeState(state))
      expect(decoded.inputMode).toEqual({ kind: 'by-servings', servings: 3 })
    })

    it('preserves all non-default fields', () => {
      const state: AppState = {
        inputMode: { kind: 'by-coffee', coffee: g(35) },
        dripper: 'kalita_wave',
        method: 'kalita_pulse',
        roast: 'dark',
        taste: { sweetness: 'bright', strength: 'strong' },
      }
      expect({ ...DEFAULT_STATE, ...decodeState(encodeState(state)) }).toEqual(state)
    })
  })

  describe('decode validation', () => {
    it('empty params → empty patch', () => {
      expect(decodeState(new URLSearchParams())).toEqual({})
    })

    it('rejects out-of-range coffee', () => {
      expect(decodeState(new URLSearchParams('c=4'))).toEqual({})
      expect(decodeState(new URLSearchParams('c=51'))).toEqual({})
      expect(decodeState(new URLSearchParams('c=abc'))).toEqual({})
      expect(decodeState(new URLSearchParams('c=20.5'))).toEqual({})
    })

    it('rejects out-of-range servings', () => {
      expect(decodeState(new URLSearchParams('sv=0'))).toEqual({})
      expect(decodeState(new URLSearchParams('sv=7'))).toEqual({})
    })

    it('prefers coffee over servings when both present', () => {
      const decoded = decodeState(new URLSearchParams('c=25&sv=3'))
      expect(decoded.inputMode).toEqual({ kind: 'by-coffee', coffee: 25 })
    })

    it('rejects invalid enum values', () => {
      expect(decodeState(new URLSearchParams('d=espresso'))).toEqual({})
      expect(decodeState(new URLSearchParams('m=aeropress'))).toEqual({})
      expect(decodeState(new URLSearchParams('r=medium-rare'))).toEqual({})
    })

    it('requires BOTH sweetness and strength for taste patch', () => {
      expect(decodeState(new URLSearchParams('sw=sweet')).taste).toBeUndefined()
      expect(decodeState(new URLSearchParams('st=strong')).taste).toBeUndefined()
      expect(decodeState(new URLSearchParams('sw=sweet&st=strong')).taste).toEqual({
        sweetness: 'sweet',
        strength: 'strong',
      })
    })

    it('accepts partial valid params and ignores unknowns', () => {
      expect(decodeState(new URLSearchParams('d=kalita_wave&foo=bar'))).toEqual({
        dripper: 'kalita_wave',
      })
    })
  })
})
