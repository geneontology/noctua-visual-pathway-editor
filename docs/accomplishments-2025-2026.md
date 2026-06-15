# Noctua Projects - Major Accomplishments & Features (Late 2024-2026)

## Noctua Visual Pathway Editor (VPE)

**38 merged PRs | ~82 issues closed**

---

### 1. Chemical Intermediates Support

**PRs:** #111, #113, #129, #130, #131, #134, #139, #140 | **Issues:** #100, #112, #127, #128, #133

- Built end-to-end support for ChEBI chemical intermediates between enzymatic activities
- Implemented shared participant (intermediate) identification between activities
- Fixed reversed chemical connections
- Ensured deleting an activity no longer deletes connected small molecules (#112)
- Constrained chemical form to CHEBI only, excluding biomacromolecule (#144, #152)
- Renamed "Molecule Form" to "Chemical Form" for clarity (#127)
- Fixed causal relation form for connecting chemicals to activities (#128)

---

### 2. With/From Validation System

**PRs:** #174, #191, #203, #205, #209, #210 | **Issues:** #197, #206, #207, #208, noctua#997

- Built a With/From dropdown prototype with namespace validation UI
- Added With/From validation checks — namespace cannot be empty, autocorrect for case (e.g., "Go" to "GO")
- Extended With/From checks to work in both create and edit modes
- Added allowed databases info dialog showing curators what's valid
- Auto-suggest `GO_REF:0000024` when using ISS evidence
- Filtered out "do not annotate" subset terms from the VPE
- Updated entity list (added PomBase, expanded with/from entities)

---

### 3. Error & Violation Display System

**PRs:** #190, #205 | **Issues:** #184

- Designed and implemented a new error/violation panel for model validation
- Fixed error count display accuracy
- Added informational dialogs for allowed field values
- Surfaced validation messages to help curators fix annotation issues

---

### 4. Search Annotations Overhaul

**PRs:** #104, #218 | **Issues:** #86, #70, #110, #188, #94, #76

- Added Search Annotations capability when editing (not just creating)
- Fixed scrolling so all results can be viewed and selected on both panels (#188)
- Filtered CC annotations for `occurs_in` relation to cellular anatomical structure only, preventing incorrect assertions (#110)
- Fixed NOT annotations incorrectly displaying as positive (#105)
- Removed IEA/IBA restrictions from search (#197)
- Increased font size for readability (#118)

---

### 5. Group Permission & Security

**PRs:** #107, #108, #154 | **Issues:** #102, #150

- Added confirmation dialog when editing a model outside your group
- Added group check for editing model annotations
- Fixed false positive permission warning popup that was confusing curators (#150)
- Switched to raw group ID comparison for reliable permission checking

---

### 6. Form & Menu UX Overhaul

**PRs:** #145, #147, #149 | **Issues:** #136, #141, #120, #125, #132, #133

- Unified create and edit forms — made edit form match create form layout
- Simplified the (+) add menu across all forms
- Fixed "Export As" menu (#141)
- Removed evidence from GP box (cleaner interface)
- Consistent "Has_input" labeling across UI (#167)
- Added ability to add/edit Protein Complex after creation (#121)
- Differentiated Activity Unit form from Protein Complex form (#132)
- Simplified workbench menus (#116)

---

### 7. Evidence Editor Improvements

**PRs:** #196, #217 | **Issues:** #181, #202, #143

- Delete Evidence now functional via trash icon on relations (#181)
- Hid irrelevant menu items (Search Annotations, Fill with Root Term) in evidence editor dropdown (#202)
- Only show the "more actions" menu button when relevant items exist
- ISS evidence support on create form (#186)

---

### 8. Angular & Codebase Modernization

**PR:** #185

- Major Angular update and framework cleanup
- Complete removal of ART (Annotation Review Tool) features — legacy code cleanup
- Fixed saving bug that was still using ART code paths (#41, #144)

---

### 9. Model State Management — Templates

**PRs:** #213, #214 | **Issue:** noctua#1033

- Renamed model state from "closed" to "template" — now searchable on the landing page
- Added ability to change model state directly from the form

---

### 10. Data Integrity & Crash Fixes

**PRs:** #183, #230 | **Issues:** #41, #137, #229, #122

- Fixed critical saving bug where models would not persist (#41 — long-standing issue)
- Fixed ghost evidence node crash when evidence IRIs reference undeclared individuals (#229)
- Fixed deletion randomly removing annotations from activity units (#122)
- Fixed refresh after deletion so UI stays in sync (#138, #164)
- Fixed confirmation messages for CRUD operations

---

### 11. Ontology & Reference Data Updates

**PRs:** #173, #191 | **Issues:** #74, noctua#838

- Replaced CARO with Uberon for anatomy terms
- Fixed cell type autocomplete (#74 — marked priority)
- Updated PomBase namespace for with/from
- Layout: reduced vertical separation in graph display (#86)

---

### 12. Evidence Editor Dropdown Context Filtering

**PR:** #217 | **Issue:** #202

- Context-aware evidence editor menus — hide irrelevant options based on what's being edited
- Cleaner, less confusing editing experience for curators

---

### VPE Accomplishments Summary

- Built end-to-end **chemical intermediates** support (ChEBI) between enzymatic activities, with constrained chemical forms, proper deletion handling, and corrected connection directions (PRs #111-#140)
- Designed and shipped a **With/From validation system** with namespace dropdown, case autocorrect, and allowed-database info dialogs working in both create and edit modes (PRs #174, #203, #205, #209, #210)
- Created a new **error/violation display panel** surfacing model validation issues to curators in real-time with accurate error counts and allowed-value info dialogs (PRs #190, #205)
- Overhauled **Search Annotations** to work during editing, with scrollable results, CC filtering for `occurs_in`, NOT annotation filtering, and IEA/IBA support (PRs #104, #218)
- Added **group permission guards** with confirmation dialogs and raw group ID comparison to prevent accidental edits to other groups' models (PRs #107, #108, #154)
- **Unified create and edit forms** for consistent UX, simplified add menus, added Protein Complex editing post-creation, and differentiated Activity Unit from Protein Complex forms (PRs #145, #147, #149)
- Enabled **Delete Evidence** on relations via trash icon and built context-aware evidence editor menus that hide irrelevant options (PRs #196, #217)
- Completed a **major Angular update** and full removal of legacy ART (Annotation Review Tool) code, fixing long-standing save bugs (PR #185)
- Introduced **model state "template"** (renamed from "closed") with landing page searchability and in-form state changes (PRs #213, #214)
- Fixed critical **data integrity issues** including ghost evidence node crashes, deletion sync problems, random annotation removal, and model persistence failures (PRs #183, #230)
- Replaced **CARO with Uberon** ontology for anatomy terms and fixed cell type autocomplete (PRs #173, #191)
- Resolved **82+ issues** including many long-standing bugs dating back to the early project

---
---

## Noctua Standard Annotations Editor (SAE)

**12 merged PRs | 12 issues closed**

---

### 1. Multi-Gene Annotation & Sorting

**PRs:** #63, #65, #66 | **Issues:** #42, #53, #62, #39

- Added functionality to duplicate annotations across multiple gene entities at once
- Added sorting direction controls on the annotation table
- Gene list input now supports comma-separated values with duplicate removal
- Added 150-gene maximum limit (constrained by Solr request size)
- Reverted tabbing feature after feedback; cleaned up add gene list UX

---

### 2. With/From Restricted Namespace Dropdown

**PR:** #80 | **Issue:** #76

- Replaced free-text with/from input with a structured dropdown restricted to 21 allowed database namespaces (UniProtKB, GO, CHEBI, MGI, etc.)
- Added validation to block invalid DB prefixes on save
- Added automatic case correction (e.g., `chebi` to `CHEBI`)
- Applied validation and case correction across all save paths: inline edit, create form, evidence form

---

### 3. Quick ISS Evidence Menu

**PR:** #83 | **Issue:** #78

- Added a "more options" menu button on the evidence row in the annotation form
- Menu includes "Add ISS Evidence" option that auto-fills ECO:0000250 + GO_REF:0000024
- Streamlines a common curator workflow

---

### 4. Remove Copy Model from SAE

**PR:** #82 | **Issue:** #77

- Removed the copy model button from the toolbar and the copy model sidebar
- Declutters the SAE interface by removing a feature not relevant to standard annotations

---

### 5. Fix Root Term Fill (Evidence & Reference)

**PR:** #84 | **Issue:** #79

- Fixed root term fill to correctly populate evidence (ECO:0000307) and reference (GO_REF:0000015)
- The method was accessing form controls at the wrong level — now correctly targets nested controls inside the evidences FormArray

---

### 6. Biological Phase Terms in Extensions

**PR:** #86 | **Issue:** #88

- Phase terms now selectable in extension autocompletes for `happens_during`, `existence_overlaps`, and `existence_starts_and_ends_during` relations
- Bypassed the `gocheck_do_not_annotate` filter specifically for biological phase categories
- Phase terms remain blocked in the primary GO term field and non-phase extensions

---

### 7. Toolbar & Menu Cleanup

**PR:** #71 | **Issue:** #69

- Simplified toolbars with hover-over title
- Removed workbenches menu bar for cleaner interface

---

### 8. Ontology Updates (CARO to Uberon)

**PR:** #72 | **Issue:** noctua#838

- Replaced CARO with Uberon for anatomy terms in the SAE (mirroring VPE change)

---

### 9. Help Link Fix

**PR:** #75 | **Issue:** noctua#996

- Fixed the help link for SAE

---

### SAE Accomplishments Summary

- Shipped **multi-gene annotation** allowing curators to duplicate annotations across multiple gene entities in one action, with comma-separated input and 150-gene safety limit (PRs #63, #65, #66)
- Built a **restricted With/From namespace dropdown** with 21 allowed databases, save-time validation, and automatic case correction across all save paths (PR #80)
- Added a **quick ISS Evidence menu** that auto-fills ECO:0000250 + GO_REF:0000024 in one click, streamlining a common curator workflow (PR #83)
- Fixed **root term fill** to correctly populate evidence and reference inside nested FormArray controls (PR #84)
- Enabled **biological phase terms** in annotation extensions for `happens_during`, `existence_overlaps`, and `existence_starts_and_ends_during` relations while keeping them blocked elsewhere (PR #86)
- Removed the irrelevant **Copy Model** feature from the SAE interface to reduce clutter (PR #82)
- Simplified **toolbars and menus** for a cleaner curator workflow (PR #71)
- Replaced **CARO with Uberon** ontology for anatomy terms, consistent with VPE (PR #72)
- Fixed **help links** and sorting direction controls (PRs #75, #63)
- Resolved **12 issues** spanning data validation, UI cleanup, and new annotation capabilities

---
---

## GO-CAM Visualization Widget (wc-gocam-viz)

**14 merged PRs | ~30 issues closed (late 2024-2026)**

---

### 1. Comprehensive Relation Display & Legend Overhaul

**PRs:** #39, #54, #60 | **Issues:** #33, #37, #38, #40, #41, #49, #50, #59

- Added all missing relation types: indirect regulates, constitutively upstream, provides input for, and more
- Replaced hardcoded legend images with dynamically generated SVGs from a central legend map — no more hardcoded colors, images, or strokes
- Refined relations according to the official GO-CAM relation specification spreadsheet
- Fixed disallowed relations from appearing in the display
- Made the legend full-width and cleaned up unused image assets

---

### 2. Chemical/Molecule Visualization

**PR:** #68 | **Issues:** #67, #51

- Changed chemical/molecule shapes from rectangles to oval/ellipse for visual distinction from activity units
- Added publication evidence icons on molecular function nodes
- Simplified color scheme — two colors for molecules vs. activity units instead of separate BP-only/CC-only colors

---

### 3. Publication & Evidence References

**PRs:** #66, #71, #82 | **Issues:** #51, #62, #70, #81

- Fixed broken links to reference/publication URLs
- Added newspaper icon for evidence references on activity nodes
- Fixed indirect negative regulation relations rendering as indirect positive regulation
- Fixed edges incorrectly linking to other activity units by preventing node revisits
- Handled references without resolved URLs gracefully — render icon in a span instead of an empty link

---

### 4. Protein Complex Expand/Collapse

**PR:** #64 | **Issue:** #61

- Fixed the expand/collapse functionality for protein-containing complexes
- Added additional edge-type check for `has_part` relationships

---

### 5. UniProtKB Integration & Styling API

**PRs:** #77, #80 | **Issues:** (UniProt integration work)

- Exposed custom CSS properties and shadow DOM parts for consumer styling — enabling UniProtKB entry page integration
- Added configurable hover link color, node alignment, and process label styling
- Removed unnecessary default padding that caused evidence icon misalignment and unwanted horizontal scrolling

---

### 6. Technical Cleanup & Stability

**PRs:** #48, #63, #78, #79 | **Issues:** #74

- Released version 1.0.1 with accumulated fixes
- Removed Moment.js dependency entirely, replaced with native Date — eliminated the `Can't resolve './locale'` build error
- Prevented empty links from opening blank tabs when reference URLs are missing
- Pinned version specifiers in script tag URLs to avoid pulling beta versions

---

### wc-gocam-viz Accomplishments Summary

- Overhauled the **relation display system** to show all GO-CAM relation types (indirect regulation, constitutively upstream, provides input for, etc.) with proper glyphs and edge styles, fixing multiple misrendered or missing relations (PRs #39, #54, #60)
- Rebuilt the **legend from scratch** using dynamically generated SVGs from a central map, eliminating all hardcoded images, colors, and strokes, and aligning with the official GO-CAM relation specification (PR #60)
- Gave **chemicals/molecules an oval shape** to visually distinguish them from rectangular activity units, matching the VPE design (PR #68)
- Fixed **publication/evidence reference links** across activity and molecular function nodes, added newspaper icons, and handled missing URLs gracefully (PRs #66, #71, #82)
- Fixed **indirect negative regulation** incorrectly rendering as positive regulation — a high-priority display bug (PR #71)
- Fixed **protein complex expand/collapse** to correctly handle `has_part` edge types (PR #64)
- Exposed a **styling API** (CSS custom properties and shadow DOM parts) enabling seamless integration into UniProtKB entry pages (PRs #77, #80)
- Removed **Moment.js** dependency entirely, replacing it with native Date and eliminating a recurring build error (PR #78)
- Prevented **empty links** from opening blank browser tabs when reference URLs are unavailable (PRs #79, #82)
- Released **version 1.0.1** and pinned script tag version specifiers to avoid accidental beta version usage (PRs #48, #63)
- Resolved **~30 issues** covering relation accuracy, visual design, evidence display, and third-party integration
