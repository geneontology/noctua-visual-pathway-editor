# Tasks

## 1. Confirm scope

- [ ] 1.1 Confirm with the stakeholder that "allow more characters for gene names" refers to the truncated activity box header (no input has a character cap) and that two wrapped lines is acceptable; if not, update the proposal and spec before continuing

## 2. Header wrapping

- [ ] 2.1 Allow the activity box header label to wrap to two lines with an ellipsis after the second, keeping the box width; verify `npm run lint` passes on the touched file
- [ ] 2.2 Manual check: open a model containing an activity whose gene product has a long label (or create one by dragging "ACTIVITY UNIT" onto the canvas and choosing a gene product with a long name), set the layout to "Default", and verify the header shows the full name on two lines without overlapping the first line of the box
- [ ] 2.3 Manual check: verify an activity with a short gene name still shows a single header line, and that "Simple View" and "Preview" layouts render headers without overlap
