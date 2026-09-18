import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import { getModelIdFromRaw, loadRaw, mockBaristaMetadata, mockBaristaModel } from './mocks/barista'
import {
  announcement,
  dateOffsetByDays,
  mockAnnouncementsFailure,
  mockAnnouncementsFeed,
} from './mocks/announcements'
import type { FeedAnnouncement } from './mocks/announcements'

// By test id, not role=status: the loading overlay is a status region too, and
// it is on screen while a model loads.
const banner = (page: Page) => page.getByTestId('announcement-banner')
const panel = (page: Page) => page.getByRole('dialog')
// The banner's "Close announcement" button also matches /announcement/, so the
// bell is addressed by its counting label.
const bell = (page: Page) =>
  page.getByRole('button', { name: /^\d+ (unread of \d+ )?announcements?$/ })

/** Loads the editor with a mocked model and a mocked announcements feed. */
const openEditor = async (page: Page, entries: FeedAnnouncement[] | 'broken') => {
  const raw = loadRaw('small-baseline')
  await mockBaristaMetadata(page)
  await mockBaristaModel(page, raw)
  if (entries === 'broken') {
    await mockAnnouncementsFailure(page)
  } else {
    await mockAnnouncementsFeed(page, entries)
  }
  await page.goto(buildModelUrl(getModelIdFromRaw(raw)))
  await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
}

test.describe('announcements — banner', () => {
  test('banners the topmost announcement with its description', async ({ page }) => {
    await openEditor(page, [
      announcement('maintenance', {
        title: 'Scheduled maintenance',
        description: 'Noctua is down Friday 4pm PST.',
        level: 'warning',
      }),
      announcement('older', { title: 'Older notice' }),
    ])

    await expect(banner(page)).toContainText('Scheduled maintenance')
    await expect(banner(page)).toContainText('Noctua is down Friday 4pm PST.')
    await expect(banner(page)).not.toContainText('Older notice')
  })

  test('links out to the details page in a new tab', async ({ page }) => {
    await openEditor(page, [
      announcement('release', { descriptionUrl: 'https://wiki.geneontology.org/release' }),
    ])

    const link = banner(page).getByRole('link', { name: 'More details' })
    await expect(link).toHaveAttribute('href', 'https://wiki.geneontology.org/release')
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test('closing the banner reveals the next announcement', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])

    await page.getByRole('button', { name: 'Close announcement' }).click()

    await expect(banner(page)).toContainText('Older notice')
  })

  test('a closed banner stays closed after a reload', async ({ page }) => {
    await openEditor(page, [announcement('only', { title: 'Only notice' })])
    await page.getByRole('button', { name: 'Close announcement' }).click()
    await expect(banner(page)).toHaveCount(0)

    await page.reload()
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    // Still listed in the panel: closing a banner is not dismissing it.
    await expect(bell(page)).toBeVisible()
    await expect(banner(page)).toHaveCount(0)
  })

  test('a newly published announcement banners even after an earlier one was closed', async ({
    page,
  }) => {
    await openEditor(page, [announcement('old', { title: 'Old notice' })])
    await page.getByRole('button', { name: 'Close announcement' }).click()
    await expect(banner(page)).toHaveCount(0)

    // The curator commits a new file; the next fetch carries both.
    await mockAnnouncementsFeed(page, [
      announcement('new', { title: 'Brand new notice' }),
      announcement('old', { title: 'Old notice' }),
    ])
    await page.reload()

    await expect(banner(page)).toContainText('Brand new notice')
  })

  test('a pinned announcement cannot be closed', async ({ page }) => {
    await openEditor(page, [
      announcement('pin', { title: 'Pinned notice', pinned: true, level: 'danger' }),
    ])

    await expect(banner(page)).toContainText('Pinned notice')
    await expect(page.getByRole('button', { name: 'Close announcement' })).toHaveCount(0)
  })
})

