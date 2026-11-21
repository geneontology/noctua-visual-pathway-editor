# model-analysis Specification

## Purpose
Gives curators whole-model checks: the rule that decides which activity units lack a causal relation (used by the Select menu's "No causal relations" filter), and a validation errors count and panel that list problems the model's data contains.

## Requirements

### Requirement: No causal relations check
The "No causal relations" check SHALL select every activity unit that has no causal relation to another activity unit. A causal relation is one of: causally upstream of (and its positive/negative effect and "or within" forms), constitutively upstream of, positively/negatively regulates, directly/indirectly positively/negatively regulates, provides input for, removes input for. Chemicals MUST NOT be selected.

#### Scenario: Unit linked only to a chemical
- **WHEN** activity units A and B each only have output chemical X and nothing else
- **THEN** "No causal relations" selects A and B
- **AND** X is not selected

#### Scenario: Units joined by a causal relation
- **WHEN** A directly positively regulates B and neither has any other relation
- **THEN** neither A nor B is selected

#### Scenario: Non-causal relation between units
- **WHEN** A and B are joined only by a relation outside the causal list, such as plain "regulates"
- **THEN** both A and B are selected

### Requirement: Chain through one chemical counts as causal
For "No causal relations", two different activity units SHALL count as causally connected when a line is drawn from the first to a chemical and another from that chemical to the second (A → X → B as drawn), e.g. A has output X and X is input of B, or X is a small molecule activator or inhibitor of B. Other arrangements and chemical-to-chemical links MUST NOT count.

#### Scenario: Output then input
- **WHEN** A has output X and B has input X
- **THEN** neither A nor B is selected by "No causal relations"

#### Scenario: Output then small molecule regulation
- **WHEN** A has output X and X is small molecule activator of B
- **THEN** neither A nor B is selected

#### Scenario: Shared output or shared input
- **WHEN** A and B both have output X, or A and B both have input X, and have no other relations
- **THEN** both A and B are selected

#### Scenario: Chain through two chemicals
- **WHEN** A has output X, X is linked to chemical Y, and Y is input of B, with no other relations
- **THEN** both A and B are selected

### Requirement: Validation error count in the toolbar
The model toolbar SHALL always show a validation error count chip. With errors it SHALL be red and read "1 Error Found" or "<N> Errors Found"; with none it SHALL be green and read "0 Error(s) Found". The count SHALL be the number of data model violations plus orphaned nodes plus orphaned relations.

#### Scenario: Model with errors
- **WHEN** the model has two data model violations and one orphaned relation
- **THEN** the toolbar shows a red chip reading "3 Errors Found"

#### Scenario: Clean model
- **WHEN** the model has no errors
- **THEN** the toolbar shows a green chip reading "0 Error(s) Found"

### Requirement: Validation errors panel
Clicking the error chip SHALL open a "Validation Errors" panel in the right drawer with three counts: "Data model violation errors (ShEx)", "Activity Units / Chemicals errors" and "Relations errors". Its Close button SHALL close the drawer and leave the chip unchanged.

#### Scenario: Open and close the panel
- **WHEN** the curator clicks the error chip
- **THEN** the right drawer shows "Validation Errors" with the three counts
- **AND** clicking Close closes the drawer while the chip stays as it was

### Requirement: Data model violation messages
The panel SHALL list each data model (ShEx) violation reported for a node that belongs to an activity unit or chemical, numbered, as "Only one <relation> is allowed" for a cardinality problem or "Incorrect relationship between <subject> and <object>" for a wrong relation, each with a small subject–relation(–object) diagram. Violations on other nodes MUST NOT be listed.

#### Scenario: Too many statements of one kind
- **WHEN** the server reports a cardinality violation for an activity unit's "enabled by" statement
- **THEN** the panel lists "Only one enabled by is allowed" with a diagram of the subject and relation

### Requirement: Orphaned nodes and relations
The panel SHALL list nodes that belong to no activity unit or chemical (evidence nodes excepted) under "Activity Units / Chemicals errors", split into "Node not shown" (no orphaned relation touches them) and "Node/relation combination not allowed". Relations that are neither a statement of an activity unit or chemical nor a relation between two of them SHALL be listed under "Relations errors" as source, relation, target.

#### Scenario: Node not part of any activity
- **WHEN** the model contains a node that is not part of any activity unit or chemical and no relation touches it
- **THEN** it is listed under "Node not shown" with its label and identifier
