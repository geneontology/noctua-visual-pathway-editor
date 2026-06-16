import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAW_DIR = path.resolve(__dirname, '..', '..', 'tests', 'fixtures', 'raw', 'models')

export type FixtureName =
  | 'small-baseline'
  | 'diverse-relations'
  | 'large-scale'
  | 'indirect-regulation'
  | 'direct-regulation-heavy'
  | 'chemical-pathway'
  | 'empty-model'
  | 'review-state'

export const loadRaw = (name: FixtureName): unknown => {
  return JSON.parse(readFileSync(path.join(RAW_DIR, `${name}.json`), 'utf-8'))
}

const fakeUsers = [
  {
    nickname: 'Test User',
    uri: 'https://orcid.org/0000-0000-0000-0000',
    group: 'http://geneontology.org/groups/test',
    color: '#3b82f6',
  },
]

const fakeGroups = [
  { label: 'Test Group', id: 'http://geneontology.org/groups/test' },
]

const fakeUserInfo = {
  uri: 'https://orcid.org/0000-0000-0000-0000',
  token: 'test-barista-token',
  email: 'test@example.com',
  color: '#3b82f6',
  nickname: 'Test User',
  groups: fakeGroups,
}

const jsonResponse = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

export const mockBaristaMetadata = async (page: Page): Promise<void> => {
  await page.route('**/users', route => route.fulfill(jsonResponse(fakeUsers)))
  await page.route('**/groups', route => route.fulfill(jsonResponse(fakeGroups)))
}

/**
 * Mock the user_info_by_token endpoint used by useAuthSetup when a barista_token is present.
 * Pass a non-empty token to act as "logged in"; pass null to simulate an invalid token
 * (the response has no token field, which makes useAuthSetup clear auth state).
 */
export const mockUserInfoByToken = async (
  page: Page,
  opts: { loggedIn: boolean } = { loggedIn: true }
): Promise<void> => {
  await page.route('**/user_info_by_token/**', route =>
    route.fulfill(jsonResponse(opts.loggedIn ? fakeUserInfo : {}))
  )
}

export const mockBaristaModel = async (
  page: Page,
  fixture: FixtureName | unknown
): Promise<void> => {
  const raw =
    typeof fixture === 'string'
      ? loadRaw(fixture as FixtureName)
      : fixture
  await page.route('**/m3Batch*', route =>
    route.fulfill(jsonResponse({ data: raw }))
  )
}

export const getModelIdFromRaw = (raw: unknown): string => {
  if (!raw || typeof raw !== 'object') throw new Error('raw fixture is not an object')
  const id = (raw as { id?: unknown }).id
  if (typeof id !== 'string') throw new Error('raw fixture has no string id')
  return id
}

export const getTitleFromRaw = (raw: unknown): string => {
  if (!raw || typeof raw !== 'object') throw new Error('raw fixture is not an object')
  const annotations = (raw as { annotations?: Array<{ key: string; value: string }> }).annotations
  const title = annotations?.find(a => a.key === 'title')?.value
  if (!title) throw new Error('raw fixture has no title annotation')
  return title
}
