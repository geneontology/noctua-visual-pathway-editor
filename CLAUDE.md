# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Noctua Visual Pathway Editor is an Angular 18 application for visualizing and editing biological pathway models (CAMs - Causal Activity Models) as part of the Gene Ontology project. This is a **generated repo from Noctua Form Base** - modifications may be overwritten.

### Directories to Ignore

- `./workbenches/` - Compiled folder, do not analyze or modify files in this directory

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

### Format Guidelines

**For simple tasks** (single file changes, quick fixes):

```markdown
# Task: [Brief description]

## Steps
- [ ] Step 1
- [x] Step 2 (completed)

## Current Status
Working on: [step name]
```

**For complex tasks** (multi-file refactoring, feature additions):

- Include progress summary tables
- Organize into phases
- Track files created/modified separately
- Document API changes needed
- List dependencies and blockers
- Maintain current state diagnosis section

See [plans/template.md](plans/template.md) for detailed examples and formats.

## Build Commands

```bash
npm start                    # Dev server on http://localhost:4202
npm run build                # Production build (requires 6GB memory)
npm test                     # Unit tests (Karma/Jasmine)
npm run lint                 # TSLint
npm run e2e                  # E2E tests (Protractor - legacy/deprecated)
npm run build-stats          # Bundle analysis
```

## Architecture

### Module Structure

- `src/@noctua/` - Core shared module (services, components, directives, pipes, animations)
- `src/@noctua.form/` - Form/data services and domain models (aliased as `@geneontology/noctua-form-base`)
- `src/@noctua.graph/` - Graph visualization using JointJS + Dagre + GraphLib
- `src/@noctua.common/` - Shared data services and UI models (panel enums, toolbar options)
- `src/@noctua.editor/` - Inline editing components (dropdowns, references, with fields)
- `src/@noctua.curie/` - CURIE utilities and services
- `src/app/main/apps/` - Main application modules (noctua-form, noctua-graph)

### Key Services

- **GraphService** (`@noctua.form/services/graph.service.ts`) - CAM graph state management
- **CamService** (`@noctua.form/services/cam.service.ts`) - CAM CRUD operations via Minerva backend
- **LookupService** (`@noctua.form/services/lookup.service.ts`) - Ontology term autocomplete
- **ActivityConnectorService** - Manages activity relationships
- **NoctuaFormMenuService** (`@noctua.form/services/noctua-form-menu.service.ts`) - Panel/menu management
- **NoctuaFormDialogService** (`src/app/main/apps/noctua-form/services/dialog.service.ts`) - Dialog management

### Domain Models (in `@noctua.form/models/activity/`)

- **CAM** - Root model for causal activity models
- **Activity** - Individual activity/annotation
- **Entity** - Biological entities (proteins, etc.)
- **Evidence** - Supporting evidence for annotations
- **Predicate** - Relationships between entities
- **Triple** - RDF triples

### Panel System

Enum-based panel selection in `src/@noctua.common/models/menu-panels.ts`:

- **LeftPanel**: camForm, copyModel, activityForm
- **MiddlePanel**: camGraph, camTable
- **RightPanel**: camForm, camTable, activityTable, camErrors, activityConnectorTable, termDetail

### External Backend Services

