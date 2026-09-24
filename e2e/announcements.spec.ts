import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { buildModelUrl } from './fixtures/test-urls'
import { getModelIdFromRaw, loadRaw, mockBaristaMetadata, mockBaristaModel } from './mocks/barista'
import {
  announcement,
  dateOffsetByDays,
  instantOffsetBySeconds,
  mockAnnouncementsFailure,
  mockAnnouncementsFeed,
} from './mocks/announcements'
import type { FeedSource } from './mocks/announcements'

// By test id, not role=status: the loading overlay is a status region too, and
// it is on screen while a model loads. Same for the pinned strip.
const banner = (page: Page) => page.getByTestId('announcement-banner')
const strip = (page: Page) => page.getByTestId('pinned-announcement')
const panel = (page: Page) => page.getByRole('dialog')
// The banner's "Close announcement" button also matches /announcement/, so the
// bell is addressed by its counting label.
const bell = (page: Page) =>
  page.getByRole('button', { name: /^(No|\d+( unread of \d+)?) announcements?$/ })
const showRead = (page: Page) => panel(page).getByRole('switch', { name: 'Show read' })

/** Loads the editor with a mocked model and a mocked announcements feed. */
const openEditor = async (page: Page, entries: FeedSource | 'broken') => {
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

const reloadEditor = async (page: Page) => {
  await page.reload()
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

  test('Got it reveals the next announcement', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])

    await banner(page).getByRole('button', { name: 'Got it' }).click()

    await expect(banner(page)).toContainText('Older notice')
  })

  test('✕ acknowledges it just like Got it', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])

    await banner(page).getByRole('button', { name: 'Close announcement' }).click()

    await expect(banner(page)).toContainText('Older notice')
    // Dismissed, not read: it still counts.
    await expect(bell(page)).toHaveAccessibleName('2 unread of 2 announcements')
  })

  test('an acknowledged announcement stays down after a reload', async ({ page }) => {
    await openEditor(page, [announcement('only', { title: 'Only notice' })])
    await banner(page).getByRole('button', { name: 'Got it' }).click()
    await expect(banner(page)).toHaveCount(0)

    await reloadEditor(page)

    await expect(bell(page)).toHaveAccessibleName('1 unread of 1 announcements')
    await expect(banner(page)).toHaveCount(0)
  })

  test('a newly published announcement banners even after an earlier one was acknowledged', async ({
    page,
  }) => {
    await openEditor(page, [announcement('old', { title: 'Old notice' })])
    await banner(page).getByRole('button', { name: 'Got it' }).click()
    await expect(banner(page)).toHaveCount(0)

    // The curator commits a new file; the next fetch carries both.
    await mockAnnouncementsFeed(page, [
      announcement('new', { title: 'Brand new notice' }),
      announcement('old', { title: 'Old notice' }),
    ])
    await page.reload()

    await expect(banner(page)).toContainText('Brand new notice')
  })

  test('floats over the page instead of moving it', async ({ page }) => {
    await openEditor(page, [])
    const before = await page.getByTestId('model-title').boundingBox()

    await mockAnnouncementsFeed(page, [announcement('a', { title: 'A notice' })])
    await reloadEditor(page)
    await expect(banner(page)).toBeVisible()

    expect(await page.getByTestId('model-title').boundingBox()).toEqual(before)
  })
})

test.describe('announcements — pinned', () => {
  test('gets the strip above the top nav, with no way to close it', async ({ page }) => {
    await openEditor(page, [
      announcement('pin', { title: 'Pinned notice', pinned: true, level: 'danger' }),
    ])

    await expect(strip(page)).toContainText('Pinned notice')
    await expect(banner(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Close announcement' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Got it' })).toHaveCount(0)
  })

  test('shows alongside the floating banner for the rest', async ({ page }) => {
    await openEditor(page, [
      announcement('pin', { title: 'Pinned notice', pinned: true }),
      announcement('normal', { title: 'Ordinary notice' }),
    ])

    await expect(strip(page)).toContainText('Pinned notice')
    await expect(banner(page)).toContainText('Ordinary notice')
  })

  test('pushes the editor down by its own height', async ({ page }) => {
    await openEditor(page, [])
    const before = await page.getByTestId('model-title').boundingBox()

    await mockAnnouncementsFeed(page, [
      announcement('pin', { title: 'Pinned notice', pinned: true }),
    ])
    await reloadEditor(page)
    await expect(strip(page)).toBeVisible()

    const after = await page.getByTestId('model-title').boundingBox()
    expect(after!.y - before!.y).toBe(36)
  })

  test('View more opens the panel on it, expanded', async ({ page }) => {
    await openEditor(page, [
      announcement('pin', { title: 'Pinned notice', pinned: true, body: '<p>Pinned body</p>' }),
    ])

    await strip(page).getByRole('button', { name: 'View more' }).click()

    await expect(panel(page).getByText('Pinned body')).toBeVisible()
  })
})

