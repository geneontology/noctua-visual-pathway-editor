# evidence-and-references Specification

## Purpose
Defines how curators record, edit, validate, and follow evidence on CAM statements: the evidence code, reference, and with/from fields, the per-row evidence actions, the validation rules and their exact error messages, and the external link-outs shown for identifiers.

## Requirements

### Requirement: Evidence fields
The system SHALL represent each evidence on a statement as an evidence code, a reference, and an optional with/from value. A reference MAY hold several sources; the system SHALL display multiple sources separated by ", " and treat each source independently for linking.

#### Scenario: Multi-source reference is shown per source
- **WHEN** an evidence in the model has the sources `PMID:123` and `GO_REF:0000024`
- **THEN** the activity table shows both sources in the Reference cell separated by ", ", each as its own link

### Requirement: Evidence code search scope
The system SHALL search evidence codes only within the "evidence used in manual assertion" branch of ECO (ECO:0000352), SHALL show each result's evidence abbreviation (e.g. IDA) beside its label, and SHALL offer the evidence codes already used in the model before the curator types.

#### Scenario: Evidence code suggestions on focus
- **WHEN** the curator focuses an empty Evidence field in a model that already uses "direct assay evidence used in manual assertion"
- **THEN** that evidence code is listed as a suggestion without typing

#### Scenario: Evidence code result shows abbreviation
- **WHEN** the curator types "direct assay" in an Evidence field
- **THEN** each matching ECO result shows its abbreviation (for example IDA) alongside its label and ECO id

### Requirement: Reference entry
The system SHALL let the curator type a reference directly, suggesting references already used in the model that contain the typed text, and SHALL offer a reference helper with a database selector limited to `PMID:`, `DOI:`, and `GO_REF:` plus an accession field that suggests accessions already used in the model for the selected database. Saving the helper with an empty accession SHALL do nothing; Enter SHALL save.

#### Scenario: Compose a reference with the helper
- **WHEN** the curator opens the reference helper, selects `GO_REF:`, types `0000024`, and confirms
- **THEN** the Reference field is set to `GO_REF:0000024`

#### Scenario: Empty accession is ignored
- **WHEN** the curator confirms the reference helper with an empty accession
- **THEN** the Reference field is unchanged and the helper stays open

### Requirement: PubMed article preview
When the reference helper has `PMID:` selected and the accession is at least 4 characters, the system SHALL look up the article after a short pause and show its title (linked to PubMed), authors, and publication date.

#### Scenario: PMID preview appears
- **WHEN** the curator selects `PMID:` and types a valid PubMed id in the reference helper
- **THEN** the helper shows the article title as a link to PubMed, followed by the authors and the date

### Requirement: With/from entry
The system SHALL let the curator type a with/from value directly, suggesting values already used in the model, and SHALL offer a with/from helper that edits the value as groups (separated by ",") of entities (separated by "|"). Each entity SHALL have a database selector listing "None" first and then the allowed with/from namespaces sorted case-insensitively, and an accession field suggesting accessions used in the model for that database.

#### Scenario: Compose a grouped with/from value
- **WHEN** the curator builds one group with `UniProtKB` / `P12345` and `SGD` / `S000001` and a second group with `GO` / `0008150`, then clicks "Ok"
- **THEN** the With/From field is set to `UniProtKB:P12345|SGD:S000001,GO:0008150`

#### Scenario: Incomplete entities are dropped
- **WHEN** the curator clicks "Ok" with an entity whose database is "None" or whose accession is blank
- **THEN** that entity is omitted from the composed value

#### Scenario: Cancel discards helper edits
- **WHEN** the curator edits entities in the with/from helper and clicks "Cancel"
- **THEN** the With/From field keeps its previous value

### Requirement: Allowed databases
The system SHALL allow only `PMID`, `DOI`, and `GO_REF` as reference databases, and only these with/from namespaces: AGI_LocusCode, dictyBase, CGD, EcoCyc, Ensembl, FB, GO, MGI, PomBase, PR, RGD, RNAcentral, SGD, TAIR, UniProtKB, WB, Xenbase, ZFIN, CHEBI, ComplexPortal, EC, InterPro, PANTHER, RHEA.

#### Scenario: Allowed with/from namespace
- **WHEN** a with/from value uses the `TAIR` or `SGD` prefix
- **THEN** the namespace is accepted

#### Scenario: Namespace outside the list
- **WHEN** a with/from value uses the `NCBIGene` prefix
- **THEN** the namespace is rejected by with/from validation

