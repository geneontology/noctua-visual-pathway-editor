## ADDED Requirements

### Requirement: Long enabler labels in the activity box header
The activity box header SHALL wrap the enabler label onto a second line when it does not fit on one, and SHALL truncate with an ellipsis only text that does not fit in two lines. The box width SHALL NOT change.

#### Scenario: Long gene product name
- **WHEN** an activity is enabled by a gene product whose label is too long for one header line but fits in two
- **THEN** the activity box header shows the full label across two lines with no ellipsis

#### Scenario: Very long name
- **WHEN** the enabler label does not fit in two header lines
- **THEN** the header shows two lines and ends the second with an ellipsis

#### Scenario: Short name unchanged
- **WHEN** the enabler label fits on one line
- **THEN** the header shows it on one line as before
