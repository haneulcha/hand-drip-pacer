import { describe, expect, it } from 'vitest'
import { brewMethods, methodList, methodsForDripper } from './index'

describe('brew method registry', () => {
  it('includes all three v1 methods', () => {
    expect(Object.keys(brewMethods).sort()).toEqual([
      'hoffmann_v60',
      'kalita_pulse',
      'kasuya_4_6',
    ])
  })

  it('each method id matches its registry key', () => {
    for (const [key, method] of Object.entries(brewMethods)) {
      expect(method.id).toBe(key)
    }
  })

  it('methodList mirrors registry values', () => {
    expect(methodList).toHaveLength(3)
    expect(methodList.map((m) => m.id).sort()).toEqual([
      'hoffmann_v60',
      'kalita_pulse',
      'kasuya_4_6',
    ])
  })

  describe('methodsForDripper', () => {
    it('v60 → kasuya_4_6 + hoffmann_v60', () => {
      expect(methodsForDripper('v60').map((m) => m.id).sort()).toEqual([
        'hoffmann_v60',
        'kasuya_4_6',
      ])
    })

    it('kalita_wave → kalita_pulse only', () => {
      expect(methodsForDripper('kalita_wave').map((m) => m.id)).toEqual(['kalita_pulse'])
    })
  })
})
