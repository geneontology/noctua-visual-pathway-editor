# Task: Dev-only testing panel — view and delete saved state

**Status:** ACTIVE
**Issue:** —
**Branch:** issue-297-announcements

## Goal
A right-hand "Testing" drawer, reachable only on dev builds, for resetting and inspecting
what VPE saves in the browser — so announcement behaviour (read / dismissed,
preferences) can be re-tested without opening devtools. Room for other testing tools later.

## Context
- **Related files:**
  - `src/features/testing/components/TestingPanel.tsx` — new
  - `src/features/testing/components/TestingLauncher.tsx` — the floating flask
  - `src/app/layout/Layout.tsx` — mounts the launcher, `ENVIRONMENT.isDev` only
  - `src/features/announcements/hooks/useAnnouncements.ts`,
    `src/@noctua.core/hooks/usePreference.ts` — export their storage keys
- **Triggered by:** user request while testing announcements.

## Current State
What VPE keeps in localStorage:
| Key | Written by | Read |
| --- | --- | --- |
| `noctua.announcements.state` | `useAnnouncementState` | once, on start |
| `noctua.preferences` | `usePreference` | every render |
| `activityLocations-<modelId>` | `PathwayViewer` | when the canvas loads a model |
| `barista_token` | `useAuthSetup` | on start, if not in the URL |

## Design Decisions
- **Dev only = `ENVIRONMENT.isDev`**: true for `npm run dev` and `build:dev`; false for
  beta and production. The flask is not rendered at all elsewhere.
- **Trigger is a floating flask button, bottom right, 20px in** (`TestingLauncher`,
  mounted by `Layout`). First built beside the bell; the user wanted it floating on
  the right. The suggested `right 20 / top 150` lands on the graph toolbar's zoom
  buttons, and that row's height shifts ~50px with the not-logged-in notice, so it's
  anchored to the bottom instead. When the CAM right drawer is open it steps left of
  the drawer (`RIGHT_DRAWER_WIDTH + 20`) and slides with it; on a phone the drawer is
  full width, so it stays put. `z-30`: under the toolbars, banner, drawers, modals.
- **Its background is a Tailwind class, not Mantine's `filled`.** The shell reset in
  `index.css` (`#root button { background: transparent }`) outranks Mantine's class, so
  a filled ActionIcon inside `#root` renders invisible (white icon, no fill). Drawers
  portal outside `#root`, which is why filled buttons inside them look fine.
- Not in the user dropdown — that only exists when logged in, and testing logged out
  is common.
- **Deleting doesn't live-patch app state; it asks for a reload.** Most keys are read
  once at start, and `useAnnouncementState` rewrites its whole key on the next change —
  deleting under it without a reload would be silently undone. A "Reload to apply" bar
  appears after any delete.
- **Lists every key on the origin**, labelled where it's VPE's own. On a deployed dev
  site the origin is shared with the other workbenches, so this shows their keys too.
- **"Reset VPE state" keeps the login.** Clears announcements, preferences and node
  positions; `barista_token` is only deleted on its own row.
- **Token values are masked** so a screen share doesn't leak them.

## Steps
- [x] Export `ANNOUNCEMENTS_STORAGE_KEY` and `PREFERENCES_STORAGE_KEY`.
- [x] `TestingPanel` — key list (label, key, size, view, delete), Reset VPE state,
      reload bar.
- [x] Floating flask launcher, mounted by `Layout`, dev only.
- [x] type-check, lint; look at it in the browser.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** built and verified. In the browser: closed a banner, seeded
  preferences / node positions / a token, opened the panel (all four keys labelled,
  token masked), Reset VPE state left only `barista_token`, Reload brought the banner
  back.
- **Then:** moved the trigger out of the toolbar into the floating `TestingLauncher`;
  checked in the browser on its own and beside the open comments drawer.
- **Tests:** `tests/features/testing/components/TestingPanel.test.tsx` (12 — labels,
  masked token, pretty JSON, delete, Reset VPE state keeps the login and other apps'
  keys, disabled when nothing to reset, reload bar + reload). `Layout.test.tsx` checks
  the launcher is on a dev build and absent otherwise. e2e: flask → Reset → Reload
  brings an acknowledged announcement back.
- **Next immediate action:** commit (user asked).
- **Verified:** real type-check (`-p tsconfig.app.json`) and eslint clean on touched
  files; full unit suite 1133/1133; announcements e2e 37/37.
- **Not verified:** that the flask is absent in a production build (gated on
  `ENVIRONMENT.isDev` in `Layout.tsx`; not built and looked at). Unit tests run as
  `dev` (`VITE_APP_ENV` unset defaults to `dev`), so the flask renders in them.
- **Uncommitted changes:** see `.plans/feature/announcements-panel-feedback.md` too.
- **Environment state:** nothing running.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