test.describe('announcements — scheduling and targeting', () => {
  test('shows nothing when no announcement is aimed at this app', async ({ page }) => {
    await openEditor(page, [
      announcement('landing', { title: 'Landing page notice', apps: ['landing-page'] }),
      announcement('sae', { title: 'SAE notice', apps: ['sae'] }),
    ])

    await expect(banner(page)).toHaveCount(0)
    await expect(bell(page)).toHaveCount(0)
  })

  test('hides an announcement that has not started yet', async ({ page }) => {
    await openEditor(page, [
      announcement('future', { title: 'Next week', starts: dateOffsetByDays(7) }),
    ])

    await expect(banner(page)).toHaveCount(0)
  })

  test('hides an expired announcement and keeps the live one', async ({ page }) => {
    await openEditor(page, [
      announcement('expired', { title: 'Last week', expires: dateOffsetByDays(-1) }),
      announcement('live', { title: 'Still running', expires: dateOffsetByDays(7) }),
    ])

    await expect(banner(page)).toContainText('Still running')
    await expect(banner(page)).not.toContainText('Last week')
    await expect(bell(page)).toHaveAccessibleName('1 unread of 1 announcements')
  })

  test('shows one that starts today', async ({ page }) => {
    await openEditor(page, [
      announcement('today', { title: 'Starting today', starts: dateOffsetByDays(0) }),
    ])

    await expect(banner(page)).toContainText('Starting today')
  })

  // The dev server runs with VITE_APP_ENV=dev, which is exactly where a testing
  // announcement is meant to show. Production hiding it is covered by the unit
  // tests, which can swap the environment.
  test('shows a testing announcement on dev', async ({ page }) => {
    await openEditor(page, [
      announcement('draft', { title: 'Draft notice', testing: true }),
    ])

    await expect(banner(page)).toContainText('Draft notice')
  })
})

test.describe('announcements — panel', () => {
  test('opens from the banner and lists everything, including what was closed', async ({
    page,
  }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])
    await page.getByRole('button', { name: 'Close announcement' }).click()

    await bell(page).click()

    await expect(panel(page).getByText('Notifications')).toBeVisible()
    await expect(panel(page).getByText('Newest notice')).toBeVisible()
    await expect(panel(page).getByText('Older notice')).toBeVisible()
  })

  test('opens from View more on the banner', async ({ page }) => {
    await openEditor(page, [announcement('a', { title: 'A notice' })])

    await page.getByRole('button', { name: 'View more' }).click()

    await expect(panel(page).getByText('A notice')).toBeVisible()
  })

  test('expands a row to reveal the body, and collapses it again', async ({ page }) => {
    await openEditor(page, [
      announcement('a', {
        title: 'A notice',
        description: 'One line summary',
        body: '<p>The full announcement text.</p>',
      }),
    ])
    await page.getByRole('button', { name: 'View more' }).click()

    await panel(page).getByText('A notice').click()
    await expect(panel(page).getByText('The full announcement text.')).toBeVisible()

    await panel(page).getByText('A notice').click()
    await expect(panel(page).getByText('The full announcement text.')).toHaveCount(0)
    await expect(panel(page).getByText('One line summary')).toBeVisible()
  })

  test('keeps only one row expanded at a time', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'First notice', body: '<p>First body</p>' }),
      announcement('second', { title: 'Second notice', body: '<p>Second body</p>' }),
    ])
    await page.getByRole('button', { name: 'View more' }).click()

    await panel(page).getByText('First notice').click()
    await expect(panel(page).getByText('First body')).toBeVisible()

    await panel(page).getByText('Second notice').click()
    await expect(panel(page).getByText('Second body')).toBeVisible()
    await expect(panel(page).getByText('First body')).toHaveCount(0)
  })

  test('reading an announcement leaves its banner up', async ({ page }) => {
    await openEditor(page, [
      announcement('a', { title: 'A notice', body: '<p>The full text</p>' }),
    ])

    await page.getByRole('button', { name: 'View more' }).click()
    await panel(page).getByText('A notice').click()

    await expect(panel(page).getByText('The full text')).toBeVisible()
    await expect(banner(page)).toContainText('A notice')
  })
})

