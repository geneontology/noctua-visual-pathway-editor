# Noctua Form System - Architecture for React Rewrite

## Goal

Document how `shapes.json`, `createActivityBaseModel`, `createActivityModel`, and the `@noctua.form/data` layer work together, and how they feed into the graph visualization. Written for someone porting this to React.

---

## Overview: The Big Picture

The form system builds **Activity** objects (the core domain model) from declarative shape/model definitions. There are two construction paths:

1. **Base Model** (`createActivityBaseModel`) - Minimal skeleton used when *reading* data from the backend (BBOP/Minerva graph). Only the root node is created; additional nodes are added dynamically as the graph is traversed.

2. **Full Model** (`createActivityModel`) - Complete form skeleton used for the *editing UI*. All expected nodes and edges are pre-created with ShEx shape constraints for the "insert node" menus.

Both paths produce `Activity` objects that feed into the graph visualization (JointJS).

---

## Data Layer: `@noctua.form/data/`

### File Map

| File | Purpose |
|------|---------|
| `shapes.json` | ShEx-derived domain/range constraints (what can connect to what) |
| `shape-terms.json` | Lookup table of ontology term IDs to human-readable labels |
| `shape.ts` | TypeScript interface `ShexShapeAssociation` for shapes.json entries |
| `config/model-definition.ts` | Activity description templates + factory functions |
| `config/shape-definition.ts` | Node insertion rules (what nodes can be added where) |
| `config/entity-definition.ts` | GO category constants + `generateBaseTerm()` factory |
| `config/data-utils.ts` | Utility functions for querying shapes.json |
| `reference-dbs.ts` | Allowed reference databases (PMID, DOI, GO_REF) |
| `withfrom-dbs.ts` | Allowed "with/from" databases (UniProtKB, GO, CHEBI, etc.) |

---

## shapes.json - The Constraint Rules

`shapes.json` is derived from GO ShEx (Shape Expressions) rules. It defines **what ontology types can be connected to what, via which predicates**.

### Structure

```json
{
  "goshapes": [
    {
      "subject": "GO:0003674",        // Molecular Function
      "root_subject": "",
      "object": ["CHEBI:33695", "GO:0032991"],  // Gene Product OR Protein Complex
      "predicate": "RO:0002333",       // "enabled by"
      "is_multivalued": true,
      "is_required": false,
      "exclude_from_extensions": true,
      "context": ""
    }
  ]
}
```

### Fields Explained

| Field | Meaning |
|-------|---------|
| `subject` | Ontology ID of the **source** node type (the "from" side) |
| `root_subject` | If non-empty, indicates this rule only applies when the subject has this specific root ancestor |
| `object` | Array of allowed ontology IDs for the **target** node type (the "to" side) |
| `predicate` | The relationship/edge type (ontology relation ID) connecting subject to object |
| `is_multivalued` | Can this relationship have multiple objects? (one-to-many vs one-to-one) |
| `is_required` | Is this relationship mandatory? |
| `exclude_from_extensions` | If `true`, this rule is used for core structure only, NOT shown in the "add extension" menu |
| `context` | Filter for which editor uses this rule (empty = both VPE and graph editor) |

### Example Rules Read as English

```
"GO:0003674" --[enabled by]--> "CHEBI:33695" or "GO:0032991"
  = "A Molecular Function can be enabled by a Gene Product or Protein Complex"

"GO:0003674" --[part of]--> "GO:0008150"
  = "A Molecular Function can be part of a Biological Process"

"GO:0003674" --[occurs in]--> "UBERON:0001062"
  = "A Molecular Function can occur in an Anatomical Entity"

"UBERON:0001062" --[part of]--> "UBERON:0001062" or "NCBITaxon:1"
  = "An Anatomical Entity can be part of another Anatomical Entity or an Organism"
```

### How shapes.json Is Consumed

1. **`DataUtils.getSubjectShapes(shapes, subjectId)`** - Filter shapes where `subject === subjectId` and `exclude_from_extensions === false`
2. **`DataUtils.getRangeBySubject(shapes, subjectId, predicateId)`** - Find the specific shape for a subject+predicate pair
3. **`ShapeDescription.getShexJson(subjectIds)`** - For given subject IDs, get all possible predicates with their range labels (used to build the "insert node" dropdown menu)

---

## Ontology ID Reference

These IDs appear throughout the codebase. Map them to understand the domain:

### Node Types (GO/CHEBI/UBERON)

