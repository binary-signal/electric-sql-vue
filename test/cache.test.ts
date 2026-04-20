import { describe, it, expect } from 'vitest'
import { sortedOptionsHash } from '../src/cache'

describe('sortedOptionsHash', () => {
  it('produces same hash regardless of property order', () => {
    const a = sortedOptionsHash({ url: 'http://localhost:3000/v1/shape', params: { table: 'items', where: 'id > 1' } })
    const b = sortedOptionsHash({ params: { where: 'id > 1', table: 'items' }, url: 'http://localhost:3000/v1/shape' })
    expect(a).toBe(b)
  })

  it('produces different hash for different options', () => {
    const a = sortedOptionsHash({ url: 'http://localhost:3000/v1/shape', params: { table: 'items' } })
    const b = sortedOptionsHash({ url: 'http://localhost:3000/v1/shape', params: { table: 'users' } })
    expect(a).not.toBe(b)
  })
})
