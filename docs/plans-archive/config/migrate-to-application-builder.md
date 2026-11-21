# Task: Migrate to Angular Application Builder (Vite/esbuild)

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Migrate from `@angular-builders/custom-webpack:browser` to `@angular/build:application` (the new Vite/esbuild-based build system).

## Summary

Successfully migrated the build system from custom-webpack to Angular's native Vite/esbuild application builder. This eliminated the need for a custom webpack config, improved build and dev server performance, and required handling Node polyfills and SCSS import syntax changes.

## What Was Done

- Analyzed existing webpack configuration to identify polyfill and external dependency requirements
- Added Node module polyfills (url, querystring) to `src/polyfills.ts` for BBOP library compatibility
- Updated `angular.json` builders from custom-webpack to `@angular/build:application` and `@angular/build:dev-server`
- Renamed `main` entry to `browser`, converted `polyfills` to array format
- Removed unsupported options: `vendorChunk`, `buildOptimizer`, `extractLicenses`, `namedChunks`
- Added `externalDependencies` for `http`, `https`, `ringo/httpclient`
- Fixed SCSS import path by removing `~` prefix (esbuild does not support it)
- Verified dev build, production build, and dev server all pass
- Removed `@angular-builders/custom-webpack` package and deleted `webpack.extra.js`

## Files Modified

| File | Action |
| ---- | ------ |
| `angular.json` | Modified (updated builders and options) |
| `src/polyfills.ts` | Modified (added Node module polyfills) |
| `src/styles.scss` | Modified (fixed SCSS import path, removed `~` prefix) |
| `package.json` | Modified (updated dependencies) |
| `webpack.extra.js` | Deleted (no longer needed) |

## Key Decisions

- Used `externalDependencies` in angular.json to handle `http`, `https`, and `ringo/httpclient` modules that BBOP libraries reference but never use in the browser
- Added `querystring-es3` as a browser polyfill for BBOP library compatibility rather than trying to refactor the BBOP code
- Removed custom webpack config entirely rather than using a compatibility shim

## Notes

- Angular Material theming warnings remain (legacy M2 format) -- non-blocking, can be addressed separately
- CommonJS module warnings for BBOP libraries, jQuery, etc. remain -- these are not ESM modules and the warnings are non-blocking
- Builds benefit from faster esbuild compilation and Vite dev server HMR
