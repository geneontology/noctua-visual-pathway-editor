# Task: Announcements — panel feedback (font size, dismissed view, ordering) + floating banner

**Status:** ACTIVE
**Issue:** — (follow-up to `.plans/feature/announcements.md`)
**Branch:** issue-297-announcements

## Goal
Act on the announcement author's review of the panel, and turn the banner into a floating
heads-up card like a phone notification:
1. Panel text at the same size as the rest of VPE.
2. Dismissed announcements shown by default, with a "Hide dismissed" option.
3. Panel ordered (1) new before dismissed, (2) date created, newest first.
4. Banner floats over the top of the editor instead of being a full-width strip that
   pushes the layout down.

## Context
- **Related files:**
  - `src/features/announcements/components/AnnouncementPanel.tsx` — toggle, ordering
  - `src/features/announcements/components/AnnouncementRow.tsx` — font sizes, age stamp
  - `src/features/announcements/components/AnnouncementBanner.tsx` — floating card
  - `src/features/announcements/hooks/useAnnouncements.ts` — `createdOn()`
  - `src/app/layout/Layout.tsx` — banner slot, drop the banner offset
  - `src/index.css` — drop-in keyframes
- **Triggered by:** announcement author's review of the panel, plus user request for a
  mobile-style floating banner.

## Current State
- Panel text is `text-2xs` (10px) for description, body, age and header buttons. VPE body
  text is `text-xs` (12px) — `CommentsPanel`, `ActivityTable`, Mantine inputs at `xs`.
- Panel defaults to new only; "Show dismissed (n)" toggles to everything in feed order,
  so dismissed rows sit interleaved with new ones.
- The feed has no `date_created`. `AUTHORS.md` tells authors to name each file with the
  day they write it (`2026-03-14-march-maintenance.md`), and the id is the filename, so
  the id carries the created date. The row's age stamp reads `starts` instead, which
  shows "now" for an announcement with no `starts`, even one weeks old.
- Banner is a 36px full-width strip at `top: 0`; `Layout` shifts every fixed offset down
  by `BANNER_HEIGHT` while it shows.

## Design Decisions
- **Date created = the date in the filename**, falling back to `starts` for a file named
  without one. That is the author's own convention, and it's the same fallback the build
  uses for feed order. Compared as strings, like the build does. No feed change needed.
- **The age stamp reads the created date too.** Otherwise a row sorted as older could
  show "now" above one that says "2w", and the order would look wrong.
- **Pinned stays on top within the new group.** `AUTHORS.md` promises a pinned
  announcement "sits at the top of the list"; it is never dismissable, so it is always new.
- **"Clear all" shows whenever something is clearable**, not only in the new-only view.
  With dismissed shown by default it would otherwise vanish after the first dismissal.
- **Banner floats, it doesn't push.** A fixed, centered card hanging 8px under the top
  nav, `z-[60]` above the toolbars (`z-50`), below the panel drawer (100) and modals.
  The layout's fixed offsets never move, so `BANNER_HEIGHT` goes away. It stays until
  closed; it does not auto-retract like a phone's does, since the ask is for it to be
  intrusive. Drops in with a short slide, skipped under `prefers-reduced-motion`; keyed
  by id so the next one drops in when the top one closes.
- **Under the CAM toolbar, not over the nav.** First placed at `top: 8px` over the nav;
  at 1400px wide the 576px card covered the bell and Help. Then under the nav — but the
  CAM toolbar's centre is *not* empty (comments, model state, date, contributors), and
  the card covered those. Briefly moved under the CAM toolbar; **user reverted that —
  back under the nav, covering the CAM toolbar is fine, they have to dismiss it.**
- **Pinned announcements get the original strip back, above the top nav.** A pinned
  one can't be closed, so it takes its own 36px (`PINNED_HEIGHT`) and pushes the
  layout down rather than floating over the editor forever. Everything else floats
  and can be closed. `PinnedAnnouncementBar` is the strip; `AnnouncementBanner` (the
  card) no longer handles pinned at all. First pinned wins if there are several.
