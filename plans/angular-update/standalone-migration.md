# Task: Migrate Angular Application to Standalone Components

## Goal
Convert all NgModule-based components in this Angular 20 application to standalone components, following Angular's recommended best practices for modern applications.

---

## Current State Analysis

### What We Have
- **41 components** across **15 NgModules**
- **28+ services** (most already tree-shakeable with `providedIn: 'root'`)
- **1 directive** (NoctuaPerfectScrollbarDirective)
- **0 pipes**
- **100% NgModule-based architecture** - no existing standalone components

### Module Inventory

| Module | Location | Components | Complexity |
|--------|----------|------------|------------|
| AppModule | src/app/ | 1 | High |
| NoctuaModule | src/@noctua/ | 0 | Low |
| MaterialModule | src/@noctua/ | 0 (re-exports) | Low |
| NoctuaSharedModule | src/@noctua/ | 0 (re-exports) | Medium |
| NoctuaConfirmDialogModule | src/@noctua/components/ | 1 | Medium |
| NoctuaEditorModule | src/@noctua.editor/ | 5 | Medium |
| LayoutModule | src/app/layout/ | 0 | Low |
| LayoutNoctuaModule | src/app/layout/layout-noctua/ | 1 | Low |
| ContentModule | src/app/layout/components/content/ | 1 | Low |
| NoctuaToolbarModule | src/app/layout/components/toolbar/ | 1 | Medium |
| NoctuaFooterModule | src/app/layout/components/footer/ | 1 | Low |
| AppsModule | src/app/main/apps/ | 0 | High |
| NoctuaFormModule (Feature) | src/app/main/apps/noctua-form/ | 23 | High |
| NoctuaGraphModule | src/app/main/apps/noctua-graph/ | 6 | High |
| NoctuaFormModule (Lib) | src/@noctua.form/ | 0 | Low |

### Current Architecture Issues

1. **Circular Module Dependencies**: AppsModule → NoctuaFormModule → NoctuaGraphModule
2. **Shared Module Anti-Pattern**: NoctuaSharedModule exports 50+ symbols
3. **Angular Material Version Mismatch**: v16.2.0 with Angular 20
4. **FlexLayout Deprecation**: Using deprecated @angular/flex-layout

---

## Implementation Plan

### Phase 1: Foundation & Infrastructure
**Goal**: Prepare the codebase for standalone migration

| Step | Task | Status | Files |
|------|------|--------|-------|
| 1.1 | Create standalone utility imports file | ✓ DONE | `src/@noctua/standalone-imports.ts` |
| 1.2 | Convert NoctuaPerfectScrollbarDirective to standalone | ✓ DONE | `src/@noctua/directives/noctua-perfect-scrollbar/` |
| 1.3 | Update Angular Material imports strategy | ✓ DONE | Kept `material.module.ts` for backward compat |
| 1.4 | Create shared Material imports array | ✓ DONE | `src/@noctua/material-imports.ts` |
| 1.5 | Document and resolve circular dependencies | ✓ DONE | No circular deps found in module imports |

### Phase 2: Layout Components (5 components)
**Goal**: Convert all layout components to standalone

| Step | Task | Status | Files |
|------|------|--------|-------|
| 2.1 | Convert NoctuaFooterComponent | ✓ DONE | `src/app/layout/components/footer/` |
| 2.2 | Convert ContentComponent | ✓ DONE | `src/app/layout/components/content/` |
| 2.3 | Convert NoctuaToolbarComponent | ✓ DONE | `src/app/layout/components/toolbar/` |
| 2.4 | Convert LayoutNoctuaComponent | ✓ DONE | `src/app/layout/layout-noctua/` |
| 2.5 | Modules updated for backward compat | ✓ DONE | Module files kept for compat |

### Phase 3: Shared Components (6 components)
**Goal**: Convert shared/reusable components