| ID | Label | Angular Enum |
|----|-------|-------------|
| `GO:0003674` | Molecular Function | `ActivityNodeType.GoMolecularFunction` |
| `GO:0008150` | Biological Process | `ActivityNodeType.GoBiologicalProcess` |
| `GO:0005575` | Cellular Component | `ActivityNodeType.GoCellularComponent` |
| `CHEBI:33695` | Gene Product (informational macromolecule) | `ActivityNodeType.GoMolecularEntity` |
| `CHEBI:24431` | Chemical Entity | `ActivityNodeType.GoChemicalEntity` |
| `GO:0032991` | Protein Complex | `ActivityNodeType.GoProteinContainingComplex` |
| `UBERON:0001062` | Anatomical Entity | `ActivityNodeType.GoAnatomicalEntity` |
| `CL:0000000` | Cell Type | `ActivityNodeType.GoCellTypeEntity` |
| `NCBITaxon:1` | Organism | `ActivityNodeType.GoOrganism` |

### Edge/Relationship Types (RO/BFO)

| ID | Label | Usage |
|----|-------|-------|
| `RO:0002333` | enabled by | MF → GP |
| `BFO:0000050` | part of | MF → BP, BP → BP, CC → Anatomy |
| `BFO:0000066` | occurs in | MF → CC |
| `RO:0002233` | has input | MF → GP/Chemical |
| `RO:0002092` | happens during | MF → Phase/Stage |
| `RO:0001025` | located in | Chemical → CC |
| `BFO:0000051` | has part | Complex → GP |
| `RO:0002418` | causally upstream of or within | Causal edge between activities |

---

## Activity Types

There are 5 activity types, each with a different form structure:

| Type | Enum | Root Node | Description |
|------|------|-----------|-------------|
| Default | `ActivityType.default` | Molecular Function | Standard: MF → GP, BP, CC |
| BP Only | `ActivityType.bpOnly` | MF (hidden) | Biological Process annotation |
| CC Only | `ActivityType.ccOnly` | Gene Product | Cellular Component annotation |
| Molecule | `ActivityType.molecule` | Chemical Entity | Chemical/small molecule |
| Protein Complex | `ActivityType.proteinComplex` | MF (with complex) | Complex-centered activity |

---

## createActivityBaseModel(activityType) - For Reading/Parsing

**Purpose**: Creates a minimal Activity skeleton for graph-to-model conversion (reading data from Minerva backend).

**Flow**:
```
createActivityBaseModel(ActivityType.default)
  → ModelDefinition.createActivity(activityUnitBaseDescription)
    → new Activity()
    → For each node in description.nodes:
        → EntityDefinition.generateBaseTerm(categories, displayOverrides)
          → new ActivityNode() with:
            - termLookup (GOLr search params for autocomplete)
            - predicate with evidence lookup params
            - display properties (section, group, weight, etc.)
        → activity.addNode(activityNode)
    → For each triple in description.triples:
        → Set predicate edge on object node
        → activity.addEdgeById(subjectId, objectId, predicate)
    → activity.updateEntityInsertMenu()  // builds canInsertNodes from shape-definition.ts
    → activity.enableSubmit()
```

### Base Description Example (Default Activity)

```typescript
// activityUnitBaseDescription - MINIMAL, only root node
{
  type: ActivityType.default,
  nodes: {
    GoMolecularFunction: {
      id: 'GO:0003674',
      type: ActivityNodeType.GoMolecularFunction,
      category: [GoMolecularFunction],
      label: 'Molecular Function',
      aspect: 'F',
      displaySection: displaySection.fd,
      displayGroup: displayGroup.mf,
      skipEvidenceCheck: true,
      canDelete: false,
      termRequired: true,
      weight: 1
    }
  },
  triples: []   // <-- NO triples! Nodes added dynamically during graph traversal
}
```

**Key difference from Full Model**: Base has only the root node, no triples. Additional nodes are dynamically inserted via `insertActivityNodeByPredicate()` as the backend graph is traversed.

---

## createActivityModel(activityType) - For the Edit Form

**Purpose**: Creates a complete Activity with all standard nodes pre-populated, plus ShEx-based extension menus.

**Flow**:
```
createActivityModel(ActivityType.default)
  → ModelDefinition.createActivityShex(activityUnitDescription)
    → new Activity()
    → For each node in description.nodes:
        → EntityDefinition.generateBaseTerm(categories, displayOverrides)
        → activity.addNode(activityNode)
    → For each triple in description.triples:
        → Set predicate edge
        → activity.addEdgeById(subjectId, objectId, predicate)
    → activity.updateShapeMenuShex()  // <-- KEY DIFFERENCE: builds menus from shapes.json
    → activity.enableSubmit()
```

