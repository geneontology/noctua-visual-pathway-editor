# Task: Migrate to Angular Application Builder (Vite/esbuild)

## Goal
Migrate from `@angular-builders/custom-webpack:browser` to `@angular/build:application` (the new Vite/esbuild-based build system).

## Status: COMPLETED

## Summary of Changes

### Files Modified
- `angular.json` - Updated builders and options
- `src/polyfills.ts` - Added Node module polyfills
- `src/styles.scss` - Fixed SCSS import path (removed `~` prefix)
- `package.json` - Updated dependencies

### Files Deleted
- `webpack.extra.js` - No longer needed

### Dependencies Changed
- Removed: `@angular-builders/custom-webpack`
- Added: `querystring` (browser polyfill)
- Updated: `@angular/build@20`, `@angular-devkit/build-angular@20`

## Implementation Details

### Phase 1: Preparation - DONE
- Analyzed current webpack configuration
- Identified Node polyfill requirements (url, querystring)
- Identified modules to mark as external (http, https, ringo/httpclient)

### Phase 2: Handle Node Polyfills - DONE
- Added polyfill imports to `src/polyfills.ts`:
  ```typescript
  import * as url from 'url';
  import * as querystring from 'querystring-es3';
  (window as any).url = url;
  (window as any).querystring = querystring;
  ```
- Installed `querystring` package for BBOP libraries

### Phase 3: Update angular.json - DONE
- Changed build builder: `@angular-builders/custom-webpack:browser` → `@angular/build:application`
- Changed serve builder: `@angular-builders/custom-webpack:dev-server` → `@angular/build:dev-server`
- Renamed `main` → `browser`
- Converted `polyfills` to array format
- Removed unsupported options: `vendorChunk`, `buildOptimizer`, `extractLicenses`, `namedChunks`
- Added `externalDependencies`: `["http", "https", "ringo/httpclient"]`

### Phase 4: Fix SCSS Import - DONE
- Changed `@import "~@ali-hm/angular-tree-component/..."` to `@import "@ali-hm/angular-tree-component/..."`
- Esbuild doesn't support `~` prefix for node_modules

### Phase 5: Testing & Cleanup - DONE
- Development build: PASSED
- Production build: PASSED
- Dev server: PASSED
- Removed `@angular-builders/custom-webpack`
- Deleted `webpack.extra.js`

## Remaining Warnings (Non-blocking)
1. **Angular Material theming warnings** - Using legacy M2 theming format
2. **CommonJS module warnings** - BBOP libraries, jQuery, etc. are not ESM modules

These warnings don't affect functionality and can be addressed in future updates.

## Benefits of New Builder
- Faster builds with esbuild
- Faster dev server with Vite
- Better tree-shaking
- Simpler configuration (no custom webpack needed)