- **"Show dismissed" is a Mantine `Switch`, on by default, remembered.** Replaced the
  "Hide dismissed" / "Show dismissed (n)" text button. Always shown — it's a setting,
  so it doesn't come and go with the list.
- **Preferences get their own key, `noctua.preferences`**, via
  `src/@noctua.core/hooks/usePreference.ts` — one typed `DEFAULTS` table, one
  localStorage key, shared across components with `useSyncExternalStore`. The
  read/closed/dismissed id lists stay in `noctua.announcements.state`: they're a record
  of what happened to each announcement, not a setting. Primitive values only (the
  store is re-read each render); falls back to memory when storage is blocked.
- **State model (final, set by the user after two wrong attempts of mine):**

  | Action | State |
  | --- | --- |
  | Banner **Got it** / **✕** (same thing) | `dismissed` — never pops up again. Not read. |
  | **View more** (card or pinned strip) | `read` (panel opens on it, expanded) |
  | Expanding a row in the panel | `read` |
  | Panel row **✕** "Mark as read" | `read` |
  | Panel row **↩** "Mark as unread" | un-`read` |

  The panel groups by **read**, not dismissed: New (unread) then a "Read (n)" section,
  behind a remembered "Show read" switch (`announcements.showRead`). The bell counts
  every announcement and badges the unread ones. Read and dismissed never touch each
  other, so nothing in the panel can bring a banner back. A row read by expanding
  stays in place until the panel is reopened (`readAtOpen`), so it doesn't jump away
  mid-read; the row's ✕ moves it at once. Pinned rows stay on top with no control.
  - Wrong attempt 1: made ✕/Got it the same as the panel's dismiss (moved it under
    Dismissed, marked read) and deleted the banner-closed state.
  - Wrong attempt 2: restored banner-closed as a third set but kept the panel about
    dismissed; restoring in the panel re-bannered it.
- **Card actions are phone-style** — flat, all caps via CSS (accessible names stay
  "Got it" / "View more"), "Got it" left, "More details" / "View more" right.
- **Context from the user: the manager's problem is curators not reading
  announcements.** That's what the feature is for. It argues against limiting which
  announcements get a card, and for measuring reads (GA events — not built; per-curator
  acknowledgement would need a server). Open question for the manager.
- **"View more" lands on that announcement, expanded and marked read** — from the card
  and from the pinned strip. `Layout` passes `focusedId`; the bell opens with none.
- **Rows under Read are muted with solid greys, not `opacity-60`.** Faded grey text measured
  about 2.3:1 on white, under the 4.5:1 small text needs. Now `bg-gray-50`, grey edge
  and icon, title `gray-600`, description/age `gray-500` (the lightest grey that
  passes). The age stamp was `gray-400` (≈2.6:1) on *every* row — now `gray-500`.
- **Borders one shade darker** (`BANNER_STYLES` `-300` → `-400`), shared by the card and
  the pinned strip.