| Step | Task | Status | Files |
|------|------|--------|-------|
| 3.1 | Convert NoctuaConfirmDialogComponent | ✓ DONE | `src/@noctua/components/confirm-dialog/` |
| 3.2 | Module updated for backward compat | ✓ DONE | Module file kept for compat |
| 3.3 | Convert NoctuaInlineEditorComponent | ✓ DONE | `src/@noctua.editor/inline-editor/` |
| 3.4 | Convert NoctuaEditorDropdownComponent | ✓ DONE | `src/@noctua.editor/inline-editor/editor-dropdown/` |
| 3.5 | Convert NoctuaReferenceDropdownComponent | ✓ DONE | `src/@noctua.editor/inline-reference/reference-dropdown/` |
| 3.6 | Convert NoctuaWithDropdownComponent | ✓ DONE | `src/@noctua.editor/inline-with/with-dropdown/` |
| 3.7 | Convert NoctuaDetailDropdownComponent | ✓ DONE | `src/@noctua.editor/inline-detail/detail-dropdown/` |
| 3.8 | Module updated for backward compat | ✓ DONE | `src/@noctua.editor/noctua-editor.module.ts` |

### Phase 4: Graph Feature Components (6 components)
**Goal**: Convert NoctuaGraphModule components

| Step | Task | Status | Files |
|------|------|--------|-------|
| 4.1 | Convert ActivityTableComponent | ✓ DONE | `src/app/main/apps/noctua-graph/activity-table/` |
| 4.2 | Convert CamErrorsComponent | ✓ DONE | `src/app/main/apps/noctua-graph/cam-errors/` |
| 4.3 | Convert ActivityConnectorTableComponent | ✓ DONE | `src/app/main/apps/noctua-graph/activity-connector-table/` |
| 4.4 | Convert RelationPreviewComponent | ✓ DONE | `src/app/main/apps/noctua-graph/relation-preview/` |
| 4.5 | Convert CamGraphComponent | ✓ DONE | `src/app/main/apps/noctua-graph/cam-graph/` |
| 4.6 | Convert NoctuaGraphComponent (container) | ✓ DONE | `src/app/main/apps/noctua-graph/` |
| 4.7 | Module updated for backward compat | ✓ DONE | `src/app/main/apps/noctua-graph/noctua-graph.module.ts` |
| 4.8 | Module kept for routing | ✓ DONE | Module kept for lazy loading |

### Phase 5: Form Feature Components - Tables (4 components)
**Goal**: Convert table components (leaf components first)

| Step | Task | Status | Files |
|------|------|--------|-------|
| 5.1 | Convert EvidenceFormTableComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/evidence-table/` |
| 5.2 | Convert ActivityFormTableNodeComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/activity-form-table-node/` |
| 5.3 | Convert ActivityFormTableComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/cam-table/activity-form-table/` |
| 5.4 | Convert ActivityTreeTableComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/cam-table/activity-tree-table/` |
| 5.5 | Update NoctuaFormModule for backward compat | ✓ DONE | `src/app/main/apps/noctua-form/noctua-form.module.ts` |

### Phase 6: Form Feature Components - Core Forms (7 components)
**Goal**: Convert form components

| Step | Task | Status | Files |
|------|------|--------|-------|
| 6.1 | Convert EntityFormComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/activity/activity-form/entity-form/` |
| 6.2 | Convert CamToolbarComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/cam-toolbar/` |
| 6.3 | Convert CopyModelComponent | ✓ DONE | `src/app/main/apps/noctua-form/components/copy-model/` |
| 6.4 | Convert ChemicalConnectorFormComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/activity/chemical-connector-form/` |
| 6.5 | Convert ActivityConnectorFormComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/activity/activity-connector-form/` |
| 6.6 | Convert ActivityFormComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/activity/activity-form/` |
| 6.7 | Convert CamFormComponent | ✓ DONE | `src/app/main/apps/noctua-form/cam/cam-form/` |
| 6.8 | Update NoctuaFormModule for backward compat | ✓ DONE | `src/app/main/apps/noctua-form/noctua-form.module.ts` |

### Phase 7: Form Feature Components - Dialogs (10 components)
**Goal**: Convert dialog components with service integration

| Step | Task | Status | Files |
|------|------|--------|-------|
| 7.1 | Convert AddEvidenceDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/add-evidence/` |
| 7.2 | Convert ActivityErrorsDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/activity-errors/` |
| 7.3 | Convert BeforeSaveDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/before-save/` |
| 7.4 | Convert SelectEvidenceDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/select-evidence/` |
| 7.5 | Convert SearchDatabaseDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/search-database/` |
| 7.6 | Convert SearchEvidenceDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/search-evidence/` |
| 7.7 | Convert AllowedDatabasesDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/allowed-with-databases/` |
| 7.8 | Convert CamErrorsDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/cam-errors/` |
| 7.9 | Convert CreateActivityDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/create-activity/` |
| 7.10 | Convert ConfirmCopyModelDialogComponent | ✓ DONE | `src/app/main/apps/noctua-form/dialogs/confirm-copy-model/` |
| 7.11 | Update NoctuaFormModule for backward compat | ✓ DONE | `src/app/main/apps/noctua-form/noctua-form.module.ts` |

