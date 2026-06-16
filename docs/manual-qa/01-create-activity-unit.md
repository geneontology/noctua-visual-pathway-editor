# 01 — Create an Activity Unit

**What this proves:** you can create a standard activity (a gene product doing a
molecular function), add extra context to it, and that the **Save** button stays
disabled until everything required is present and correctly formatted.

> New to the editor? Read the `README.md` glossary first (Gene Product, Molecular
> Function, Evidence, etc.).

---

## TC 1.1 — Open the Activity Unit form

1. [ ] In the **left palette**, find the **ACTIVITY UNIT** shape.
2. [ ] **Drag** it onto the white canvas area and release the mouse.
3. [ ] A dialog opens with the title **"Activity Unit Form"**.
4. [ ] The form shows two sections: **Gene Product** and **Function Description**.
5. [ ] The **Save** button (bottom-right) is **greyed out** — nothing is filled in yet.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 1.2 — Create the simplest valid activity (function + gene product only)

*Setup: Activity Unit Form open from TC 1.1.*

1. [ ] In **Function Description**, click the **Molecular Function** term box and type
       part of a function name (for example `kinase`). A dropdown of matching terms appears.
2. [ ] **Click one of the suggestions.** The chosen term name now fills the box.
3. [ ] In the **Gene Product** section, click the term box, type a gene/protein name
       (for example `BRCA1`), and click a suggestion.
4. [ ] With both filled in, the **Save** button is now **active** (no longer greyed out).
5. [ ] Click **Save**. The dialog closes and a **new activity appears on the canvas**
       showing your gene product and its function.

> A basic activity does **not** need evidence on the gene product or the function —
> Save should work with just these two filled in.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 1.3 — Save is blocked when a required field is empty

*Setup: drag a fresh **ACTIVITY UNIT** onto the canvas to open a new blank form.*

1. [ ] Fill in the **Molecular Function** only. Leave the **Gene Product** empty.
2. [ ] The **Save** button stays **greyed out**.
3. [ ] A yellow link appears: **"Why is the Save button disabled?"** — click it.
4. [ ] A popup lists the reason, mentioning the missing required item (wording
       includes **"is required"**).
5. [ ] Close the popup, fill in the **Gene Product**, and confirm **Save** becomes active.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 1.4 — Add context: Biological Process and Cellular Component

*Setup: an Activity Unit form with Molecular Function + Gene Product filled in
(continue from TC 1.2 before saving, or re-open the activity to edit it).*

1. [ ] On the **Molecular Function** row, click the **⋮** (three-dots) menu at the
       right end of the row.
2. [ ] Choose **Add Context**. A submenu lists options such as **part of**
       (Biological Process), **occurs in** (Cellular Component), **has input**,
       and **happens during**.
3. [ ] Click **part of** — a new **Biological Process** row appears, indented under
       the function.
4. [ ] Fill its term box (type a process name and click a suggestion).
5. [ ] Open **Add Context** again and add **occurs in** (Cellular Component); fill its term.
6. [ ] Each new row shows empty **Reference** and **With** columns to its right.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 1.5 — A filled context row requires evidence before Save

*Setup: continue from TC 1.4 — you added a Biological Process with a term but no evidence.*

1. [ ] The **Save** button is **greyed out**.
2. [ ] Click **"Why is the Save button disabled?"** — the popup says the process
       **"requires at least one evidence"**.
3. [ ] On the Biological Process row, open the **⋮** menu → **Evidence** →
       **Add evidence**. A blank evidence appears.
4. [ ] Fill the **evidence code** box (type, then click a suggestion).
5. [ ] In the **Reference** box, enter a properly formatted reference: `PMID:12345`.
6. [ ] **Save** becomes active. Click **Save** — the activity saves with the added context.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 1.6 — A reference must be in `DB:accession` format

*Setup: any context row that has a term **and** an evidence code filled in.*

1. [ ] In the **Reference** box, type a bare number like `12345` (no prefix).
2. [ ] **Save** stays disabled; the **"Why disabled?"** popup says to use
       **`DB:accession` format** (for example `PMID:12345`).
3. [ ] Change it to a made-up prefix like `FOO:123` → Save is **still** disabled
       (`FOO` is not an allowed database).
4. [ ] Correct it to one of the allowed forms — `PMID:12345`, `DOI:10.1/x`, or
       `GO_REF:0000024` → **Save** becomes active.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 1.7 — An evidence code with no reference blocks Save

*Setup: a context row with a term filled in.*

1. [ ] Add an evidence and fill the **evidence code**, but leave the **Reference** empty.
2. [ ] **Save** is disabled; the popup mentions you provided an evidence **but no reference**.
3. [ ] Add a valid reference (`PMID:12345`) → **Save** becomes active.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 1.8 — Clear the form

*Setup: a partly-filled Activity Unit form.*

1. [ ] Click **Clear** (bottom-right, next to Save).
2. [ ] The form resets to an empty starting state (your typed terms are removed).
3. [ ] Close the dialog. Anything you did **not** Save is **not** on the canvas.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
