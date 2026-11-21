# Task: Migrate Angular Application to Standalone Components

**Status:** COMPLETE
**Issue:** #220 (Update Angular Codebase)
**Branch:** issue-220-update-angular-codebase

## Goal

Convert all NgModule-based components in this Angular 20 application to standalone components, following Angular's recommended best practices for modern applications.

## Summary

Converted all 41 components across 15 NgModules to standalone components and migrated the application bootstrap from `platformBrowserDynamic().bootstrapModule(AppModule)` to `bootstrapApplication(AppComponent, appConfig)`. 11 module files were deleted; 2 modules were kept for lazy loading and barrel imports.

## What Was Done

- **Phase 1 (Foundation):** Created `standalone-imports.ts` and `material-imports.ts` shared import arrays, converted `NoctuaPerfectScrollbarDirective` to standalone, verified no circular dependencies
- **Phase 2 (Layout - 5 components):** Converted footer, content, toolbar, and layout-noctua components
- **Phase 3 (Shared - 6 components):** Converted confirm dialog, inline editor, editor/reference/with/detail dropdowns
- **Phase 4 (Graph - 6 components):** Converted activity table, cam errors, activity connector table, relation preview, cam graph, and noctua graph components
- **Phase 5 (Form Tables - 4 components):** Converted evidence table, activity form table node, activity form table, and activity tree table
- **Phase 6 (Form Core - 7 components):** Converted entity form, cam toolbar, copy model, chemical connector form, activity connector form, activity form, and cam form
- **Phase 7 (Form Dialogs - 10 components):** Converted all 10 dialog components with service integration
- **Phase 8 (Form Other - 2 components):** Converted select evidence and term detail components
- **Phase 9 (Root Module & Routing):** Created `app.routes.ts` and `app.config.ts`, updated `main.ts` to use `bootstrapApplication`, deleted 11 module files
- **Phase 10 (Cleanup):** Fixed circular dependencies with dynamic imports in `dialog.service.ts`, build verified

## Files Modified

**41 components converted** across layout (5), shared/editor (6), graph (6), form tables (4), form core (7), form dialogs (10), form other (2), and app root (1).

**Files created (4):**

- `src/@noctua/standalone-imports.ts`
- `src/@noctua/material-imports.ts`
- `src/app/app.routes.ts`
- `src/app/app.config.ts`

**Module files deleted (11):**

- `src/app/app.module.ts`, `src/app/main/apps/apps.module.ts`
- `src/app/layout/layout.module.ts`, `layout-noctua.module.ts`, `content.module.ts`, `toolbar.module.ts`, `footer.module.ts`
- `src/@noctua/noctua.module.ts`, `src/@noctua/shared.module.ts`
- `src/@noctua/components/confirm-dialog/confirm-dialog.module.ts`
- `src/@noctua.editor/noctua-editor.module.ts`

**Module files kept (2):**

- `src/app/main/apps/noctua-form/noctua-form.module.ts` (barrel import)
- `src/app/main/apps/noctua-graph/noctua-graph.module.ts` (lazy loading)

## Key Decisions

- Kept 2 module files for backward compatibility (lazy loading route and barrel imports)
- Used shared import arrays (`standalone-imports.ts`, `material-imports.ts`) to reduce boilerplate
- Resolved circular dependencies in `dialog.service.ts` using dynamic imports
- Services with `providedIn: 'root'` required no changes
- Module files kept alongside standalone components during migration for backward compatibility, then deleted

## Notes

- `material.module.ts` kept as a re-export utility
- `src/@noctua.form/noctua.form.module.ts` kept as library public API
- Dialog services use dynamic `import()` for lazy loading standalone dialog components
- Test spec files may need updates for standalone component testing patterns