### Phase 8: Form Feature Components - Other (2 components)
**Goal**: Convert remaining form components

| Step | Task | Status | Files |
|------|------|--------|-------|
| 8.1 | Convert SelectEvidenceComponent | ✓ DONE | `src/app/main/apps/noctua-form/components/select-evidence/` |
| 8.2 | Convert NoctuaTermDetailComponent | ✓ DONE | `src/app/main/apps/noctua-form/components/term-detail/` |
| 8.3 | Update NoctuaFormModule for backward compat | ✓ DONE | `src/app/main/apps/noctua-form/noctua-form.module.ts` |

### Phase 9: Root Module & Routing
**Goal**: Convert AppModule to standalone bootstrap

| Step | Task | Status | Files |
|------|------|--------|-------|
| 9.1 | Convert AppComponent to standalone | ✓ DONE | `src/app/app.component.ts` |
| 9.2 | Create standalone route configuration | ✓ DONE | `src/app/app.routes.ts` |
| 9.3 | Update main.ts to use bootstrapApplication | ✓ DONE | `src/main.ts` |
| 9.4 | Create application configuration (providers) | ✓ DONE | `src/app/app.config.ts` |
| 9.5 | Remove AppModule | ✓ DONE | `src/app/app.module.ts` (deleted) |
| 9.6 | Remove AppsModule | ✓ DONE | `src/app/main/apps/apps.module.ts` (deleted) |
| 9.7 | Remove NoctuaModule | ✓ DONE | `src/@noctua/noctua.module.ts` (deleted) |
| 9.8 | Remove NoctuaSharedModule | ✓ DONE | `src/@noctua/shared.module.ts` (deleted) |
| 9.9 | Remove LayoutModule | ✓ DONE | `src/app/layout/layout.module.ts` (deleted) |
| 9.10 | Remove other obsolete modules | ✓ DONE | Various (LayoutNoctuaModule, FooterModule, etc.) |

### Phase 10: Cleanup & Testing
**Goal**: Final cleanup and verification

| Step | Task | Status | Files |
|------|------|--------|-------|
| 10.1 | Remove all remaining empty module files | ✓ DONE | Completed in Phase 9 |
| 10.2 | Update all index.ts exports | ☐ Pending | Various |
| 10.3 | Run npm build and fix errors | ✓ DONE | Fixed circular deps with dynamic imports in dialog.service.ts |
| 10.4 | Run npm test and fix errors | ☐ Pending | - |
| 10.5 | Manual UI testing | ☐ Pending | - |
| 10.6 | Document migration in README | ☐ Pending | README.md |

---

## Progress Summary

| Phase | Description | Components | Status |
|-------|-------------|------------|--------|
| 1 | Foundation & Infrastructure | - | ✓ Completed |
| 2 | Layout Components | 5 | ✓ Completed |
| 3 | Shared Components | 6 | ✓ Completed |
| 4 | Graph Feature Components | 6 | ✓ Completed |
| 5 | Form Tables | 4 | ✓ Completed |
| 6 | Form Core | 7 | ✓ Completed |
| 7 | Form Dialogs | 10 | ✓ Completed |
| 8 | Form Other | 2 | ✓ Completed |
| 9 | Root Module & Routing | 1 | ✓ Completed |
| 10 | Cleanup & Testing | - | ☐ Not Started |