### Full Description Example (Default Activity)

```typescript
// activityUnitDescription - FULL, all standard nodes + triples
{
  type: ActivityType.default,
  nodes: {
    GoMolecularFunction: { /* root node */ weight: 1 },
    GoMolecularEntity:   { label: 'enabled by (GP)', weight: 2 },
    GoBiologicalProcess: { label: '(MF) part of (BP)', weight: 10 },
    GoCellularComponent: { label: '(MF) occurs in (CC)', weight: 20 }
  },
  triples: [
    { subject: 'GoMolecularFunction', object: 'GoMolecularEntity',   predicate: edge.enabledBy },
    { subject: 'GoMolecularFunction', object: 'GoBiologicalProcess', predicate: edge.partOf },
    { subject: 'GoMolecularFunction', object: 'GoCellularComponent', predicate: edge.occursIn }
  ]
}
```

### Two Key Differences from Base

1. **Pre-built nodes**: GP, BP, CC nodes exist from the start (the form shows empty fields for them)
2. **`updateShapeMenuShex()`** instead of `updateEntityInsertMenu()`: Queries `shapes.json` to build dynamic "add node" menus based on ShEx constraints

---

## Node Insertion Flow (Dynamic Nodes)

When a user adds a node via the form's dropdown menu:

### Old Path (hardcoded rules from `shape-definition.ts`)

```
User clicks "Add" on MF node
  → canInsertEntity[ActivityNodeType.GoMolecularFunction] returns ShapeDescription[]
    Each entry = { node: ActivityNodeDisplay, predicate: Entity, cardinality }
  → User picks "has input (Gene Product)"
  → ModelDefinition.insertNode(activity, subjectNode, nodeDescription)
    → EntityDefinition.generateBaseTerm(categories, overrides)
    → Assign UUID, set tree level
    → activity.addNode(objectNode)
    → activity.updateEdges(subjectNode, objectNode, predicate)
```

### New Path (ShEx-driven from `shapes.json`)

```
User clicks "Add" on MF node
  → activity.updateShapeMenuShex()
    → ShapeDescription.getShexJson(subjectNode.category.map(c => c.category))
      → DataUtils.getSubjectShapes(shapes, 'GO:0003674')
        Filters shapes.json: exclude_from_extensions=false, subject='GO:0003674'
      → DataUtils.getRangeLabels(subjectShapes, lookupTable)
        Maps predicate IDs to labels using shape-terms.json
    → Returns: [{ id: 'RO:0002233', label: 'has input', rangeLabel: 'Gene Product/...' }, ...]
  → User picks one
  → ModelDefinition.insertNodeShex(activity, subjectNode, predExpr)
    → DataUtils.getRangeBySubject(shapes, subjectCategory, predicateId)
      → Finds matching shape, gets allowed object[] categories
    → EntityDefinition.generateBaseTerm(rangeCategories, defaults)
    → Assign UUID, set tree level
    → activity.addNode(objectNode)
    → activity.updateEdges(subjectNode, objectNode, predicate)
```

---

## How the Graph Visualization Consumes Activities

### Data Flow

```
Minerva Backend (BBOP JSON-LD)
        │
        ▼
NoctuaGraphService.rebuild()
        │  Fetches model via bbop-manager-minerva
        ▼
NoctuaGraphService.graphToActivities(camGraph)
        │  For each edge in BBOP graph:
        │    1. Detect activity type from root node
        │    2. Call createActivityBaseModel(type) → skeleton Activity
        │    3. DFS traversal: populate nodes from graph data
        │    4. For unknown predicates: insertActivityNodeByPredicate()
        ▼
Cam.activities: Activity[]
        │
        ▼
BehaviorSubject: onCamGraphChanged.next(cam)
        │
        ▼
CamGraphComponent (subscribes)
        │
        ▼
CamCanvas.addCanvasGraph(cam, layoutDetail)
        │  For each Activity:
        │    → createNode(activity, layoutDetail) → JointJS NodeCellList
        │       - activity.buildGPTrees() → gene product section
        │       - activity.buildTrees()   → function detail section
        │       - Set colors, headers, icons
        │    OR createMolecule(activity)  → JointJS NodeCellMolecule
        │  For each CausalRelation (activity↔activity edges):
        │    → NodeLink.create() with edge color
        ▼
JointJS Graph Render (SVG in DOM)
```

### Key Graph Service Methods

