# Tasks

Setup for every group: run `npm run dev`, open `http://localhost:4208/?model_id=<scratch model>&barista_token=<token>`
in Chrome with DevTools → Network open (filter on `m3Batch`). The scratch model needs at least four
activity units, at least two relations between them, one chemical, one node with no relations, and
some statements with evidence. Use a second scratch model for the cross-model checks.

## 1. Selecting and moving nodes (#114)

- [ ] 1.1 Press the left mouse button on empty canvas and drag a box that overlaps two related activity units and the chemical (only partly covering one of them). Expect a blue dashed rectangle while dragging; on release all three nodes have a blue outline, the relation between the two units is drawn as selected, and the toolbar shows "3 selected" with Copy, Delete and ✕. Repeat dragging from bottom-right to top-left — same result.
- [ ] 1.2 Hold Shift and drag a box over a fourth node. Expect "4 selected". Shift-click one selected node, then Ctrl-click an unselected one. Expect each toggles membership, the clicked node does not move, and the right-hand drawer does not open.
- [ ] 1.3 Click empty canvas without dragging — expect the selection to clear and no rectangle to flash. Re-select, press Esc — expect it clears. Re-select, click ✕ in the selection bar — expect it clears and the bar disappears.
- [ ] 1.4 Select three nodes, drag one of them across the canvas. Expect all three to move together keeping their relative positions, with relations re-routing. Reload the page — expect the nodes where they were left. Then, with three selected, drag a node that is not selected — expect the selection to clear and only that node to move. Expect no `m3Batch` request for any of these moves.
- [ ] 1.5 Select two nodes and press each arrow key once. Expect both to move 10 units in that direction per press; reload and expect the new positions kept.
- [ ] 1.6 Double-click a node not in the selection (orange outline, drawer opens), then select three other nodes, then press Ctrl+S. After "Model saved" and the redraw, expect the same three nodes still blue and the focused node still orange. Then hover one of the selected nodes, click its delete icon and confirm "Deleting this node cannot be undone. Continue?" — after the redraw expect "2 selected".
- [ ] 1.7 Open the same model without `barista_token` (logged out). Drag a box over nodes — expect them selected and the bar to show "N selected" with only ✕. Drag one selected node — expect the others not to follow. Press Esc and an arrow key — expect nothing to happen. Right-click empty canvas — expect "Log in to edit". Right-click a node with 2+ selected — expect only "View activity".

## 2. Copying, pasting and deleting a region

- [ ] 2.1 Select three activity units that have two relations among them and at least one relation to an unselected node. Press Ctrl+C. Expect the toast "Copied 3 nodes and 2 relations — paste into this or any other model".
- [ ] 2.2 Right-click empty canvas in the same model. Expect "Paste 3 nodes". Click it (accept the group-permission prompt if shown). Expect a dialog "Paste copied nodes" asking "Paste 3 nodes and their relations?", a preview drawn in the copied layout and colours, "Include evidence" ticked, and a navy Paste button. Click Paste. Expect exactly one `m3Batch` request, the toast "Pasted 3 nodes and 2 relations", three new nodes at the right-click point in the copied arrangement, already selected, joined by the two relations, with evidence present.
- [ ] 2.3 In another tab of the same browser open the second scratch model. Move the pointer over the canvas, then press Ctrl+V. Expect the paste dialog for 3 nodes. Untick "Include evidence" and click Paste. Expect one `m3Batch` request, the nodes placed where the pointer was, both relations present, and every pasted statement and relation shown without evidence. Reload the first model — expect it unchanged by this paste.
- [ ] 2.4 Press Ctrl+V again, untick "Include evidence", click Cancel. Expect no `m3Batch` request and no new nodes. Press Ctrl+V once more — expect "Include evidence" ticked again; cancel.
- [ ] 2.5 Select the three pasted nodes and press Delete. Expect a dialog "Delete selected nodes" asking "Delete 3 nodes and their relations?", a preview of the three nodes and their relations, and "This cannot be undone.". Click Delete. Expect exactly one `m3Batch` request, the toast "Deleted 3 nodes", the nodes and their relations gone, the drawer closed and nothing selected.
- [ ] 2.6 In a model with more than 13 nodes press Ctrl+A. Expect a red chip "N selected — max 13" with Copy and Delete greyed; hovering shows "Select 13 or fewer to copy" / "Select 13 or fewer to delete" and clicking does nothing. Press Ctrl+C — expect the warning "Select 13 or fewer nodes to copy". Press Delete — expect "Select 13 or fewer nodes to delete". Right-click a node — expect "Copy N nodes" and "Delete N nodes" disabled with "Select 13 or fewer to copy or delete" beneath.

## 3. Selection tools

- [ ] 3.1 Select three nodes and click Auto Layout. Expect only those three to be rearranged and every other node to stay put. Reload — expect the new arrangement kept. Clear the selection and click Auto Layout — expect the whole graph rearranged.
- [ ] 3.2 With focus on the canvas (not in a text field) press Ctrl+S. Expect no browser "Save page" dialog, one `m3Batch` request, and the toast "Model saved".
- [ ] 3.3 Right-click a single node with nothing selected and choose Copy. Expect "Copied 1 node — paste into this or any other model". In a second, already-open window of the same browser (no reload), right-click empty canvas — expect "Paste 1 node" immediately; click it — expect the dialog to ask "Paste 1 node?"; cancel.
- [ ] 3.4 Repeat 2.1–2.3 in Firefox. Expect identical results with no clipboard permission prompt.
- [ ] 3.5 In DevTools → Application → Local Storage delete the `noctua-region-clipboard` key. Right-click empty canvas — expect a greyed "Nothing to paste". Press Ctrl+V — expect no dialog.

## Workflow follow-up

- Record any defect found as its own change; do not fix it under this one.
- Archive this change once every check passes; it declares `skip_specs`, so no main spec is updated.
