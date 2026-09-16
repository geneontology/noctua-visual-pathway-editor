# Working with Several Activities at Once

_Noctua Visual Pathway Editor — selecting, moving, copying, pasting, finding and deleting
groups of activities on the pathway canvas._

**Covers:** GitHub issue [#114](https://github.com/geneontology/noctua-visual-pathway-editor/issues/114)
and its follow-ons (branch `issue-114-group-selection`).

---

## What this adds

Until now the canvas worked on one activity at a time: click a node, edit it, delete it. You
can now put several nodes into a **selection** and act on all of them together.

| You want to…                                  | Where to go                                |
| --------------------------------------------- | ------------------------------------------ |
| Pick several nodes                            | Drag a box on empty canvas, or Shift-click |
| Pick nodes by kind or by quality              | Toolbar → **Select** menu                  |
| Find a node by gene, term, GO id or PMID      | Toolbar → **Find in model…**               |
| Pick everything up- or downstream of one node | Right-click a node → **Select**            |
| Move a group, keeping its shape               | Drag any member, or use the arrow keys     |
| Re-arrange only the group                     | Toolbar → **Auto Layout**                  |
| Copy activities into this or another model    | `Ctrl+C`, then `Ctrl+V`                    |
| Remove several activities in one go           | `Delete`, or the **Delete** button         |

Everything here needs you to be **logged in**. Logged out, you can still look at the model —
see [Read-only mode](#11-read-only-mode).

---

## 1. Making a selection

### 1.1 Drag a box around them (marquee)

1. Press the **left mouse button on empty canvas** — not on a node.
2. Drag. A blue dashed rectangle follows the pointer.
3. Release.

Every node the rectangle **touches** joins the selection — a node does not have to sit fully
inside the box. Drag in any direction; up-and-left works the same as down-and-right.

Hold **Shift** while you drag to **add** the boxed nodes to what is already selected instead of
replacing it.

A click on empty canvas with no real drag clears the selection rather than selecting nothing.

### 1.2 Add or remove one node

**Shift-click**, **Ctrl-click** or **Cmd-click** a node to toggle it: in if it was out, out if
it was in. The node does not move while you do this, and no drawer opens.

### 1.3 Select everything

Press **Ctrl+A** (**Cmd+A** on a Mac), or use **Select → Select all** in the toolbar.

### 1.4 Clear the selection

- Press **Esc**
- Click empty canvas
- Double-click empty canvas
- Click the **✕** in the selection bar
- Start dragging a node that is _not_ in the selection

### 1.5 What a selection looks like

- Selected activities, chemicals and protein complexes get a **blue outline**.
- A **relation** is drawn as selected when **both** of the activities it joins are selected. You
  do not select relations directly — they follow their endpoints.
- The activity whose details are open in the right-hand drawer has an **orange outline**. If
  that node is also part of a selection, blue wins.
- A pill appears at the right of the toolbar: **"N selected"**, with **Copy**, **Delete** and
  **✕** (clear) beside it.

A selection survives a save. After the graph redraws, any node that still exists stays
selected; anything that has gone is quietly dropped.

---

## 2. The Select menu

In the toolbar, **Select** opens a list of one-click selections.

| Item                  | What it selects                                                      |
| --------------------- | -------------------------------------------------------------------- |
| **Select all**        | Every node on the canvas (`Ctrl+A`)                                  |
| **Invert selection**  | Swaps selected for unselected                                        |
| **Activities**        | Activity units only                                                  |
| **Chemicals**         | Small-molecule nodes only                                            |
| **Protein complexes** | Complex nodes only                                                   |
| **Without evidence**  | Any activity carrying at least one statement with no evidence        |
| **With comments**     | Any activity with at least one comment — the same count as its badge |

If a filter matches nothing, a message says so (for example _"No chemicals in this model"_) and
**your existing selection is left alone**. A mis-click never empties the canvas selection.

**Invert** is the exception: it always applies, and inverting a full selection legitimately
leaves you with nothing selected.

---

## 3. Find in model

The **Find in model…** box in the toolbar searches the model you are looking at. It is not a GO
lookup — it only matches what is already on this canvas.

It looks at everything an activity carries:

- gene product and term labels (MF, BP, CC, chemicals, complexes)
- term ids — `GO:0016301`, `UniProtKB:P24941`, `CHEBI:…`
- evidence references (`PMID:…`), evidence codes and their labels, with/from values

**How to use it**

1. Type. Results appear as you type; the list shows at most 8 rows.
2. Move through the rows with **↑ / ↓**, choose with **Enter**, dismiss with **Esc**.
3. Or click a row.

**Picking one row** selects that activity and scrolls it into view.

**"Select all N matches"** — the first row whenever there is more than one hit — selects every
match and highlights them where they are, without moving the viewport. This is the quickest way
to see, say, every activity supported by one PMID.

Each row shows the activity's name, plus what matched and where (`BP: mitotic cell cycle`,
`reference: PMID:12345`). Chemicals and complexes carry a small type badge.

If there are more than 8 hits, a line at the bottom says how many more there are — **Select all**
still includes them.

When nothing matches you get **"No match in this model"**.

---

## 4. Growing a selection along the graph

Right-click a node, and under **Select** choose:

- **Downstream** — that node and everything it leads to
- **Upstream** — that node and everything leading to it
- **Connected** — the whole connected sub-graph the node belongs to, following relations in both
  directions

Each one **replaces** the current selection and always includes the node you right-clicked. A
message confirms how many activities ended up selected.

These rows are hidden once two or more nodes are already selected — they act on the single node
under the cursor, which would read as ambiguous next to rows that act on the whole selection.

---

## 5. Moving a selection

**Drag** — grab any node that is part of the selection and drag it. Every other member moves by
the same amount, so the shape of the group is preserved. Relations re-route themselves.

**Nudge** — the **arrow keys** move the whole selection 10 px per press.

Dragging a node that is **not** in the selection drops the selection and moves that node alone,
the way PowerPoint behaves.

> **Positions are yours alone.** Node layout is stored in your browser, per model — it is never
> written to the GO-CAM and other curators do not see it. Moving nodes is not an edit to the
> model and costs nothing on the server.

---

## 6. Auto Layout on a selection

**Auto Layout** in the toolbar is context-sensitive:

- With **nothing selected**, it re-arranges the whole model, as before.
- With a **selection**, it tidies only those nodes and leaves the rest of the model where it is.

Either way the resulting positions are saved to your browser, so they survive a reload.

---

## 7. Copy and paste

### 7.1 What gets copied

Copying captures the selected activities **and the relations between them** — a relation is
included only when **both** of its ends are in the selection. Relations reaching out to
activities you did not select are not copied.

Terms, evidence codes, references and with/from values are global identifiers, so they carry
over between models unchanged. The pasted activities get brand-new identifiers: nothing is
shared with the originals.

### 7.2 Copying

| From               | How                                                        |
| ------------------ | ---------------------------------------------------------- |
| Keyboard           | **Ctrl+C** / **Cmd+C** with a selection                    |
| Selection bar      | **Copy**                                                   |
| Right-click a node | **Copy** (that node), or **Copy N nodes** with a selection |

A message confirms what went to the clipboard, e.g.
_"Copied 3 activities and 2 relations — paste into this or any other model"_.

> **The clipboard lives in your browser**, not the system clipboard. That means no permission
> prompt, and it works in Firefox. It is shared across **tabs and windows of the same browser**,
> which is what makes copying between models work. It is **not** shared with a different browser,
> a different profile, or another person. Copying something new replaces what was there.

### 7.3 Pasting

Open the model you want to paste into, then either:

- press **Ctrl+V** / **Cmd+V** — the region lands where your pointer last was over the canvas, or
- **right-click empty canvas** and choose **Paste N nodes** — the region lands at the point you
  clicked.

When the clipboard is empty the right-click menu says **"Nothing to paste"** rather than offering
a paste that would fail.

### 7.4 The paste dialog

Paste does **not** open the Activity Form — the activities are written to the model directly, so
a confirmation step spells out exactly what is about to happen:

- **how many** activities and relations
- a **small preview** of the copied region, drawn in its real layout and colours
- whether it was copied **from this model or another one**, and **how long ago** (_"just now"_,
  _"4 minutes ago"_, _"2 days ago"_) — so a stale clipboard is obvious
- **Include evidence** — on by default. Turn it off to paste the structure without its evidence
  and references.

Choose **Paste** to write, or **Cancel** to back out. Everything goes to the server in a single
save, so you either get all of it or none of it.

### 7.5 Where the pasted nodes land

The region rebuilds its copied layout at the point you pasted, so relative positions are kept.
Where that cannot be worked out exactly, the new activities are laid out in a compact block at
the paste point instead — **Auto Layout** tidies them if you prefer.

The pasted activities are **selected** as soon as they appear, so you can immediately drag them
somewhere else as a group.

---

## 8. Deleting a selection

With a selection in place:

- press **Delete** or **Backspace**, or
- use **Delete** in the selection bar, or
- right-click a node and choose **Delete N nodes**

A confirmation dialog names how many activities will go. Confirm, and all of them are removed in
**one** save. Relations between deleted activities go with them.

This cannot be undone — there is no undo history in the editor.

---

## 9. Ctrl+S

**Ctrl+S** / **Cmd+S** saves the model and shows _"Model saved"_. The browser's "Save page"
dialog never opens on the canvas.

Every edit you make is already saved as you go, so this is reassurance rather than a requirement.

---

## 10. Keyboard shortcuts

Shortcuts are active on the canvas while you are logged in and no dialog or form is open. They
are ignored while you are typing in a text field, so normal typing, copying and pasting inside
forms is unaffected.

| Key                              | Action                                            |
| -------------------------------- | ------------------------------------------------- |
| `Ctrl/Cmd + A`                   | Select every node                                 |
| `Shift` / `Ctrl` / `Cmd` + click | Add or remove one node from the selection         |
| `Shift` + drag on empty canvas   | Add the boxed nodes to the selection              |
| `Esc`                            | Clear the selection                                |
| `← ↑ → ↓`                        | Nudge the selection by 10 px                      |
| `Ctrl/Cmd + C`                   | Copy the selection                                |
| `Ctrl/Cmd + V`                   | Paste the clipboard                               |
| `Delete` / `Backspace`           | Delete the selection (with confirmation)          |
| `Ctrl/Cmd + S`                   | Save the model                                    |

---

## 11. Read-only mode

Logged out, the canvas is for viewing:

- right-clicking a node offers **View activity** and **Comments** only
- right-clicking empty canvas says **"Log in to edit"**
- the selection bar shows no **Copy** or **Delete**
- keyboard shortcuts are off, and nodes cannot be nudged or dragged as a group

---

## 12. Worth knowing

- **Layout is local.** Node positions — including group moves, nudges and Auto Layout — are
  stored in your browser per model. They are not part of the GO-CAM and are not visible to other
  curators.
- **The clipboard is per browser.** Copying in Chrome and pasting in Firefox will not work; use
  two tabs or two windows of the same browser.
- **One clipboard entry.** Copying replaces whatever was there before; there is no history.
- **No undo.** Paste and delete both write to the model straight away. The paste dialog states
  what it is about to add for exactly this reason.
- **Paste position is best-effort.** Structure — which activities exist and how they are related
  — is reproduced exactly. Their arrangement on the canvas is reproduced where possible, with a
  tidy block as the fallback.