test.describe('announcements — bell', () => {
  test('counts the unread announcements for this app', async ({ page }) => {
    await openEditor(page, [
      announcement('a'),
      announcement('b'),
      announcement('c', { apps: ['landing-page'] }),
    ])

    await expect(bell(page)).toHaveAccessibleName('2 unread of 2 announcements')
  })

  test('drops the badge once everything has been read, keeping the bell', async ({ page }) => {
    await openEditor(page, [announcement('a', { title: 'A notice' })])

    await bell(page).click()
    await panel(page).getByText('A notice').click()

    await expect(bell(page)).toHaveAccessibleName('1 announcement')
  })

  test('remembers what was read after a reload', async ({ page }) => {
    await openEditor(page, [announcement('a', { title: 'A notice' })])
    await bell(page).click()
    await panel(page).getByText('A notice').click()
    await expect(bell(page)).toHaveAccessibleName('1 announcement')

    await page.reload()
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    await expect(bell(page)).toHaveAccessibleName('1 announcement')
  })
})

test.describe('announcements — dismissing', () => {
  test('dismissing removes it from the panel, the banner and the bell', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])
    await page.getByRole('button', { name: 'View more' }).click()

    await panel(page).getByRole('button', { name: 'Dismiss Newest notice' }).click()

    await expect(panel(page).getByText('Newest notice')).toHaveCount(0)
    await expect(banner(page)).toContainText('Older notice')
    await expect(bell(page)).toHaveAccessibleName('1 unread of 1 announcements')
  })

  test('Clear all empties the panel and the banner', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])
    await page.getByRole('button', { name: 'View more' }).click()

    await panel(page).getByRole('button', { name: 'Clear all' }).click()

    await expect(panel(page).getByText("You're all caught up")).toBeVisible()
    await expect(banner(page)).toHaveCount(0)
  })

  test('Clear all leaves a pinned announcement in place', async ({ page }) => {
    await openEditor(page, [
      announcement('pin', { title: 'Pinned notice', pinned: true }),
      announcement('normal', { title: 'Ordinary notice' }),
    ])
    await page.getByRole('button', { name: 'View more' }).click()

    await panel(page).getByRole('button', { name: 'Clear all' }).click()

    await expect(panel(page).getByText('Ordinary notice')).toHaveCount(0)
    await expect(panel(page).getByText('Pinned notice')).toBeVisible()
    await expect(banner(page)).toContainText('Pinned notice')
  })

  test('a dismissal survives a reload', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])
    await page.getByRole('button', { name: 'View more' }).click()
    await panel(page).getByRole('button', { name: 'Dismiss Newest notice' }).click()

    await page.reload()
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    await expect(banner(page)).toContainText('Older notice')
    await expect(bell(page)).toHaveAccessibleName('1 unread of 1 announcements')
  })
})

// Announcements are never load-bearing: a broken feed must leave the editor
// completely usable.
test.describe('announcements — a broken feed', () => {
  test('an HTTP error leaves the editor working with no banner', async ({ page }) => {
    await openEditor(page, 'broken')

    await expect(banner(page)).toHaveCount(0)
    await expect(bell(page)).toHaveCount(0)
    await expect(page.getByTestId('model-title')).toBeVisible()
  })

  test('a body that is not JSON leaves the editor working', async ({ page }) => {
    const raw = loadRaw('small-baseline')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await mockAnnouncementsFailure(page, 'unparseable')
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))

    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
    await expect(banner(page)).toHaveCount(0)
  })

  test('an unreachable feed leaves the editor working', async ({ page }) => {
    const raw = loadRaw('small-baseline')
    await mockBaristaMetadata(page)
    await mockBaristaModel(page, raw)
    await mockAnnouncementsFailure(page, 'offline')
    await page.goto(buildModelUrl(getModelIdFromRaw(raw)))

    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })
    await expect(banner(page)).toHaveCount(0)
  })
})
