# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Noctua Visual Pathway Editor is an Angular 18 application for visualizing and editing biological pathway models (CAMs - Causal Activity Models) as part of the Gene Ontology project. This is a **generated repo from Noctua Form Base** - modifications may be overwritten.

## Build Commands

```bash
npm start                    # Dev server on http://localhost:4202
npm run build                # Production build (requires 6GB memory)
npm test                     # Unit tests (Karma/Jasmine)
npm run lint                 # TSLint
npm run e2e                  # E2E tests (Protractor)
```

## Architecture

### Module Structure
- `src/@noctua/` - Core shared module (services, components, directives, pipes)
- `src/@noctua.form/` - Form/data services and domain models (aliased as `@geneontology/noctua-form-base`)
- `src/@noctua.graph/` - Graph visualization using JointJS
- `src/@noctua.common/` - Shared data services and UI models
- `src/@noctua.editor/` - Inline editing components
- `src/app/main/apps/` - Main application modules

### Key Services
- **GraphService** (`@noctua.form/services/graph.service.ts`) - CAM graph state management
- **CamService** (`@noctua.form/services/cam.service.ts`) - CAM CRUD operations via Minerva backend
- **LookupService** (`@noctua.form/services/lookup.service.ts`) - Ontology term autocomplete
- **ActivityConnectorService** - Manages activity relationships

### Domain Models (in `@noctua.form/models/activity/`)
- **CAM** - Root model for causal activity models
- **Activity** - Individual activity/annotation
- **Entity** - Biological entities (proteins, etc.)
- **Evidence** - Supporting evidence for annotations

### External Backend Services
- **Minerva** - Annotation backend (bbop-manager-minerva)
- **GOLr** - Solr-based ontology search
- **Barista** - GO web services (default: http://localhost:3400)

## Code Style
- Max line length: 140 characters
- Single quotes, semicolons required
- TypeScript path alias: `@geneontology/noctua-form-base` → `@noctua.form/`

## Environment Configuration
Backend URLs configured in `src/environments/environment.ts`:
- `globalBaristaLocation` - Barista service URL
- `globalGolrServer` - GOLr Solr server
- `globalMinervaDefinitionName` - Minerva backend name
