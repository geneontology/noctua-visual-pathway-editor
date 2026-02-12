# Task: Migrate from SCSS to Tailwind CSS Setup

## Goal

Replace the current complex SCSS architecture in `src/@noctua/scss/` with a cleaner Tailwind-based setup copied from the demo project at `downloads/starter/src/@noctua/styles`. This will simplify styling, reduce custom code, and adopt a proven production-ready theming system.

## Current State

**What Works:**
- Hybrid SCSS + Tailwind setup functioning
- Material Design components properly themed
- Noctua branding colors (noc-primary #3b5998, MF/BP/CC colors)
- Dialog sizing system with responsive breakpoints
- Custom utilities (deep-width, deep-height, aspect borders) working
- Material M2/M3 compatibility maintained

**What's Problematic:**
- 10+ SCSS partials (1,400+ lines) creating maintenance burden
- Complex mixin system (breakpoints, noctua-mixins)
- 280+ generated color utility classes duplicating Tailwind
- Custom Material fixes scattered across multiple files
- Mixed use of SCSS variables and Tailwind utilities causing confusion

**Context:**
- Demo project has sophisticated CSS Custom Properties theming system
- Demo provides comprehensive Material overrides (~1,300 lines in single file)
- Current `tailwind.config.js` already has some Noctua customizations

## Implementation Plan

### Phase 1: Setup Tailwind Infrastructure ✓ DONE
- [x] Copy Tailwind plugin system from demo
- [x] Update tailwind.config.js
- [x] Create src/@noctua/styles/ directory structure

### Phase 2: Create Core Style Files
- [ ] Create tailwind.scss (base + components + custom layer)
- [ ] Create themes.scss (Material theme integration)
- [ ] Create main.scss (imports coordinator)
- [ ] Create components/input.scss

### Phase 3: Port Material Overrides
- [ ] Copy and adapt angular-material.scss from demo
- [ ] Port dialog sizing classes
- [ ] Port Noctua-specific component styles (tree, chips, badges)
- [ ] Create scrollbar overrides

### Phase 4: Update Build Configuration
- [ ] Update angular.json styles array
- [ ] Update src/styles.scss entry point
- [ ] Add chroma-js dependency

### Phase 5: Remove Old SCSS
- [ ] Rename src/@noctua/scss/ to src/@noctua/scss.backup/
- [ ] Test application thoroughly
- [ ] Delete backup once confirmed working

### Phase 6: Testing & Refinement
- [ ] Visual regression testing (all components)
- [ ] Dialog sizing verification
- [ ] MF/BP/CC indicators testing
- [ ] Performance check (bundle size, build time)
- [ ] Material theming verification

## Progress Summary

| Phase   | Status            | Progress |
| ------- | ----------------- | -------- |
| Phase 1 | ✓ Complete        | 3/3      |
| Phase 2 | ✓ Complete        | 4/4      |
| Phase 3 | ✓ Complete        | 4/4      |
| Phase 4 | ✓ Complete        | 3/3      |
| Phase 5 | ✓ Complete        | 3/3      |
| Phase 6 | Ready for Testing | 0/5      |

## Implementation Notes

**Simplified Approach**: Removed the complex multi-theme system (theming plugin, chroma-js, utilities plugin). Kept only the single Noctua color theme with:
- Primary: Noctua blue (#3b5998)
- Accent: Slate (gray)
- Warn: Red
- Custom colors: MF/BP/CC aspect colors

This matches the user's requirement: "I just want color theme the one I had".

## Files to Create/Modify

### Files to Create

| File                                                  | Purpose                       | Status  |
| ----------------------------------------------------- | ----------------------------- | ------- |
| `src/@noctua/tailwind/plugins/theming.js`             | Theme generator with CSS vars | Pending |
| `src/@noctua/tailwind/plugins/utilities.js`           | Material utility classes      | Pending |
| `src/@noctua/tailwind/plugins/icon-size.js`           | Icon sizing utilities         | Pending |
| `src/@noctua/tailwind/utils/generate-palette.js`      | Color palette generator       | Pending |
| `src/@noctua/tailwind/utils/generate-contrasts.js`    | Contrast calculator           | Pending |
| `src/@noctua/tailwind/utils/json-to-sass-map.js`      | JSON to SASS converter        | Pending |
| `src/@noctua/styles/tailwind.scss`                    | Tailwind base setup           | Pending |
| `src/@noctua/styles/themes.scss`                      | Material themes               | Pending |
| `src/@noctua/styles/main.scss`                        | Import coordinator            | Pending |
| `src/@noctua/styles/components/input.scss`            | Input styling                 | Pending |
| `src/@noctua/styles/overrides/angular-material.scss`  | Material overrides            | Pending |
| `src/@noctua/styles/overrides/perfect-scrollbar.scss` | Scrollbar styling             | Pending |

### Files to Modify

| File                 | Changes                                    | Status  |
| -------------------- | ------------------------------------------ | ------- |
| `tailwind.config.js` | Merge with demo's theme system and plugins | Pending |
| `src/styles.scss`    | Simplify to utilities + tree import        | Pending |
| `angular.json`       | Update styles array loading order          | Pending |
| `package.json`       | Add chroma-js dependency                   | Pending |

### Files to Delete (After Successful Migration)

| File/Directory                         | Reason                          |
| -------------------------------------- | ------------------------------- |
| `src/@noctua/scss/` (entire directory) | Replaced by src/@noctua/styles/ |

## Dependencies

- [x] `tailwindcss` - Already installed
- [x] `@angular/material` - Already installed
- [ ] `chroma-js` - Need to install for color manipulation
- [x] PostCSS - Already configured
- [x] SASS - Already configured

## Blockers

- None currently

## Key Design Decisions

### CSS Variable Naming
- **Decision:** Use `--noctua-*` prefix
- **Reason:** Consistency with Noctua branding

### Font Family
- **Decision:** Keep Roboto, don't use demo's Inter font
- **Reason:** Roboto is Material Design standard and already in use

### Theme Configuration
- **Decision:** Start with single `default` theme using noc-primary color
- **Reason:** Simplify initial migration; can add more themes later

### Utilities to Keep
- **Decision:** Keep current deep-w/deep-h and aspect-border utilities in tailwind.config.js
- **Reason:** These are Noctua-specific and actively used

### Material Overrides Strategy
- **Decision:** Use demo's comprehensive angular-material.scss as base, add Noctua-specific styles to end
- **Reason:** Leverage demo's thorough Material 3 compatibility fixes

## Next Steps

1. Copy entire `downloads/starter/src/@noctua/tailwind/` directory to `src/@noctua/tailwind/`
2. Create `src/@noctua/styles/` directory structure
3. Update `tailwind.config.js` to import and use theming plugins
4. Create `tailwind.scss` with Tailwind directives and custom base layer
5. Create `themes.scss` with Material theme integration

## Notes

### Important Findings from Exploration

**Demo's Tailwind Setup:**
- Uses CSS Custom Properties for runtime theme switching
- Generates both regular and RGB color versions for opacity support
- Has comprehensive Material component overrides (~1,300 lines)
- Includes 6 pre-built themes (default, brand, teal, rose, purple, amber)
- Uses chroma-js for intelligent color palette generation

**Demo's Loading Order (angular.json):**
1. `src/@noctua/styles/tailwind.scss` - Base + components
2. `src/@noctua/styles/themes.scss` - Material themes
3. `src/styles/vendors.scss` - Third-party CSS
4. `src/@noctua/styles/main.scss` - Component/override imports
5. `src/styles/styles.scss` - Custom app styles
6. `src/styles/tailwind.scss` - Utilities (loaded last)

**Current SCSS Architecture to Replace:**
- `core.scss` (24 lines) - Entry point
- `noctua.scss` (277 lines) - Theme variables, dialog sizes
- `theming.scss` (98 lines) - Material M2 palettes
- `partials/` - 10 files, ~1,000 lines total
- `mixins/` - 161 lines total

**Utilities Already in Current Config:**
- ✅ Noctua colors (noc-primary, noc-mf, noc-bp, noc-cc)
- ✅ Material breakpoints (600px, 960px, 1280px, 1440px)
- ✅ deep-w/deep-h plugins
- ✅ aspect-border utilities
- ✅ Custom spacing and z-index values

### Risks & Mitigations

**Risk:** Visual regression in complex components
- **Mitigation:** Rename old SCSS to .backup first, keep for rollback

**Risk:** Missing Material component overrides
- **Mitigation:** Demo's overrides are comprehensive; add Noctua-specific ones as needed

**Risk:** Build failures or CSS conflicts
- **Mitigation:** Test build after each phase; angular.json loading order critical

### Rollback Plan

If issues arise:
1. Revert `angular.json` styles array
2. Revert `src/styles.scss`
3. Revert `tailwind.config.js`
4. Rename `src/@noctua/scss.backup/` back to `src/@noctua/scss/`
5. Remove `src/@noctua/styles/` directory