**Total Components to Convert: 41**
**Total Modules to Remove: 15**

---

## Technical Details

### Standalone Component Pattern

Each component will be converted from:

```typescript
// BEFORE (NgModule-based)
@Component({
  selector: 'noc-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent { }

// In module:
@NgModule({
  declarations: [ExampleComponent],
  imports: [CommonModule, MatButtonModule, ...],
  exports: [ExampleComponent]
})
export class ExampleModule { }
```

To:

```typescript
// AFTER (Standalone)
@Component({
  selector: 'noc-example',
  standalone: true,
  imports: [CommonModule, MatButtonModule, ...],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent { }
```

### Routing Migration

From:

```typescript
// BEFORE
RouterModule.forRoot(routes)
RouterModule.forChild(routes)
```

To:

```typescript
// AFTER
provideRouter(routes, withComponentInputBinding())
```

### Application Bootstrap

From:

```typescript
// BEFORE (main.ts)
platformBrowserDynamic().bootstrapModule(AppModule)
```

To:

```typescript
// AFTER (main.ts)
bootstrapApplication(AppComponent, appConfig)
```

### Import Organization

Create a shared imports file for commonly used modules:

```typescript
// src/@noctua/standalone-imports.ts
export const COMMON_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
];

export const MATERIAL_IMPORTS = [
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  // ... etc
];
```

---

## Dependencies & Blockers

### Must Fix First
1. **Circular Dependencies**: Resolve AppsModule → NoctuaFormModule → NoctuaGraphModule cycle
2. **Angular Material**: Verify v16 compatibility with Angular 20 standalone patterns

### External Library Considerations
- **@swimlane/ngx-graph**: May need wrapper for standalone
- **@ali-hm/angular-tree-component**: Check standalone support
- **angular-resizable-element**: Check standalone support
- **angular-flex-layout**: Deprecated - consider replacement with CSS Flexbox/Grid

---

## Next Steps

1. **Phase 10: Cleanup & Testing** - Run tests, verify UI, update documentation

### Current Progress

- **Phases 1-9: COMPLETE** (41 components converted, 11 modules deleted)
- **Next: Phase 10** - Final cleanup and testing

---

## Files Created

- `src/@noctua/standalone-imports.ts` ✓ Created (Phase 1)
- `src/@noctua/material-imports.ts` ✓ Created (Phase 1)
- `src/app/app.routes.ts` ✓ Created (Phase 9)
- `src/app/app.config.ts` ✓ Created (Phase 9)

## Files Deleted (Phase 9)

- ~~`src/app/app.module.ts`~~ ✓ Deleted
- ~~`src/app/main/apps/apps.module.ts`~~ ✓ Deleted
- `src/app/main/apps/noctua-form/noctua-form.module.ts` - Kept (used as barrel import)
- `src/app/main/apps/noctua-graph/noctua-graph.module.ts` - Kept (used for lazy loading)
- ~~`src/app/layout/layout.module.ts`~~ ✓ Deleted
- ~~`src/app/layout/layout-noctua/layout-noctua.module.ts`~~ ✓ Deleted
- ~~`src/app/layout/components/content/content.module.ts`~~ ✓ Deleted
- ~~`src/app/layout/components/toolbar/toolbar.module.ts`~~ ✓ Deleted
- ~~`src/app/layout/components/footer/footer.module.ts`~~ ✓ Deleted
- ~~`src/@noctua/noctua.module.ts`~~ ✓ Deleted
- ~~`src/@noctua/shared.module.ts`~~ ✓ Deleted
- ~~`src/@noctua/components/confirm-dialog/confirm-dialog.module.ts`~~ ✓ Deleted
- ~~`src/@noctua.editor/noctua-editor.module.ts`~~ ✓ Deleted
- `src/@noctua.form/noctua.form.module.ts` - Kept (library public API)

---

## Notes

- Material Module (material.module.ts) can be kept as a re-export utility or converted to an imports array
- Services with `providedIn: 'root'` require no changes
- Dialog services need to be updated to use `inject()` function or constructor injection in standalone components
- Test spec files may need updates for standalone component testing patterns
