# Tasks

## 1. Setup

- [ ] 1.1 Run `npm run dev` and open `http://localhost:4208/?model_id=<editable model id>&barista_token=<token>`; verify the graph loads and the toolbar shows the logged-in user.

## 2. Individual (term) comments

- [ ] 2.1 Click an activity node to open its Activity table. In a GO term's cell, verify a grey comment icon is visible without hovering. Click it; verify a dialog titled `Individual Comments` opens, headed by the term's label, showing `No comments yet` and an `Add Comment` button.
- [ ] 2.2 Click `Add Comment`, open the `Category` picker; verify the options are exactly `Ontology term pending`, `Ontology term annotation dispute`, `General`. Pick `General`; verify a `Comment` text field appears. Type `QA term comment` and click `Save`; verify the dialog closes and the term's icon turns green with count `1`.
- [ ] 2.3 Reopen the term's comment dialog; verify the row shows category `General` and text `QA term comment`. Click `Add Another Comment`, pick `Ontology term pending`, type `QA pending`, and save; verify the icon count becomes `2`.
- [ ] 2.4 Reload the page. Verify the term's icon still shows `2` and the dialog shows both comments in the order added.

## 3. Reference comments

- [ ] 3.1 In the same Activity table, find an evidence row. Click the comment icon in its Reference cell; verify a dialog titled `Reference Comments` opens, headed by the reference.
- [ ] 3.2 Open the `Category` picker; verify the options are exactly `Figure/Table`, `Evidence confidence`, `Justification for evidence`, `Evidence dispute`, `General`. Pick `Figure/Table`, type `Fig 3B`, and save; verify the Reference cell icon turns green with count `1`.
- [ ] 3.3 Reload the page; verify the reference comment is still there with category `Figure/Table`.

## 4. Comments panel and graph

- [ ] 4.1 Verify the activity's graph node shows the comment count `3` beside its grey comment icon, and the toolbar comment button shows the model total including these three.
- [ ] 4.2 Click the toolbar comment button. In the Comments panel, verify the activity's section lists the term as `label (id)` with a `GENERAL` badge on `QA term comment` and an `ONTOLOGY TERM PENDING` badge on `QA pending`, and the reference as `relation → object · code · reference` with a `FIGURE/TABLE` badge on `Fig 3B`.
- [ ] 4.3 Click `QA term comment` in the panel; verify the activity is highlighted on the graph, its panel section is highlighted, and the panel stays on Comments.
- [ ] 4.4 Click the pen (`Edit comments`) beside the reference in the panel; verify a `Relation Comments` dialog opens with `Fig 3B`. Close it with `Cancel`; verify nothing changed.

## 5. Logged-out view

- [ ] 5.1 In a private window, open the same model URL without `barista_token`. Verify term and reference cells with comments show green icons, cells without comments show no icon, and opening a comment dialog shows the comments read-only with only a `Close` button.

## 6. Removal

- [ ] 6.1 Back in the logged-in window, open the term's comment dialog and click the trash icon on `QA pending`; verify a `Remove Comment` dialog asks `Remove this comment? This cannot be undone.` Click `Remove`, then `Save`; verify the icon count drops to `1`.
- [ ] 6.2 Remove the remaining term comment and the reference comment the same way and save each; reload and verify both cells show grey icons with no count and the panel no longer lists the activity.
