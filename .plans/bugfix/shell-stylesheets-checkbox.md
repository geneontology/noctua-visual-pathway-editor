# Task: Disable the Noctua shell's stylesheets so the Mantine checkbox lines up

**Status:** ACTIVE
**Issue:** geneontology/noctua-landing-page#139 (same fix as the landing page)
**Branch:** dev

## Goal
Checkbox box and tick line up, and labels aren't bold, when the VPE runs inside the Noctua shell.

## Context
- **Related files:** `src/@noctua.core/theme/shellStyles.ts` (new), `src/main.tsx`, `src/@noctua.core/theme/mantineTheme.ts`
- **Cause:** noctua.js `pup_tent.set_common('css_libs', …)` links `/bootstrap.min.css`, `/jquery-ui-1.10.3.custom.min.css`, `/bbop.css`, `/amigo.css` into every workbench. Bootstrap 3's `input[type="checkbox"] { margin: 4px 0 0 }` outranks Mantine's rule; `label { font-weight: bold; margin-bottom: 5px }` bolds labels.
- **Safety check:** `noctua_base_workbench.tmpl`'s only visible shell chrome is the Bootstrap `.navbar`, and `src/index.css` already hides `.navbar` — so disabling Bootstrap removes nothing visible.

## Steps
- [x] Add `disableShellStylesheets()` in `shellStyles.ts`
- [x] Call it in `main.tsx` before `createRoot`
- [x] Checkbox `styles` backup in Mantine theme
- [x] Tests, type-check, lint (1404 pass, 0 type errors, lint clean)
- [x] Playwright check with Bootstrap injected (link disabled, checkbox `margin-top: 0` and aligned with `.mantine-Checkbox-inner`, `html` font-size 16px)
- [ ] Later (separate step, after deployed check): remove existing workarounds (`html { font-size: 16px }`, `#root` resets, Tailwind `important`, `.navbar` hide)

## Recovery Checkpoint
- **Last completed action:** verified in Playwright — link disabled, input margin-top 0 and aligned with .mantine-Checkbox-inner, label weight 400, html 16px; theme backup alone (Bootstrap re-enabled) also aligned
- **Next immediate action:** wait for user to say commit
- **Uncommitted changes:** above files + pre-existing `package.json`/`package-lock.json` changes (not part of this task). Don't commit until told.
