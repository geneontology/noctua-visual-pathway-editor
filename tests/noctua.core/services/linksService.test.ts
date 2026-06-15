import { describe, it, expect } from 'vitest'
import { getBaristaApiUrl } from '@/@noctua.core/services/linksService'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

describe('getBaristaApiUrl', () => {
  const base = `${ENVIRONMENT.globalBaristaLocation}/api/${ENVIRONMENT.globalMinervaDefinitionName}/m3Batch`

  it('returns the privileged URL when a barista token is provided', () => {
    expect(getBaristaApiUrl('some-token')).toBe(`${base}Privileged`)
  })

  it('returns the unprivileged URL when no token is provided (empty string)', () => {
    expect(getBaristaApiUrl('')).toBe(base)
  })

  it('treats any non-empty token as privileged (even whitespace)', () => {
    // The check is `baristaToken ? ...` so any truthy string flips to Privileged.
    expect(getBaristaApiUrl(' ')).toBe(`${base}Privileged`)
  })
})
