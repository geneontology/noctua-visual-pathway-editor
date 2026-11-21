# Tasks

## 1. Already done

- [x] 1.1 Validation errors grouped as ShEx violations, orphaned nodes, and orphaned edges, with a total used by the toolbar chip
- [x] 1.2 Panel labels "Data model violation errors (ShEx)", "Activity Units / Chemicals errors", "Relations errors"; orphaned nodes split into "Node not shown" and "Node/relation combination not allowed"
- [x] 1.3 Edges belonging to an activity or to an activity-to-activity connection are not counted as relation errors

## 2. Manual verification (browser, `npm run dev` on port 4208)

- [ ] 2.1 Open a model with no problems → the toolbar chip is green and reads "0 Error(s) Found"; click it → the right drawer "Validation Errors" shows 0 in all three summary cards
- [ ] 2.2 Open a model with ShEx violations → the chip is red and reads "<n> Error Found" / "<n> Errors Found"; the drawer's "Data model violation errors (ShEx)" count matches the numbered violation cards listed
- [ ] 2.3 Open a model with a chemical connected to an activity (e.g. has input) and causal links between activities → those edges do not appear under "Relations errors" and do not raise the total
- [ ] 2.4 Open a model containing a node outside any activity → it is listed under "Node not shown" if no orphaned edge touches it, or under "Node/relation combination not allowed" if one does, never in both; "Activity Units / Chemicals errors" equals the sum of the two subsections
- [ ] 2.5 Click "Close" in the drawer header → the drawer closes