### Requirement: Allowed databases dialogs
The system SHALL show an info icon above the Reference column (tooltip "Allowed Reference DBs") and above the With/From column (tooltip "Allowed With/From DBs") in both the activity form and the activity table. Clicking one SHALL open a dialog titled "Allowed Reference Databases" or "Allowed With/From Databases" that reads "The following database prefixes are allowed:", lists the prefixes sorted case-insensitively, and has a "Close" button.

#### Scenario: View allowed with/from databases
- **WHEN** the curator clicks the info icon above the With/From column
- **THEN** a dialog titled "Allowed With/From Databases" lists the allowed namespaces with `dictyBase` sorted among the D entries, and "Close" dismisses it

### Requirement: With/from validation rule
The system SHALL validate a with/from value by splitting it on "," and "|", ignoring blank entries, and checking each entry in order against the `DATABASE:accession` format and the allowed with/from namespaces (prefix compared case-insensitively). It SHALL report only the first failing entry. An empty value SHALL be valid.

#### Scenario: Disallowed prefix
- **WHEN** the with/from value is `NCBIGene:7157`
- **THEN** the error is `Invalid database prefix: "NCBIGene" is not part of allowed entities`

#### Scenario: Only the offending entity is reported
- **WHEN** the with/from value is `GO:0008150|NCBIGene:7157`
- **THEN** the error names `NCBIGene` and the `GO` entity is accepted

#### Scenario: Missing colon
- **WHEN** the with/from value is `P12345`
- **THEN** the error is `Invalid format: "P12345" - expected format is "DATABASE:accession"`

#### Scenario: Prefix case is ignored
- **WHEN** the with/from value is `uniprotkb:P12345`
- **THEN** no error is reported

#### Scenario: Empty value
- **WHEN** the with/from value is empty
- **THEN** no error is reported

### Requirement: With/from validation messages
The with/from validation rule SHALL use exactly these messages: `Invalid format: "<entry>" - expected format is "DATABASE:accession"` when an entry has no colon, `Invalid format: "<entry>" - accession cannot be empty` when nothing follows the colon, and `Invalid database prefix: "<prefix>" is not part of allowed entities` when the prefix is not an allowed namespace.

#### Scenario: Empty accession
- **WHEN** the with/from value is `UniProtKB:`
- **THEN** the error is `Invalid format: "UniProtKB:" - accession cannot be empty`

### Requirement: Evidence required in the activity form
In the activity form, the system SHALL require at least one evidence on every statement whose target has a term, except statements whose target is exempt from the evidence requirement (such as the enabler), reporting `<target label> requires at least one evidence`.

