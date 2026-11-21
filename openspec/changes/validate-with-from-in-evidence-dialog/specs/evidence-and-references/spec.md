# Spec Delta

## ADDED Requirements

### Requirement: Evidence dialog with/from validation
When the curator clicks Save in the evidence dialog, the system SHALL run the with/from validation rule on each evidence row's with/from value. On the first failure it SHALL show that error message as an error notification, keep the dialog open with all entered values, and SHALL NOT save anything to the model.

#### Scenario: Disallowed namespace in the evidence dialog
- **WHEN** the curator opens "Add Evidence" from an activity table row, enters an evidence code, reference `PMID:12345`, and with/from `NCBIGene:7157`, then clicks "Save"
- **THEN** an error notification shows `Invalid database prefix: "NCBIGene" is not part of allowed entities`, the dialog stays open with the entered values, and the model is unchanged

#### Scenario: Allowed namespaces save normally
- **WHEN** the curator saves the evidence dialog with with/from `SGD:S000001|TAIR:AT1G01010`
- **THEN** no error is shown and the evidence is saved

#### Scenario: Empty with/from
- **WHEN** the curator saves the evidence dialog with an empty with/from value
- **THEN** no with/from error is shown
