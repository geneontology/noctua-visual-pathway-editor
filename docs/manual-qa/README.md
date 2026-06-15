# Manual UI Testing — Noctua Visual Pathway Editor

These checklists let you (the tester) confirm the editor works the way it should —
by **creating and editing** pathway pieces yourself and checking that the screen
behaves as described. No coding needed. You click, you type, you tick boxes.

---

## Before you start

- Open the editor in your browser with a model you are allowed to edit. A
  practice / scratch model is perfect — you will be adding and deleting things.
- Each checklist is one short session (about 5–15 minutes). You can run them in
  any order, but the numbered order flows best (later files build on skills from
  earlier ones).
- Use a reasonably wide screen if you can — some controls sit side by side.

## How to use a checklist

- Each test is labelled like **TC 1.3** (Test Case 1.3). Do the steps in order.
- Every line starts with a checkbox. Do what it says, then look at the screen:
  - If the screen matches the line, tick the box. ✅
  - If it does **not** match, leave it unticked and write what you saw in **Notes**.
- At the end of each test, mark **Pass** or **Fail**.
- **If something fails, that is useful — not a problem.** Just note *what you
  expected* vs *what actually happened*, and take a screenshot. That screenshot
  plus the TC number is the most helpful thing you can hand to the developers.
- You do **not** need to understand *why* something failed. Just report it.

## The screen at a glance

- **Left palette** — the shapes you drag onto the canvas to start something new:
  **ACTIVITY UNIT**, **PROTEIN COMPLEX**, **CHEMICAL**.
- **Canvas (center)** — the big area where your activities and the arrows between
  them appear.
- **Top bar (model toolbar)** — shows the model **Title**, a coloured **state**
  tag, a comment icon, a copy icon, and an **error count** if there are problems.
- **Layout bar** — Auto Layout button, Detail / Spacing menus, zoom buttons.
- **Right drawer** — slides in from the right to show an activity's details in a
  table, the comments panel, or the model's list of errors.

## Words you will see (plain-English glossary)

| Term | What it means |
| --- | --- |
| **Activity** | One biological "thing happening" — usually a gene product doing a molecular function. |
| **Gene Product (GP)** | The protein / gene doing the work. |
| **Molecular Function (MF)** | *What* the gene product does (e.g. "kinase activity"). |
| **Biological Process (BP)** | The bigger process the function is part of. |
| **Cellular Component (CC)** | *Where* in the cell it happens. |
| **Evidence** | The proof for a statement: an **evidence code**, a **reference** (a paper, written `PMID:12345`), and optionally a **with/from**. |
| **Reference** | A pointer to a source, written as `DB:accession` — e.g. `PMID:12345`, `DOI:10.1/x`, `GO_REF:0000024`. |
| **Chemical / Molecule** | A small molecule — a substrate, product, or regulator of an activity. |
| **Protein Complex** | Several gene products acting together as one unit. |
| **Connector / Causal relation** | The arrow between two activities saying how one affects the other. |
| **Term** | An official Gene Ontology entry you pick from a type-ahead search box. |
| **Context** | Extra detail added to a row — a BP, CC, input, etc. — via the row's **Add Context** menu. |

## A few habits that make testing easier

- **The three-dots menu (⋮)** at the right end of a row is where most row actions
  live (Add Context, Evidence, Remove). On the protein-complex's complex row it is
  a **＋** button instead.
- **"Why is the Save button disabled?"** — when Save is greyed out, a yellow link
  with this text appears. Click it any time to see the exact reason. You will use
  this a lot.
- When a type-ahead box shows a dropdown, you must **click a suggestion** — typing
  text alone does not pick a term.

## Checklist index

1. `01-create-activity-unit.md` — the standard activity (gene product + function),
   adding context, and every way Save gets blocked.
2. `02-create-chemical.md` — the Chemical form and its restrictions.
3. `03-create-protein-complex.md` — the Protein Complex form and its subunits.
4. `04-evidence.md` — adding/editing evidence anywhere in a form (codes, references,
   with/from, ISS/ISO/IC shortcuts, cloning).
5. `05-autocomplete.md` — the term-search behavior in every "pick a term" box.
6. `06-search-annotations.md` — the Search Annotations picker.
7. `07-connect-activities.md` — drawing and editing the arrows between activities.
8. `08-edit-duplicate-delete.md` — editing, duplicating, and deleting activities.
9. `09-comments.md` — model-level comments and the comment count.
10. `10-model-title-and-state.md` — naming the model and changing its state.
11. `11-graph-visualization.md` — how the canvas draws things + layout/zoom controls.
12. `12-model-errors.md` — the error count and the Validation Errors panel.

When you finish, fill in `00-results-sheet.md` to summarize Pass / Fail per checklist
and list the top problems to report.