test.describe('announcements — scheduling and targeting', () => {
  test('shows nothing when no announcement is aimed at this app', async ({ page }) => {
    await openEditor(page, [
      announcement('landing', { title: 'Landing page notice', apps: ['landing-page'] }),
      announcement('sae', { title: 'SAE notice', apps: ['sae'] }),
    ])

    await expect(banner(page)).toHaveCount(0)
    await expect(bell(page)).toHaveAccessibleName('No announcements')
  })

  // The bell is the only way to reach the panel, and the panel is the only way
  // back to something dismissed.
  test('the bell still opens the panel with nothing to show', async ({ page }) => {
    await openEditor(page, [])

    await bell(page).click()

    await expect(panel(page).getByText("You're all caught up")).toBeVisible()
  })

  test('shows one whose timed window is open', async ({ page }) => {
    await openEditor(page, [
      announcement('window', {
        title: 'Maintenance window',
        starts: instantOffsetBySeconds(-3600),
        expires: instantOffsetBySeconds(3600),
      }),
    ])

    await expect(banner(page)).toContainText('Maintenance window')
  })

  test('hides one whose timed window closed an hour ago', async ({ page }) => {
    await openEditor(page, [
      announcement('window', {
        title: 'Maintenance window',
        starts: instantOffsetBySeconds(-7200),
        expires: instantOffsetBySeconds(-3600),
      }),
    ])

    await expect(banner(page)).toHaveCount(0)
    await expect(bell(page)).toHaveAccessibleName('No announcements')
  })

  // Waiting for the next poll would leave it up for minutes after it ended.
  test('takes a timed announcement down when its window closes', async ({ page }) => {
    // Built when the app fetches, so the window is not spent loading the page.
    await openEditor(page, () => [
      announcement('window', {
        title: 'Ends shortly',
        expires: instantOffsetBySeconds(10),
      }),
    ])
    await expect(banner(page)).toContainText('Ends shortly')

    await expect(banner(page)).toHaveCount(0, { timeout: 30_000 })
    await expect(bell(page)).toHaveAccessibleName('No announcements')
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
    await openEditor(page, [announcement('draft', { title: 'Draft notice', testing: true })])

    await expect(banner(page)).toContainText('Draft notice')
  })
})

test.describe('announcements — panel', () => {
  test('opens from the bell and lists everything', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])

    await bell(page).click()

    await expect(panel(page).getByText('Notifications')).toBeVisible()
    await expect(panel(page).getByText('Newest notice')).toBeVisible()
    await expect(panel(page).getByText('Older notice')).toBeVisible()
  })

  test('View more on the banner opens that announcement, expanded', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice', body: '<p>Newest body</p>' }),
      announcement('second', { title: 'Older notice', body: '<p>Older body</p>' }),
    ])

    await banner(page).getByRole('button', { name: 'View more' }).click()

    await expect(panel(page).getByText('Newest body')).toBeVisible()
    await expect(panel(page).getByText('Older body')).toHaveCount(0)
  })

  test('expands a row to reveal the body, and collapses it again', async ({ page }) => {
    await openEditor(page, [
      announcement('a', {
        title: 'A notice',
        description: 'One line summary',
        body: '<p>The full announcement text.</p>',
      }),
    ])
    await bell(page).click()

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
    await bell(page).click()

    await panel(page).getByText('First notice').click()
    await expect(panel(page).getByText('First body')).toBeVisible()

    await panel(page).getByText('Second notice').click()
    await expect(panel(page).getByText('Second body')).toBeVisible()
    await expect(panel(page).getByText('First body')).toHaveCount(0)
  })

  test('reading an announcement leaves its banner up', async ({ page }) => {
    await openEditor(page, [announcement('a', { title: 'A notice', body: '<p>The full text</p>' })])

    await banner(page).getByRole('button', { name: 'View more' }).click()

    await expect(panel(page).getByText('The full text')).toBeVisible()
    await expect(banner(page)).toContainText('A notice')
  })

  test('has no Clear all', async ({ page }) => {
    await openEditor(page, [announcement('a'), announcement('b')])

    await bell(page).click()

    await expect(panel(page).getByText('Notifications')).toBeVisible()
    await expect(panel(page).getByRole('button', { name: 'Clear all' })).toHaveCount(0)
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

    await reloadEditor(page)

    await expect(bell(page)).toHaveAccessibleName('1 announcement')
  })
})