- **"Clear all" removed** (user: it doesn't make sense), along with `dismissAll` in
  `useAnnouncementState`, which nothing else used.
- **"Show read" reads as a settings row**: label first, switch at the header's
  right edge by the close button. Needed `classNames.title: 'flex-1'` — Mantine's
  drawer title only grows as wide as its content, which is also why the old header
  buttons hugged the title instead of sitting right.
- **Read rows sit under their own "Read (n)" heading**, below the new ones, styled like
  the Comments panel's section headings in grey. With nothing unread,
  "You're all caught up" shows above the Read section.
- **Panel widened 380 → 420px.** With titles at `text-sm`, 380px truncated them after
  ~25 characters.

## Steps

### Phase 1: Panel
- [x] Font sizes: body/description/links/header buttons/age → `text-xs`; row title →
      `text-sm`; header → `text-base`.
- [x] Default to showing dismissed; toggle reads "Hide dismissed" / "Show dismissed (n)".
- [x] Order: new first, pinned on top, then `createdOn` newest first.
- [x] "Clear all" visible whenever there is something to clear.

### Phase 2: Banner
- [x] `AnnouncementBanner` → floating card (rounded, shadow, level colours kept).
- [x] `Layout` → fixed centered slot, remove `BANNER_HEIGHT` / `bannerOffset`.
- [x] `index.css` → `--animate-heads-up` keyframes.

### Phase 3: Verify
- [x] `npm run type-check`, `npm run lint`.
- [x] Run the announcement unit tests; report the failures caused by the changed defaults
      and labels. Existing tests are **not** updated until the user says so.
- [x] Look at it in the browser (scratch Playwright script against the e2e feed mock,
      desktop 1400px + phone 390px).
- [x] Update the failing unit tests and the e2e specs, and add coverage for the new
      pieces (user asked).

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Reworked to the final read/dismissed model (Design
  Decisions), tests and e2e updated to match, comments trimmed to one line of "why".
- **Next immediate action:** commit (user asked).
- **Banner position: top edge halfway down the top nav** (`BANNER_TOP = TOOLBAR_BOTTOM / 2`,
  under the pinned strip when there is one), per the user. Measured at rest: the
  28px bell button has its bottom 11px under the card at 1280 and 1440 wide; its top
  17px is still clickable. No overlap at 1920.
- **Tests written (user asked).** Rewritten: `useAnnouncementState`, `AnnouncementPanel`,
  `AnnouncementBanner`, `Layout`, and the dismissed/age cases in `AnnouncementRow`. New:
  `PinnedAnnouncementBar.test.tsx`, `tests/noctua.core/hooks/usePreference.test.tsx`,
  `tests/features/testing/components/TestingPanel.test.tsx`, `createdOn` cases in
  `useAnnouncements.test.ts` (also fixed its three pre-existing `as unknown as` casts).
  `Layout.test.tsx` mocks `ENVIRONMENT.isDev` with a getter so the dev-only launcher is
  checked both ways. `e2e/announcements.spec.ts` rewritten for "Got it"/✕, the pinned
  strip (incl. that it pushes the editor down 36px and the card doesn't), "View more"
  landing expanded, the Read section, marking unread never re-bannering, the switch
  surviving a reload, and the testing panel's reset.
  - Result (final model): unit **1133/1133**, e2e announcements **37/37**.
  - Mutation-checked: reversing the newest-first sort, disabling the "View more" focus,
    dropping the pinned strip's focus, the dev gate, the "pinned never on the card"
    rule, the keep-in-place rule and "the panel ignores dismissed" each failed the
    expected tests, then were restored.
  - Real type-check: 0 errors across every touched src and test file.
- **`Layout.tsx` was silently reverted mid-session** to an older copy (no `focusedId`,
  still `isBannerClosed` / `closeBanner` / `onGotIt`, `BANNER_GAP` back to 8) — most
  likely the IDE's undo stack or a stale buffer being saved, since the file was open.
  Re-applied with the user's OK; the other touched files were checked and intact.
- **Not doing:** pruning old ids from storage (critique item 6). A few bytes per
  announcement; not worth the code. User didn't follow it, which is fair.
- **`npm run type-check` checks nothing.** Root `tsconfig.json` is solution-style
  (`files: []` + references) and plain `tsc` doesn't follow references, so it reads 0
  files — same for the `tsc` step in `npm run build`. The real check is
  `npx tsc --noEmit -p tsconfig.app.json`: 99 errors, 58 in `src`, none in files this
  work touched. Earlier "type-check clean" claims in this plan meant nothing; the
  touched files have since been verified with the real check.
- **Uncommitted changes:** files listed under Context, plus this plan.
- **Environment state:** nothing running.
- **Known pre-existing:** `npm run format` / `prettier --check` fails on every file —
  `.prettierrc` still names `tailwind.config.js`, which the Tailwind v4 migration
  removed. Checked formatting with the same options minus the plugin.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| ✕/Got it = panel dismiss (read + under Dismissed), banner-closed state deleted | Misread "X and Got it are the same"; the banner is its own state | 2026-09-23 |
| Banner-closed as a third set, panel still grouped by dismissed | Restoring in the panel re-bannered it; the panel is about read, not dismissed | 2026-09-23 |

## Notes
- `noctua-announcements/README.md` describes the banner generically ("shows as a banner
  with its title, first paragraph, and a link"), still true of the floating card. Its
  screenshots are from the old landing page and were already out of date.