#### Scenario: Statement without evidence
- **WHEN** a curator fills a Biological Process term in the activity form and removes all of its evidence
- **THEN** the form reports `Biological Process requires at least one evidence` (using that row's label) and Save is disabled

### Requirement: Reference validation in the activity form
For every evidence present on a statement whose target has a term, including the molecular function's enabled-by evidence, the system SHALL report `You provided an evidence for "<target label>" but no reference: on evidence(<n>)` when an evidence code is set without a reference, and `Use DB:accession format for reference "<target label>" on evidence(<n>)` when the reference's prefix is not exactly `PMID`, `DOI`, or `GO_REF`. `<n>` is the evidence's 1-based position.

#### Scenario: Evidence code without reference
- **WHEN** the second evidence on the Molecular Function row has an evidence code and no reference
- **THEN** the form reports `You provided an evidence for "Molecular Function" but no reference: on evidence(2)` (using that row's label)

#### Scenario: Reference with an unsupported prefix
- **WHEN** an evidence reference is `PMC:12345`
- **THEN** the form reports `Use DB:accession format for reference "<target label>" on evidence(<n>)`

### Requirement: With/from validation in the activity form
For every evidence with a with/from value on a statement whose target has a term, including the molecular function's enabled-by evidence, the activity form SHALL report `With/from for "<target label>" on evidence(<n>): <with/from validation error>` when the with/from validation rule fails.

#### Scenario: Disallowed with/from on the first row
- **WHEN** the molecular function's first evidence has with/from `NCBIGene:7157`
- **THEN** the form reports `With/from for "Molecular Function" on evidence(1): Invalid database prefix: "NCBIGene" is not part of allowed entities` (using that row's label)

### Requirement: Activity form error display
The activity form SHALL re-validate on every change, SHALL disable Save while any validation error exists, and SHALL then show a link reading `Why is the "Save" button disabled?` that opens a "Validation Errors" dialog listing every error message, with a "Close" button.

#### Scenario: Explain disabled Save
- **WHEN** the activity form has a validation error and the curator clicks `Why is the "Save" button disabled?`
- **THEN** a "Validation Errors" dialog lists each error message and Save stays disabled until the errors are fixed

### Requirement: Inline with/from validation
When a curator edits a with/from value directly in the activity table, the system SHALL run the with/from validation rule before saving; on failure it SHALL show the error message as an error notification and SHALL NOT save the value.

#### Scenario: Inline save rejected
- **WHEN** the curator edits an evidence's With cell in the activity table to `NCBIGene:7157` and saves
- **THEN** an error notification shows `Invalid database prefix: "NCBIGene" is not part of allowed entities` and the stored value is unchanged

### Requirement: Evidence display in the activity table
The activity table SHALL show each evidence as Evidence (code label followed by its ECO id in parentheses), Reference, and With cells, showing "—" for an empty value, and SHALL show "no evidence present." for an evidence-bearing row with no evidence, except in chemical activities.

#### Scenario: Row without evidence
- **WHEN** a molecular function statement in an activity unit has no evidence
- **THEN** its evidence area reads "no evidence present."

### Requirement: Inline evidence editing in the activity table
For a logged-in curator, the activity table SHALL allow editing an evidence's code, reference, or with/from in place, saving the change to the model immediately on confirm. When not logged in, the evidence cells SHALL be read-only.

#### Scenario: Edit a reference in place
- **WHEN** a logged-in curator edits an evidence's Reference cell to `PMID:999` and confirms
- **THEN** the model is updated with the new reference and the cell shows `PMID:999`

#### Scenario: Logged-out curator
- **WHEN** no curator is logged in
- **THEN** the evidence cells offer no edit, delete, or clear actions

### Requirement: Remove evidence and clear fields in the activity table
The activity table SHALL ask for confirmation before removing an evidence (title "Remove Evidence", message "Are you sure you want to remove this evidence (<code label>)? This cannot be undone.", button "Remove") and before clearing a Reference or With value (title "Clear Reference" or "Clear With", message "Clear the Reference|With value (<value>)? This cannot be undone.", button "Clear").

#### Scenario: Clear a with/from value
- **WHEN** the curator clears the With cell holding `UniProtKB:P12345`
- **THEN** a "Clear With" dialog asks "Clear the With value (UniProtKB:P12345)? This cannot be undone." and the value is removed only after "Clear"

### Requirement: Evidence dialog from the activity table
The activity table row menu SHALL offer "Add Evidence" on any row with a statement. It SHALL open an evidence dialog titled "Edit Evidence" when the statement already has evidence (pre-loaded with every existing evidence) or "Add Evidence" otherwise. On Save the system SHALL add, change, and remove evidence on the statement to match the dialog, ignoring rows whose fields are all empty.

#### Scenario: Edit existing evidence
- **WHEN** the curator chooses "Add Evidence" on a row with two evidences, deletes one row, and saves
- **THEN** the dialog was titled "Edit Evidence", showed both evidences, and the model keeps only the remaining evidence

### Requirement: Evidence dialog row menu
Each evidence row in the evidence dialog SHALL have a single ⋮ menu with, in order: "ISS", "ISO", "IC" (only when ISS-style evidence is allowed), "Clear Values", and "Delete". "Clear Values" SHALL empty the row's evidence code, reference, and with/from. "Delete" SHALL be disabled while only one row remains. The Evidence section header SHALL have no action buttons.

#### Scenario: Clear a row
- **WHEN** the curator chooses "Clear Values" on a filled evidence row
- **THEN** that row's evidence code, reference, and with/from become empty and other rows are unchanged

#### Scenario: Last row cannot be deleted
- **WHEN** the evidence dialog has exactly one row
- **THEN** that row's "Delete" item is disabled

### Requirement: ISS, ISO, and IC quick-fill values
Choosing ISS, ISO, or IC SHALL fill evidence with: ISS → ECO:0000250 "sequence similarity evidence used in manual assertion" and `GO_REF:0000024`; ISO → ECO:0000266 "sequence orthology evidence used in manual assertion" and `GO_REF:0000024`; IC → ECO:0000305 "curator inference used in manual assertion" and `GO_REF:0000036`; with/from SHALL be left empty.

#### Scenario: ISS replaces the current dialog row
- **WHEN** the curator chooses "ISS" on the second evidence row of the evidence dialog
- **THEN** that row becomes ECO:0000250 with reference `GO_REF:0000024` and empty with/from, and no new row is added

### Requirement: ISS availability
The system SHALL offer ISS, ISO, and IC only for rows whose term has a GO aspect (molecular function, biological process, or cellular component) and only when the activity is not a chemical activity.

#### Scenario: Chemical activity hides ISS
- **WHEN** the curator opens an evidence menu on a row of a chemical activity, or on a row without a GO aspect
- **THEN** "ISS", "ISO", and "IC" are not offered

### Requirement: Adding and deleting evidence rows in the evidence dialog
The evidence dialog SHALL always start with at least one row and SHALL show a button below the rows labelled "Add evidence" when there are no rows and "Add another evidence" otherwise, which appends a blank row. Deleting a row that has any value SHALL first ask "Remove this evidence row? You'll lose what you've typed." (title "Remove Evidence", button "Remove"); an empty row SHALL be removed at once.

#### Scenario: Append a row
- **WHEN** the curator clicks "Add another evidence"
- **THEN** a blank evidence row is appended

#### Scenario: Delete a filled row
- **WHEN** the curator chooses "Delete" on a row that has a reference
- **THEN** the "Remove Evidence" confirmation appears and the row is removed only after "Remove"

### Requirement: Evidence dialog access when logged out
When no curator is logged in, the evidence dialog SHALL hide Save and label its dismiss button "Close" instead of "Cancel".

#### Scenario: Logged-out dialog
- **WHEN** a logged-out user opens an evidence dialog
- **THEN** there is no Save button and the footer button reads "Close"

### Requirement: Activity form evidence submenu
In the activity form, each row with a statement SHALL have an "Evidence" submenu in its ⋮ menu offering "Add Evidence", then "ISS", "ISO", "IC" (when ISS-style evidence is allowed), then "Remove Evidence" when the statement has evidence. ISS, ISO, and IC SHALL replace all of that statement's evidence with a single quick-filled evidence. "Remove Evidence" SHALL remove the last evidence after confirming "Remove the last evidence from this relation?".

#### Scenario: ISO in the activity form
- **WHEN** a statement in the activity form has two evidences and the curator chooses Evidence → "ISO"
- **THEN** the statement has exactly one evidence: ECO:0000266 with reference `GO_REF:0000024`

### Requirement: External link-outs
The system SHALL link identifiers to external pages that open in a new tab: ECO ids to the Evidence Ontology term page; `PMID:` to `https://www.ncbi.nlm.nih.gov/pubmed/<accession>`; `GO_REF:` to `https://geneontology.org/GO_REF/<accession>`; gene-product and complex prefixes (including UniProtKB, MGI, SGD, FB, RGD, ZFIN, WB, PomBase, Xenbase, TAIR, AGI_LocusCode, dictyBase, ComplexPortal, PR, RNAcentral) to `https://amigo.geneontology.org/amigo/gene_product/<CURIE>`.

#### Scenario: Gene product link
- **WHEN** the activity table shows the enabler `UniProtKB:P12345`
- **THEN** its id links to `https://amigo.geneontology.org/amigo/gene_product/UniProtKB:P12345`

#### Scenario: GO_REF link
- **WHEN** an evidence reference is `GO_REF:0000024`
- **THEN** it links to `https://geneontology.org/GO_REF/0000024`

#### Scenario: PMID link
- **WHEN** an evidence reference is `PMID:12345`
- **THEN** it links to `https://www.ncbi.nlm.nih.gov/pubmed/12345`

### Requirement: Other link-out prefixes
For any other prefix, the system SHALL link to that database's page from the GO database cross-reference registry (for example GO terms to the AmiGO term page and CHEBI ids to the EBI ChEBI page). When the prefix is unknown or the id is malformed, the system SHALL show the id as plain text with no link.

#### Scenario: GO term link
- **WHEN** the activity table shows the term `GO:0003674`
- **THEN** its id links to the AmiGO term page for `GO:0003674`

#### Scenario: Unknown prefix
- **WHEN** an identifier has a prefix with no known link target
- **THEN** it is shown as plain text without a link

### Requirement: Where link-outs appear
The system SHALL apply the link-out rules to the term id shown in each activity table row, the ECO id of each evidence code, each source in an evidence reference, and the id shown on each term search result.

#### Scenario: Evidence code link
- **WHEN** an evidence in the activity table has code ECO:0000314
- **THEN** the id in parentheses links to the Evidence Ontology page for ECO:0000314
