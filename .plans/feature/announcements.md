# Task: Noctua announcements — Markdown-authored feed + VPE banner/panel consumer

**Status:** ACTIVE
**Issue:** —
**Branch:** issue-misc (VPE side); `dev` on the announcements repo

## Goal
Give the announcement author (non-coder, GitHub-literate) a way to publish an announcement by committing one
Markdown file, and render those announcements in VPE as a banner + notification bell + side
panel — with `starts`/`expires` scheduling and per-app targeting actually implemented.

## Context
- **Repos involved:**
  - `C:\work\go\noctua-announcements` → `github.com/geneontology/noctua-announcements` (content + build)
  - `C:\work\go\noctua-visual-pathway-editor` (React consumer)
- **Reference implementation:** `C:\work\go\old-noctua-landing-page`
  - `src/@noctua.announcement/` — service + panel component
  - `src/environments/environment.ts` → `announcementUrl`
- **Triggered by:** user request — port announcements to VPE, improve the authoring flow.

## Current State

### Announcements repo (as it exists today)
- `notification.json` — flat array, hand-edited. 5 entries, **all expired in 2022**.
- `archived-notifications.json` — manual parking lot for recurring notices.
- `docs/model-copy/`, `docs/updates/` — long-form Markdown, linked by `descriptionUrl` blob URL.
- Empty untracked dirs `archived/`, `noctua-form/`, `noctua-standard-annotation/` —
  abandoned attempt at per-app targeting (empty dirs aren't tracked, never reached GitHub).
- Local `README.md` shows a diff, but it is **CRLF line-ending churn only** — no content change.

### Problems this task fixes
1. Hand-edited JSON → one bad comma and `JSON.parse` throws; banner silently vanishes in all
   apps with no signal to the author. No schema, no CI, no preview.
2. `raw.githubusercontent.com` sends `Cache-Control: max-age=300` (verified) — README's
   "wait a few seconds" is wrong. Not a supported asset host; serves `text/plain`.
3. `date` / `expiresOn` documented as "not yet implemented" and never were — stale banners
   have to be manually deleted.
4. No per-app targeting; one file feeds landing page, Form editor and VPE identically.
5. Old consumer's model is out of sync with its own data: `Announcement` declares
   `content` / `moreContentUrl`, the JSON and template use `description` / `descriptionUrl`.
   **Do not port this mismatch.**
6. VPE has no announcement code at all today (`grep -ril announcement src tests` → empty).

## Design Decisions

- **Authoring format: one Markdown file per announcement, YAML frontmatter + body.**
  Chosen over Issue Forms, raw JSON, and Decap CMS. Rationale:
  - There is a single author and no review step, so the label-based approval gate
    that justified Issue Forms buys nothing; issues-as-CMS also make editing and
    scheduling awkward.
  - Frontmatter is punctuation-tolerant in a way JSON is not, and long-form content lives
    in the same file instead of a separate `docs/` link.
  - **Decap CMS edits exactly this format**, so if the author later wants a form UI it bolts on
    without touching a single content file. The Issues route would have closed that door.
- **Publish gate is commit access, not review.** The author is a collaborator with write access
  and commits straight to `dev` from the GitHub web UI. No PR, no reviewer.
- **A broken commit must be a no-op, not an outage.** The build validates and only
  republishes `announcements.json` when everything parses. Bad input leaves the previously
  published file live. GitHub's default notification settings email the author when their
  own commit fails a workflow — so the author learns about it without anyone else in the loop.
- **Serve from GitHub Pages, not `raw.githubusercontent.com`.** Pages purges its CDN on
  deploy; raw has a fixed 5-minute TTL with no purge. The client also fetches with
  `cache: 'no-store'` so freshness does not depend on the host's headers.
- **Generated artifact stays a flat JSON array** so the old landing page keeps working if
  it is ever pointed at the new URL.
- **`descriptionUrl` is retained** for external links (Google Docs, wiki), but body content
  is now inline, so most announcements will not need it.

## Proposed schema

```markdown
---
title: Maintenance Friday 4pm PST      # required, short
level: danger                          # info | success | warning | danger
type: maintenance                      # optional, default: announcement
pinned: false                          # optional, default: false
testing: false                         # optional, default: false — true = dev site only
apps: [landing-page, sae, vpe]         # optional, default: all
starts: 2026-09-10                     # optional, default: publish immediately
expires: 2026-09-12                    # optional, default: never
descriptionUrl: https://...            # optional external "More details" link
---

Noctua will be down for about 30 minutes. Please save your work before then.
```

Build emits, per entry: `id` (slug from filename), `title`, `level`, `type`, `pinned`,
`testing`, `apps`, `starts`, `expires`, `description` (first paragraph, plain text —
banner copy), `body` (rendered HTML — panel copy), `descriptionUrl`. Pinned first, then
newest-first by `starts`.

**App targets** are `landing-page`, `sae` (Standard Annotation Editor) and `vpe`.

**`testing: true`** holds an announcement back from production: the consumer shows it only
when its build is not production (`ENVIRONMENT.isProd === false`) — i.e. the dev site,
built with `npm run build:dev`. Default `false` shows everywhere. Filtering is the
consumer's job, exactly like `apps` and the dates — the feed ships every announcement.

Verified: `npm run build:dev` bakes `VITE_APP_ENV=dev` into the bundle and `npm run build`
bakes `prod`, so the two deploys differ by build command alone. Both write to the same
`workbenches/noctua-visual-pathway-editor/public`, so whichever ran last is what gets
deployed.

## Steps

### Phase 1: Announcements repo — structure
- [ ] Unarchive `geneontology/noctua-announcements` (archived since 2022-07-22) so pushes and
      Pages deploys work; confirm default branch `dev`.
- [ ] Add the announcement author as a collaborator with write access.
- [x] Create `announcements/` with `_template.md`.
- [x] Port the 5 existing entries from `notification.json` to Markdown files (they are all
      long expired — port for format reference, then decide with the user which to keep).
- [x] Fold `docs/model-copy/` and `docs/updates/` content into announcement bodies where
      it belongs; leave the rest as linked docs.
- [ ] Retire `notification.json` + `archived-notifications.json` only **after** the new
      published URL is live and consumers are switched.

### Phase 2: Announcements repo — build + publish
- [x] `schema.json` — JSON Schema for the frontmatter fields.
- [x] `.github/workflows/build.yml` — on push to `dev`:
      parse frontmatter → validate against schema → fail loudly on error →
      emit `announcements.json` → deploy to GitHub Pages.
- [ ] Enable GitHub Pages on the repo.
- [x] Verify: a deliberately malformed commit fails the build AND leaves the previously
      published `announcements.json` intact.

### Phase 3: Announcements repo — docs for the author
- [x] Rewrite `README.md`: what this repo is, what the displays look like.
- [x] `AUTHORS.md` written for a non-coder: how to add / edit / retire an announcement,
      the four `level` values and their colors, how `starts`/`expires` scheduling works,
      what to do when the build emails you about a failure.
- [x] Fix the stale claims in the old README ("wait a few seconds", "not yet implemented").

### Phase 4: VPE consumer — data layer
- [x] ~~Add `VITE_ANNOUNCEMENTS_URL` to the four `.env` files~~ — **deviation:** the feed URL
      is identical in every environment, so a per-env var bought nothing. Added instead to
      `ENVIRONMENT` in `src/@noctua.core/data/constants.ts` with a
      `window.global_announcements_url` override, matching how `noctuaUrl` /
      `workbenchUrl` / `globalBaristaLocation` already work. The workbench shell can
      repoint it without a rebuild — which also covers the repo possibly moving to the
      GO org.
- [x] `src/features/announcements/models/announcement.ts` — types matching the built JSON.
      Field names must match the JSON exactly (see Problem 5).
- [x] `src/features/announcements/slices/announcementsApiSlice.ts` — own `createApi`
      (separate host, separate cache policy from `apiService`); register reducer +
      middleware in `src/app/store/store.ts`.
- [x] `src/features/announcements/hooks/useAnnouncements.ts` — fetch, then filter by
      `starts`/`expires` against now and by `apps` including `vpe`. Fetch with
      `cache: 'no-store'`.

### Phase 5: VPE consumer — UI
- [x] `AnnouncementBanner.tsx` — topmost active announcement, colored by `level`, dismissible
      (dismissal persisted per-`id` in `localStorage`).
- [x] `AnnouncementBell.tsx` — bell + unread count, mounted in `src/app/layout/Toolbar.tsx`.
- [x] `AnnouncementPanel.tsx` — side panel listing all active announcements with rendered body.
- [x] Wire into `src/app/layout/Layout.tsx`. Use a standalone Mantine `<Drawer position="right">`
      rather than extending `RightPanelTab` — the existing 850px right drawer is CAM-scoped
      (activity table / errors / comments) and announcements do not belong in that enum.
- [x] Verify layout: Layout uses fixed offsets (`top: 50`, `top: 94`) — the banner must not
      break those. Adjust offsets or overlay rather than pushing content.

### Phase 6: Verify
- [x] `npm run type-check`, `npm run lint`.
- [x] Unit tests: feed slice (URL, `no-store`, polling, focus/reconnect refetch, every
      failure mode), row component, level and type style maps, and a `Layout` integration
      test covering banner/bell/panel together against a mocked feed. 154 tests.
- [x] E2E (`e2e/announcements.spec.ts`, 25 tests): banner, scheduling and app targeting,
      panel expand/collapse, bell counts, dismissal, persistence across reload, and a
      broken feed leaving the editor usable. Feed mocked in `e2e/mocks/announcements.ts`.
- [ ] Manual: announcement appears within ~1 min of the author's commit; expired one does not
      render; `apps: [form]` entry does not render in VPE; dismissal survives reload;
      malformed commit leaves the last good feed serving.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Phases 1–6 built, plus the test suite (unit + e2e) and the
  move of the feed to `geneontology/noctua-announcements`. Announcements repo has
  `announcements/` (template + 5 ported entries), `schema.json`, `scripts/build.mjs`,
  `package.json`, `.gitignore`, `.github/workflows/build.yml`, rewritten `README.md`,
  new `AUTHORS.md`. VPE has `src/features/announcements/**` wired into `store.ts`,
  `Toolbar.tsx`, `Layout.tsx`, `constants.ts`.
- **Next immediate action:** Unarchive `geneontology/noctua-announcements`, push it,
  enable Pages, and confirm the live feed URL matches `ENVIRONMENT.announcementsUrl`.
- **Verified so far:**
  - `npm run build` in the announcements repo → 5 entries, correct HTML + plain-text split.
  - Bad `level`, unknown field, `expires` before `starts`, empty body, and malformed
    YAML each fail the build with author-readable messages and exit 1.
  - VPE `npm run type-check` and `eslint` clean; production `vite build` succeeds
    (built to scratchpad, tracked build output untouched).
  - All four `LEVEL_STYLES` palettes present in the emitted CSS — Tailwind's scanner
    picks up the whole class strings in the Record.
  - GitHub Pages sends `Access-Control-Allow-Origin: *` and `Cache-Control: max-age=600`.
  - 154 unit tests (`tests/features/announcements/**`, `tests/app/layout/Layout.test.tsx`)
    and 25 e2e tests (`e2e/announcements.spec.ts`) pass against a mocked feed.
- **NOT yet verified (blocked):** the live end-to-end path. Nothing is pushed, Pages is
  not enabled, so `ENVIRONMENT.announcementsUrl` currently 404s. The app degrades to
  "no announcements", which is the intended behavior but means the banner/bell/panel
  have not been seen rendering against a real feed.
- **Uncommitted changes:**
  - announcements repo: everything above, plus `package-lock.json`. Nothing committed
    or pushed.
  - VPE: `constants.ts`, `Layout.tsx`, `Toolbar.tsx`, `store.ts` modified;
    `src/features/announcements/` and this plan file untracked.
- **Environment state:** `node_modules/` installed in the announcements repo (gitignored).

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Proposed Issue Forms + label-gated publishing | Gate was the whole point; with one trusted author and no review step it adds a public issue queue for nothing, and blocks a later Decap upgrade. | 2026-09-08 |
| Hosting the feed on a personal fork | Superseded 2026-09-18 — the feed is GO infrastructure and belongs in the `geneontology` org. | 2026-09-18 |

## Files Modified

### Announcements repo (`C:\work\go
octua-announcements`) — uncommitted
| File | Action | Status |
| ---- | ------ | ------ |
| `announcements/_template.md` | create | done |
| `announcements/2022-07-*.md` (5 ported entries) | create | done |
| `schema.json` | create | done |
| `scripts/build.mjs` | create | done |
| `package.json`, `package-lock.json`, `.gitignore` | create | done |
| `.github/workflows/build.yml` | create | done |
| `README.md` | rewrite | done |
| `AUTHORS.md` | create | done |
| `notification.json`, `archived-notifications.json`, `docs/` | retire | deferred — see Phase 1 |

### VPE
| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/feature/announcements.md` | create | done |
| `src/features/announcements/models/announcement.ts` | create | done |
| `src/features/announcements/data/announcementLevels.ts` | create | done |
| `src/features/announcements/slices/announcementsApiSlice.ts` | create | done |
| `src/features/announcements/hooks/useAnnouncements.ts` | create | done |
| `src/features/announcements/components/AnnouncementBanner.tsx` | create | done |
| `src/features/announcements/components/AnnouncementBell.tsx` | create | done |
| `src/features/announcements/components/AnnouncementPanel.tsx` | create | done |
| `src/@noctua.core/data/constants.ts` | edit | done |
| `src/app/store/store.ts` | edit | done |
| `src/app/layout/Toolbar.tsx` | edit | done |
| `src/app/layout/Layout.tsx` | edit | done |
| `tests/features/announcements/**` (hooks, components, data, slice) | create | done |
| `tests/app/layout/Layout.test.tsx` | create | done |
| `e2e/mocks/announcements.ts`, `e2e/announcements.spec.ts` | create | done |

## Blockers

1. ~~**Repo home undecided.**~~ **RESOLVED 2026-09-18 — `geneontology/noctua-announcements`.**
   The feed lives in the GO org, not a personal fork. Prerequisites on that repo:
   unarchive it (last push 2022-07-22), enable Pages, give the announcement author write
   access. Feed URL in `constants.ts` and the repo README:
   `https://geneontology.github.io/noctua-announcements/announcements.json`

## Notes
- **YAML parses an unquoted `2026-03-14` into a JS `Date`, not a string**, so the schema's
  `type: string` rejected every ported file on the first build run. `scripts/build.mjs`
  now normalizes `starts`/`expires` back to `YYYY-MM-DD` before validating — the
  alternative (making authors quote their dates) is exactly the kind of trap this
  redesign exists to remove.
- `geneontology/noctua-announcements` is archived — nothing can be pushed and Pages cannot
  deploy until it is unarchived.
- The old landing page still points at the old `raw.githubusercontent.com` URL. Switching it
  to the new feed is out of scope here but should follow — same JSON shape, so it is a one-line change.
- Verified `raw.githubusercontent.com` does send `Access-Control-Allow-Origin: *`, so CORS
  was never the problem — caching and reliability are.

## Lessons Learned
- Shared GO infrastructure belongs in the `geneontology` org; a personal repo is not a home
  for a feed three apps consume.

## Additional Context (Claude)

**Why a separate `createApi` instead of `apiService.injectEndpoints`:** `apiService` pins
`baseUrl: VITE_NOCTUA_API_URL` and sets `Content-Type` + `X-API-Version` on every request.
RTK Query's `joinUrls` does pass absolute URLs through untouched, so injecting would
technically work — but it would send Noctua API headers to GitHub Pages and share a cache
policy with Barista. A separate slice keeps the two unrelated. The lighter alternative is a
plain `useEffect` + `fetch` hook with no store involvement; that is a reasonable fallback if
adding a second `createApi` feels heavy for one endpoint.

**Risks:**
- GitHub Pages is not a hard-SLA host either. It is materially better than raw (CDN purge on
  deploy, real content types), but the consumer must treat a failed fetch as "no
  announcements" and never block app render on it.
- Rendering author-written Markdown to HTML means sanitizing it before injecting. The author is
  trusted, but the panel should still sanitize rather than raw `dangerouslySetInnerHTML`.
- Three apps will eventually consume this feed. Keep the built JSON shape stable and additive.

**Follow-ups out of scope:** switching the landing page and Form editor to the new feed;
optional Decap CMS layer if the author ever wants a form UI.
