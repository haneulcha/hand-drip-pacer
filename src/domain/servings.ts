import type { Grams, InputMode } from './types'
import { g } from './units'

export const COFFEE_PER_SERVING: Grams = g(15)
export const MAX_SERVINGS = 6

export const toCoffeeGrams = (mode: InputMode): Grams => {
  switch (mode.kind) {
    case 'by-coffee':
      return mode.coffee
    case 'by-servings':
      return g(mode.servings * COFFEE_PER_SERVING)
  }
}
