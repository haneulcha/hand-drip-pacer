import { describe, expect, it } from 'vitest'
import { COFFEE_PER_SERVING, MAX_SERVINGS, toCoffeeGrams } from './servings'
import { g } from './units'

describe('servings', () => {
  it('COFFEE_PER_SERVING is 15g', () => {
    expect(COFFEE_PER_SERVING).toBe(15)
  })

  it('MAX_SERVINGS is 6', () => {
    expect(MAX_SERVINGS).toBe(6)
  })

  describe('toCoffeeGrams', () => {
    it('by-coffee returns coffee as-is', () => {
      expect(toCoffeeGrams({ kind: 'by-coffee', coffee: g(22) })).toBe(22)
    })

    it('by-servings multiplies by COFFEE_PER_SERVING', () => {
      expect(toCoffeeGrams({ kind: 'by-servings', servings: 1 })).toBe(15)
      expect(toCoffeeGrams({ kind: 'by-servings', servings: 3 })).toBe(45)
      expect(toCoffeeGrams({ kind: 'by-servings', servings: MAX_SERVINGS })).toBe(90)
    })
  })
})
