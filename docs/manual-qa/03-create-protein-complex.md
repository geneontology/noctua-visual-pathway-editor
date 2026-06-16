# 03 — Create a Protein Complex

**What this proves:** the Protein Complex form shows the molecular function, lets
you build the complex from gene-product subunits via **has part**, restricts the
complex term to GO complex terms, and does not offer nonsensical "complex inside a
complex" options.

> A protein complex is several gene products acting together as one unit. The form
> shows a warning that it should be used **rarely** — only when the activity cannot
> be pinned to a single subunit.

---

## TC 3.1 — Open the Protein Complex form

1. [ ] In the **left palette**, drag the **PROTEIN COMPLEX** shape onto the canvas.
2. [ ] A dialog opens with the title **"Protein Complex Form"**.
3. [ ] An **amber / yellow note** is shown near the top, reading roughly:
       *"Note that this should be used rarely, and only in the case where the
       activity cannot be ascribed to a single subunit of a complex."*
4. [ ] The **Molecular Function** row is **visible and editable** (it is the first row).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 3.2 — The complex term accepts GO complex terms

1. [ ] Fill the **Molecular Function** (type, click a suggestion).
2. [ ] Find the **Protein Complex** row (in the **Gene Product** section).
3. [ ] Click its term box and type a complex name (for example `proteasome` or
       `ribosome`). The suggestions are **GO complex terms**.
4. [ ] Pick a complex term — the row fills in with the complex name.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 3.3 — Add gene-product subunits with "has part"

1. [ ] On the **Protein Complex** row, the menu button is a **＋** (plus) button
       (not the usual three-dots), and it offers **has part** → Gene Product.
2. [ ] Click it — a **Gene Product** subunit row appears, nested under the complex.
3. [ ] Fill the subunit's term (a gene/protein name, click a suggestion).
4. [ ] Add a **second** subunit the same way → two gene-product rows under the complex.
5. [ ] Each subunit row has a **remove** option (trash / X) to delete just that subunit.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 3.4 — No "complex inside a complex" (recursion is blocked)

1. [ ] On one of the gene-product **subunit** rows, open its menu → **Add Context**.
2. [ ] The submenu must **not** offer **part of → Protein Complex** (you cannot nest
       a protein complex inside a complex's own subunit).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 3.5 — Add function context and save

1. [ ] On the **Molecular Function** row, use **⋮ → Add Context** to add **part of**
       (Biological Process) and/or **occurs in** (Cellular Component), and fill each
       with a term **and** one evidence (`PMID:12345`).
2. [ ] When everything required is filled, **Save** becomes active.
3. [ ] Click **Save** — a complex activity appears on the canvas showing the complex
       and listing its subunits.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
