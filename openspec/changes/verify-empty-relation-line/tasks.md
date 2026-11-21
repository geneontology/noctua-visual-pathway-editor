# Tasks

## 1. Browser check

Log in, open a model with at least two activity units (A and B) that are not connected, and a third pair (C and D) that already has a saved relation.

- [ ] 1.1 Drag a connection from A to B, then click Cancel in the relation dialog. Expect: the dialog closes and no line remains between A and B.
- [ ] 1.2 Drag from A to B again. Expect: the relation dialog opens again; the "Activities Already Connected" dialog does not appear. Close it with the dialog's close control (X) and expect no line again.
- [ ] 1.3 Drag from A to B, keep the defaults (Regulation, Positive, Direct) and click Save. Expect: "Causal relation successfully created.", the dialog closes, and exactly one green line labelled "directly positively regulates" appears from A to B.
- [ ] 1.4 Drag from C to D (and then from D to C). Expect: each time no new line is added and "Activities Already Connected" appears with the duplicate-connection message; OK closes it.
- [ ] 1.5 Reload the page. Expect: the A to B line from 1.3 is still there; no line from the cancelled draws in 1.1 and 1.2 exists.