```typescript
// graph.service.ts

// 1. Determine which Activity template to use
getActivityPreset(subjectNode, objectNode, predicateId, bbopSubjectEdges): Activity {
  // Logic: check predicateId and node root types to pick ActivityType
  // e.g., if GP + partOf/locatedIn → ccOnly
  //        if MF rootNode + has causal edges → bpOnly
  //        else → default
  return this.noctuaFormConfigService.createActivityBaseModel(activityType);
}

// 2. Recursively populate Activity from BBOP graph
_graphToActivityDFS(camGraph, activity, bbopEdges, subjectNode) {
  each(bbopEdges, (bbopEdge) => {
    const predicateId = bbopEdge.predicate_id();
    const objectId = bbopEdge.object_id();

    // Try to find matching node in activity skeleton
    let objectNode = activity.getNode(predicateId_mapped_to_nodeType);

    // If not found, dynamically insert based on predicate
    if (!objectNode) {
      objectNode = this.noctuaFormConfigService
        .insertActivityNodeByPredicate(activity, subjectNode, predicateId, partialNode);
    }

    // Populate node data from BBOP graph
    objectNode.term = new Entity(termId, termLabel);
    objectNode.uuid = objectId;
    // ... evidence, date, etc.

    // Recurse into children
    const childEdges = camGraph.get_edges_by_subject(objectId);
    this._graphToActivityDFS(camGraph, activity, childEdges, objectNode);
  });
}
```

### Graph Node Appearance

Each Activity becomes a JointJS `NodeCellList` rectangle with sections:

```
┌─────────────────────────────┐
│  GP: UniProtKB:P12345       │  ← activity-gp-rect (gray)
│  proteinA                   │
├─────────────────────────────┤
│  MF: protein binding        │  ← activity-mf-rect (green)
│  BP: signal transduction    │  ← activity-bp-rect (tan)
│  CC: nucleus                │  ← activity-cc-rect (purple)
└─────────────────────────────┘
```

Molecule activities use `NodeCellMolecule` (circle shape) instead.

---

## Display Sections and Groups

Activities organize their nodes into display sections/groups for the form UI:

```typescript
displaySection = {
  gp: { id: 'gp', label: 'Gene Product' },
  fd: { id: 'fd', label: 'Function Description' }
}

displayGroup = {
  gp: { id: 'gp', label: 'Gene Product' },
  mf: { id: 'mf', label: 'Molecular Function' },
  bp: { id: 'bp', label: 'Biological Process' },
  cc: { id: 'cc', label: 'Cellular Component' }
}
```

**`weight`** controls ordering within a group (lower = higher in form).

---

## React Rewrite - Key Concepts to Implement

### 1. Shape Constraint System
- Import `shapes.json` as-is (it's framework-agnostic)
- Import `shape-terms.json` as-is (lookup table)
- Port `DataUtils` functions (pure utility, no Angular deps)
- Build a `useShapeConstraints(subjectIds)` hook

### 2. Activity Model
- Port `Activity`, `ActivityNode`, `Entity`, `Predicate`, `Evidence` classes
- These are plain TypeScript classes with no Angular dependencies
- Replace `BehaviorSubject` with React state/context or Zustand/Jotai

### 3. Activity Factory
- Port `createActivity()` and `createActivityShex()` as plain functions
- Port `ActivityDescription` type definitions (pure data, no Angular)
- The 5 description objects (activityUnitDescription, etc.) are plain objects

### 4. Form Config
- `noctuaFormConfig` in `noctua-form-config.ts` is a plain object with edge/node constants
- Port as a constants file or context provider

### 5. Graph Visualization
- Replace JointJS with React-compatible: React Flow, Cytoscape.js, or D3
- Port `CamCanvas.createNode()` logic to your chosen library's node renderer
- Port `CamCanvas.addCanvasGraph()` to layout logic

### 6. State Management
Replace Angular's `BehaviorSubject` pattern:

| Angular | React Equivalent |
|---------|-----------------|
| `BehaviorSubject<Cam>` | `useState` / Zustand store |
| `onCamGraphChanged.subscribe()` | `useEffect` / store subscription |
| `takeUntil(_unsubscribeAll)` | `useEffect` cleanup / `AbortController` |
| `NoctuaFormConfigService` (singleton) | React Context or module-level singleton |

### 7. Backend Integration
- `bbop-manager-minerva`, `bbop-response-barista` are npm packages
- `graphToActivities()` in `graph.service.ts` is the main parser
- Port this to a custom hook: `useMinervaGraph(modelId)`

---

## Progress

| Step | Status |
|------|--------|
| Document shapes.json | DONE |
| Document createActivityBaseModel | DONE |
| Document createActivityModel | DONE |
| Document graph visualization connection | DONE |
| Document React rewrite guidance | DONE |