- **Minerva** - Annotation backend (bbop-manager-minerva)
- **GOLr** - Solr-based ontology search
- **Barista** - GO web services (default: http://localhost:3400)

## Key Dependencies

- **Angular**: 18.2.13
- **Angular Material**: 16.2.0 (older than Angular - uses legacy components)
- **TypeScript**: 5.5
- **RxJS**: 7.5.5
- **JointJS**: 3.5.5 (graph visualization)
- **Dagre**: 0.8.5 (graph layout)
- **jQuery**: 3.6.0 + jQuery UI 1.13.1 (legacy support)
- **BBOP libraries**: minerva, barista, graph, response (backend integration)

## Code Style

- Max line length: 140 characters
- Single quotes, semicolons required
- TypeScript path alias: `@geneontology/noctua-form-base` → `@noctua.form/`
- Component pattern: NgModule-based (not standalone)
- State management: BehaviorSubject with `takeUntil` cleanup pattern

## SCSS & Theming

### Location

- Main styles: `src/@noctua/scss/noctua.scss`
- Theming: `src/@noctua/scss/theming.scss`
- Mixins: `src/@noctua/scss/mixins/`
- Partials: `src/@noctua/scss/partials/`

### Color Palette

- Primary: `#3b5998` (Noctua blue)
- Primary accent: `#8b9dc3`
- Secondary: `#995014`
- Molecular function: `#7cd488` (green)
- Biological process: `#f4c89c` (tan)
- Cellular component: `#d3b5f5` (purple)

### Useful Mixins

- `deep-width()`, `deep-height()` - Set width/height/min/max together
- `noc-icon-size()` - Icon sizing
- `noc-chip-color()` - Chip styling

## Environment Configuration

Backend URLs configured in `src/environments/environment.ts`:

- `globalBaristaLocation` - Barista service URL
- `globalGolrServer` - GOLr Solr server
- `globalMinervaDefinitionName` - Minerva backend name

Environment files:

- `environment.ts` - Development
- `environment.prod.ts` - Production
- `environment.beta-test.ts` - Beta testing

## Common Tasks

### Adding a Dialog

1. Create folder: `src/app/main/apps/noctua-form/dialogs/<dialog-name>/`
2. Create component files (`.ts`, `.html`, `.scss`)
3. Register in module
4. Add dialog styles in `src/@noctua/scss/noctua.scss` with class `.noc-<dialog-name>-dialog`
5. Call via `NoctuaFormDialogService`

### Adding Menu Items

1. Update editor dropdown: `src/@noctua.editor/inline-editor/editor-dropdown/editor-dropdown.component.html`
2. For panel menus, update `NoctuaFormMenuService`

### Adding Autocomplete Fields

- Use `LookupService` for ontology term autocomplete
- See existing implementations in activity form components

### Adding Services

1. Place in appropriate module (`@noctua.form/services/` for core logic)
2. Use `providedIn: 'root'`
3. Export from `index.ts`
4. Use BehaviorSubject for observable state

### Adding Evidence/Reference Types

- Reference databases: `src/@noctua.form/data/reference-dbs.ts`
- WithFrom databases: `src/@noctua.form/data/withfrom-dbs.ts`
- Evidence model: `src/@noctua.form/models/activity/evidence.ts`

## Testing

- **Unit tests**: Karma 6.3 + Jasmine 4.1
- **E2E tests**: Protractor 7.0 (deprecated)
- **Coverage output**: `./coverage` directory
- **Test entry point**: `src/test.ts`
- Manual UI testing on http://localhost:4202
- Test against CAM models in the workbench

## Branch Naming

- Feature: `issue-<number>-<short-description>`
- Bug fix: `fix-<number>-<short-description>`

## Commit Messages

- Keep concise, describe what changed
- Reference issue numbers when applicable

## Related Repositories

- **noctua-form-base**: Source library (this repo is generated from it)
- **noctua**: Main Noctua repository - https://github.com/geneontology/noctua

## Reviewers

@pgaudet @vanaukenk @kltm @thomaspd

## Gotchas

- Angular Material 16 with Angular 18 - version mismatch, uses legacy components
- Material design patches and overrides are in `src/@noctua/scss/`
- Some components are repeated across modules (not DRY)
- Production builds require 6GB memory
- Custom webpack config (`webpack.extra.js`) for Node module fallbacks (url, querystring)
- jQuery/Backbone still used for some legacy integrations

## PR Template

When creating PRs, use this format:

```
### Issues

- <link to related issue>

### Changes

- <description of changes>

### Tests

- [ ] <manual test steps>

cc @pgaudet @vanaukenk @kltm @thomaspd
```

## Git

Do not add "Co-Authored-By" lines to commits.