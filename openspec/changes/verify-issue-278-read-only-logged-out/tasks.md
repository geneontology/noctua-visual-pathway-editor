# Tasks

## 1. Logged out (#278)

- [ ] 1.1 Run `npm run dev`. Open `http://localhost:4208/?model_id=<model id>` in a private window (no remembered `barista_token`). Verify the top toolbar shows a green `Login` button and an amber notice above the graph toolbar reads `Not Logged In: You can only view existing annotations. Log in to edit.` with a warning icon.
- [ ] 1.2 Verify no `Toolbox` palette is shown left of the canvas. Hover a node; verify it highlights and shows only an info (view) icon, with no pencil or trash icon. Click the info icon; verify the activity opens in the right drawer.
- [ ] 1.3 Drag from the edge of one node to another node; verify no relation line is created and no relation form opens. Drag a node by its body; verify it moves (position only).
- [ ] 1.4 Right-click a node; verify the menu offers only `View activity` and `Comments`. Right-click empty canvas; verify the menu shows `Log in to edit`. Shift-select two nodes; verify the selection bar shows the count but no `Copy` or `Delete`. With them selected press Delete, Ctrl+C and Ctrl+S; verify nothing is deleted, no copy toast appears, and the browser save dialog does not open.
- [ ] 1.5 Click an existing relation line; verify the relation form opens showing the relation with no `Delete`, `Cancel` or `Save` buttons and no `Chemical Intermediate` option.
- [ ] 1.6 In the model toolbar verify the title has no pen icon, clicking the state chip does nothing and it shows no pen, and there is no copy-model button. Click the comments button; verify the Comments panel opens with no edit pens.
- [ ] 1.7 In the right drawer's activity table verify there is no ellipsis menu with `Delete Activity`, no row menus or `+` buttons, and clicking a term or evidence cell opens no editor. Verify comment icons appear only on rows that already have comments; click one and verify the dialog has a `Close` button and no `Save` or `Add Comment`, with read-only text.
- [ ] 1.8 Open a model with no activities; verify the canvas reads `This model is empty` and `Log in to start adding activities.`

## 2. Logged in (unchanged behavior)

- [ ] 2.1 Open `http://localhost:4208/?model_id=<model id>&barista_token=<token>`. Verify the amber notice is gone, the toolbar shows your name and group, and the `Toolbox` palette is visible.
- [ ] 2.2 Hover a node; verify the pencil and trash icons appear and no info icon. Drag a relation between two activities; verify the relation form opens with `Save`, then close it.
- [ ] 2.3 Open an annotation dialog from the activity table; verify `Cancel` and `Save` are present. Click the title pen and the state chip; verify `Edit Title` and `Change State` open with `Save`.
- [ ] 2.4 Select a node, press Ctrl+C, then right-click empty canvas; verify the menu offers `Paste ...`.

## 3. Pre-#278 e2e specs

- [ ] 3.1 Run `npx playwright test e2e/edit-form.spec.ts e2e/stencil-palette.spec.ts e2e/fixture-smoke.spec.ts`. Expected: `edit-form.spec.ts` fails because it opens the title/comments/state dialogs logged out and expects `Save`/`Add`/`Cancel`; `stencil-palette.spec.ts` and `fixture-smoke.spec.ts` fail on the `stencil-palette` test id, which no component renders. Report the result to the user and wait for a go-ahead before changing any spec (options: log those specs in with a mocked `barista_token`, or assert the logged-out absence instead).
