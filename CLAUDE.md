# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Noctua Visual Pathway Editor is an Angular 20 application for visualizing and editing biological pathway models (CAMs - Causal Activity Models) as part of the Gene Ontology project. 

### Directories to Ignore

- `./workbenches/` - Compiled output folder, do not analyze or modify
- `./downloads/` - Archive folder with old code to reviewing the changes before angular update

## Task Management

### Always Create and Maintain Task Plans

For EVERY non-trivial task you receive:

**Before starting work**: Create `plans/[task-name].md` with:

- Clear goal statement
- Current state analysis (what works, what's broken)
- Detailed implementation plan broken into phases/steps
- Progress tracking table
- Dependencies and blockers
- Files to create/modify
- Next steps

**While working**: Update `plans/[task-name].md` after completing each step:

- Mark completed steps with ✓ or DONE
- Update progress tables
- Add new findings or changes to approach
- Note any issues encountered
- Update next steps

**After completing**: Final update to `plans/[task-name].md`:

- Mark all steps complete
- Summary of what was accomplished
- Any remaining TODO items
- Lessons learned or notes for future work

See [plans/template.md](plans/template.md) for detailed examples and formats.

## Build Commands

```bash
npm start                    # Dev server on http://localhost:4202
npm run build                # Production build (requires 6GB memory)
npm test                     # Unit tests (Karma/Jasmine)
npm run lint                 # TSLint
npm run build-stats          # Bundle analysis with stats.json
npm run build:beta-test      # Beta test build
```

## Architecture

### Module Structure

| Module             | Path                              | Purpose                                                                                    |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------------------ |
| **@noctua**        | `src/@noctua/`                    | Core shared module - services, components, directives, pipes, animations, Material imports |
| **@noctua.form**   | `src/@noctua.form/`               | Form/data services and domain models (aliased as `@geneontology/noctua-form-base`)         |
| **@noctua.graph**  | `src/@noctua.graph/`              | Graph visualization using JointJS + Dagre + GraphLib                                       |
| **@noctua.common** | `src/@noctua.common/`             | Shared data services, UI models, panel enums                                               |
| **@noctua.editor** | `src/@noctua.editor/`             | Inline editing components (dropdowns, references, with fields)                             |
| **@noctua.curie**  | `src/@noctua.curie/`              | CURIE utilities using @geneontology/curie-util-es5                                         |
| **noctua-form**    | `src/app/main/apps/noctua-form/`  | CAM form editing UI, dialogs                                                               |
| **noctua-graph**   | `src/app/main/apps/noctua-graph/` | Main graph visualization app                                                               |

### Key Services

| Service                      | Location                                                     | Purpose                                               |
| ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| **NoctuaGraphService**       | `@noctua.form/services/graph.service.ts`                     | CAM graph state, Minerva manager, activity management |
| **CamService**               | `@noctua.form/services/cam.service.ts`                       | CAM CRUD, form initialization, CAM selection          |
| **NoctuaLookupService**      | `@noctua.form/services/lookup.service.ts`                    | Ontology term autocomplete (GOLr), evidence lookup    |
| **ActivityConnectorService** | `@noctua.form/services/activity-connector.service.ts`        | Activity relationship/connector management            |
| **NoctuaUserService**        | `@noctua.form/services/user.service.ts`                      | User authentication, Barista token management         |
| **NoctuaFormMenuService**    | `@noctua.form/services/noctua-form-menu.service.ts`          | Panel/menu/drawer state management                    |
| **NoctuaFormDialogService**  | `src/app/main/apps/noctua-form/services/dialog.service.ts`   | Dialog management (lazy-loaded)                       |
| **CurieService**             | `@noctua.curie/services/curie.service.ts`                    | CURIE expansion/compression                           |
| **NoctuaFormConfigService**  | `@noctua.form/services/config/noctua-form-config.service.ts` | Form configuration                                    |
| **ShapesService**            | `@noctua.graph/services/shapes.service.ts`                   | JointJS shape definitions                             |

### Domain Models

All core domain models are in `src/@noctua.form/models/activity/`:

| Model            | Key Enums/Interfaces                                                | Purpose                                             |
| ---------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| **CAM**          | ReloadType, CamRebuildSignal, CamOperation                          | Root model for causal activity models               |
| **Activity**     | ActivityState, ActivitySortField, ActivityDisplayType, ActivityType | Individual activity/annotation                      |
| **ActivityNode** | ActivityNodeType (14+ types), GoCategory                            | Nodes within activities                             |
| **Entity**       | EntityType                                                          | Biological entities (proteins, etc.)                |
| **Evidence**     | EvidenceExt                                                         | Supporting evidence with pending changes tracking   |
| **Predicate**    | -                                                                   | Relationships with evidence lookup maps             |
| **Triple**       | ActivityTriple                                                      | RDF triples (generic over ActivityNode or Activity) |

Additional models: `activity-node.ts`, `connector-activity.ts`, `connector-rule.ts`, `error/` (violations, activity errors)

### Panel System

Defined in `src/@noctua.common/models/menu-panels.ts`:

```typescript
enum LeftPanel { camForm, copyModel, activityForm }
enum MiddlePanel { camGraph, camTable }
enum RightPanel { camForm, camTable, activityTable, camErrors, activityConnectorTable, termDetail }
```

Managed by **NoctuaFormMenuService** with:

- `selectLeftPanel()`, `selectMiddlePanel()`, `selectRightPanel()`
- `openLeftDrawer()`, `closeLeftDrawer()`, `toggleLeftDrawer()`
- `openRightDrawer()`, `closeRightDrawer()`

### Component Architecture

**Standalone Components** (migrated):

- NoctuaGraphComponent, CamGraphComponent, ActivityTableComponent
- ActivityConnectorTableComponent, CamErrorsComponent, RelationPreviewComponent

**NgModule Components** (legacy wrappers for routing):

- noctua-form.module.ts, noctua-graph.module.ts

**Key Form Components** (`noctua-form/cam/`):

- ActivityFormComponent - Main activity editing
- EntityFormComponent - Entity/term selection
- CamFormComponent - CAM metadata editing
- ActivityConnectorFormComponent - Relationship editing
- ChemicalConnectorFormComponent - Chemical entity handling
- CamToolbarComponent - Toolbar actions

**Dialogs** (`noctua-form/dialogs/` - lazy-loaded via dynamic imports):

- CreateActivityDialogComponent, ActivityErrorsDialogComponent
- AddEvidenceDialogComponent, SelectEvidenceDialogComponent
- SearchEvidenceDialogComponent, SearchDatabaseDialogComponent
- AllowedDatabasesDialogComponent, ConfirmCopyModelDialogComponent

### Routing

```typescript
// app.routes.ts - lazy loads noctua-graph module
{ path: '', loadChildren: () => import('./main/apps/noctua-graph/noctua-graph.module') }
{ path: '**', redirectTo: '' }
```

### External Backend Integration

| Service     | Libraries                                                     | Configuration                                          |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| **Minerva** | bbop-manager-minerva, bbop-response-barista, minerva-requests | `globalMinervaDefinitionName`, `globalBaristaLocation` |
| **GOLr**    | amigo2, golr-conf, bbop-rest-manager, bbop-response-golr      | `globalGolrServer`, `globalGolrNeoServer`              |
| **Barista** | bbop-client-barista                                           | `globalBaristaLocation` (default: localhost:3400)      |

## Key Dependencies

- **Angular**: 20.3.16
- **Angular Material**: 20.2.14
- **TypeScript**: 5.9.3
- **RxJS**: 7.5.5
- **Build System**: Angular Application Builder (Vite/esbuild)
- **JointJS**: 3.5.5 (graph visualization)
- **Dagre**: 0.8.5 + @dagrejs/graphlib 2.1.4 (graph layout)
- **jQuery**: 3.6.0 + jQuery UI 1.13.1 (legacy support)
- **Backbone**: 1.4.1 (legacy BBOP integration)
- **Lodash**: 4.17.21
- **Moment**: 2.29.3
- **BBOP libraries**: minerva, barista, graph-noctua, response

## State Management

Uses **RxJS BehaviorSubject** pattern throughout:

```typescript
// GraphService
onCamRebuildChange: BehaviorSubject<any>
onCamGraphChanged: BehaviorSubject<Cam>
onActivityAdded: BehaviorSubject<Activity>

// CamService
onCamChanged, onCamsChanged, onCopyModelChanged
onSelectedCamChanged, onSelectedActivityChanged
camFormGroup$: Observable<FormGroup>
```

**Cleanup Pattern**: `takeUntil()` with `Subject` for proper unsubscription:

```typescript
private _unsubscribeAll: Subject<any>;
this.observable.pipe(takeUntil(this._unsubscribeAll))
```

## Code Style

- Max line length: 140 characters
- Single quotes, semicolons required
- TypeScript path alias: `@geneontology/noctua-form-base` → `@noctua.form/`
- Component pattern: Standalone components preferred, NgModule for backward compatibility
- State management: BehaviorSubject with `takeUntil` cleanup pattern

## SCSS & Theming

### Structure

- Main styles: `src/@noctua/scss/noctua.scss`
- Theming: `src/@noctua/scss/theming.scss` (uses `@use '@angular/material'`)
- Core: `src/@noctua/scss/core.scss`
- Mixins: `src/@noctua/scss/mixins/_breakpoints.scss`

### Partials (`src/@noctua/scss/partials/`)

- `_colors.scss` - Color variables and utility classes
- `_material.scss` - Material component overrides
- `_mdc-form-field-theme.scss` - MDC form field theming
- `_angular-material-fix.scss` - Material compatibility fixes
- `_typography.scss`, `_buttons.scss`, `_forms.scss`, `_cards.scss`, `_scrollbars.scss`

### Color Palette

```scss
$noc-primary-color: #3b5998        // Noctua blue
$noc-primary-color-accent: #8b9dc3
$noc-secondary-color: #995014
$noc-mf: #7cd488                   // Molecular Function (green)
$noc-bp: #f4c89c                   // Biological Process (tan)
$noc-cc: #d3b5f5                   // Cellular Component (purple)
```

### Useful Mixins

- `deep-width($number)`, `deep-height($number)` - Set width/height/min/max together
- `noc-icon-size($number)` - Icon sizing
- `noc-chip-color($color)` - Chip styling
- `media-breakpoint("lt-lg")` - Responsive breakpoints

### Dialog Styles

Add dialog styles in `noctua.scss` with class `.noc-<dialog-name>-dialog`:

```scss
.noc-activity-create-dialog { width: 900px; height: 90%; }
.noc-select-evidence-dialog { width: 1100px; }
```

## Environment Configuration

Located in `src/environments/`:

| Variable                      | Purpose                                                |
| ----------------------------- | ------------------------------------------------------ |
| `globalBaristaLocation`       | Barista service URL (default: `http://localhost:3400`) |
| `globalMinervaDefinitionName` | Minerva backend name                                   |
| `globalGolrServer`            | GOLr Solr server                                       |
| `globalGolrNeoServer`         | Neo GOLr server                                        |
| `spaqrlApiUrl`                | SPARQL endpoint                                        |
| `noctuaUrl`                   | Noctua base URL                                        |
| `amigoTerm`                   | AmiGO term URL prefix                                  |
| `pubMedSummaryApi`            | PubMed API endpoint                                    |

Files: `environment.ts` (dev), `environment.prod.ts` (prod), `environment.beta-test.ts` (beta)

## Common Tasks

### Adding a Dialog

1. Create folder: `src/app/main/apps/noctua-form/dialogs/<dialog-name>/`
2. Create standalone component files (`.ts`, `.html`, `.scss`)
3. Add dialog styles in `src/@noctua/scss/noctua.scss` with class `.noc-<dialog-name>-dialog`
4. Add lazy import in `NoctuaFormDialogService.openDialog()` using dynamic import
5. Call via `NoctuaFormDialogService`

### Adding Services

1. Place in appropriate module (`@noctua.form/services/` for core logic)
2. Use `providedIn: 'root'`
3. Export from `index.ts`
4. Use BehaviorSubject for observable state

### Adding Evidence/Reference Types

- Reference databases: `src/@noctua.form/data/reference-dbs.ts` (PMID, DOI, GO_REF)
- WithFrom databases: `src/@noctua.form/data/withfrom-dbs.ts` (22 databases: UniProtKB, GO, CHEBI, etc.)
- Evidence model: `src/@noctua.form/models/activity/evidence.ts`

### Key Data Files

- `@noctua.form/data/config/model-definition.ts` - Model field definitions
- `@noctua.form/data/config/shape-definition.ts` - Shape/form definitions
- `@noctua.form/data/config/entity-definition.ts` - Entity field definitions
- `@noctua.curie/data/go-context.ts` - GO CURIE context

## Testing

- **Unit tests**: Karma 6.3 + Jasmine 4.1
- **Coverage output**: `./coverage` directory
- **Test entry point**: `src/test.ts`
- Manual UI testing on `http://localhost:4202`

## Git Conventions

### Branch Naming

- Feature: `issue-<number>-<short-description>`
- Bug fix: `fix-<number>-<short-description>`

### Commit Messages

- Keep concise, describe what changed
- Reference issue numbers when applicable
- Do not add "Co-Authored-By" lines

## Reviewers

@pgaudet @vanaukenk @kltm @thomaspd

## Gotchas

- Material design patches and overrides are in `src/@noctua/scss/partials/`
- Global scripts (jQuery, Lodash, Backbone, Dagre, Graphlib) loaded via angular.json scripts array
- Production builds require 6GB memory (`node --max_old_space_size=6144`)
- jQuery/Backbone still used for BBOP library integrations
- Some components exist in both standalone and NgModule forms during migration
- Dialogs use dynamic imports for lazy loading - check `dialog.service.ts` for pattern

## PR Template

```markdown
### Issues

- <link to related issue>

### Changes

- <description of changes>

### Tests

- [ ] <manual test steps>

cc @pgaudet @vanaukenk @kltm @thomaspd
```