test.describe('announcements — reading in the panel', () => {
  test('marking read moves it under Read, and leaves its banner up', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])
    await bell(page).click()

    await panel(page).getByRole('button', { name: 'Mark Newest notice as read' }).click()

    await expect(panel(page).getByText('Read', { exact: true })).toBeVisible()
    await expect(
      panel(page).getByRole('button', { name: 'Mark Newest notice as unread' })
    ).toBeVisible()
    await expect(banner(page)).toContainText('Newest notice')
    await expect(bell(page)).toHaveAccessibleName('1 unread of 2 announcements')
  })

  test('marking unread never brings a dismissed banner back', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])
    await banner(page).getByRole('button', { name: 'Got it' }).click()
    await expect(banner(page)).toContainText('Older notice')
    await bell(page).click()

    await panel(page).getByRole('button', { name: 'Mark Newest notice as read' }).click()
    await panel(page).getByRole('button', { name: 'Mark Newest notice as unread' }).click()

    await expect(panel(page).getByText('Read', { exact: true })).toHaveCount(0)
    await expect(banner(page)).toContainText('Older notice')
  })

  test('marked unread survives a reload', async ({ page }) => {
    await openEditor(page, [announcement('a', { title: 'A notice' })])
    await bell(page).click()
    await panel(page).getByRole('button', { name: 'Mark A notice as read' }).click()
    await panel(page).getByRole('button', { name: 'Mark A notice as unread' }).click()

    await reloadEditor(page)

    await expect(bell(page)).toHaveAccessibleName('1 unread of 1 announcements')
  })

  test('Show read hides them, and is remembered after a reload', async ({ page }) => {
    await openEditor(page, [
      announcement('first', { title: 'Newest notice' }),
      announcement('second', { title: 'Older notice' }),
    ])
    await bell(page).click()
    await panel(page).getByRole('button', { name: 'Mark Newest notice as read' }).click()
    await expect(showRead(page)).toBeChecked()

    await showRead(page).uncheck()
    await expect(showRead(page)).not.toBeChecked()
    await expect(panel(page).getByText('Newest notice')).toHaveCount(0)

    await reloadEditor(page)
    await bell(page).click()

    await expect(showRead(page)).not.toBeChecked()
    await expect(panel(page).getByText('Newest notice')).toHaveCount(0)
    await expect(panel(page).getByText('Older notice')).toBeVisible()
  })
})

test.describe('testing tools', () => {
  test('open from the floating flask and reset announcements', async ({ page }) => {
    await openEditor(page, [announcement('only', { title: 'Only notice' })])
    await banner(page).getByRole('button', { name: 'Got it' }).click()
    await expect(banner(page)).toHaveCount(0)

    await page.getByRole('button', { name: 'Testing tools' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Reset VPE state' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Reload' }).click()
    await expect(page.getByTestId('model-title')).toBeVisible({ timeout: 10_000 })

    await expect(banner(page)).toContainText('Only notice')
  })
})

// Announcements are never load-bearing: a broken feed must leave the editor
// completely usable.
test.describe('announcements — a broken feed', () => {
  test('an HTTP error leaves the editor working with no banner', async ({ page }) => {
    await openEditor(page, 'broken')

    await expect(banner(page)).toHaveCount(0)
    await expect(bell(page)).toHaveAccessibleName('No announcements')
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
