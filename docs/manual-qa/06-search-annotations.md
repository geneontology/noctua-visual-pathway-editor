# 06 — Search Annotations picker

**What this proves:** the Search Annotations picker lets you reuse an existing
annotation (a term plus its evidence) for the gene product and prefills your form —
and cancelling it never loses what you had already typed.

> Available only in the **Activity Unit** form (not the Chemical or Protein Complex
> forms), and you need a **gene product** filled in first.

---

## TC 6.1 — It needs a gene product first

1. [ ] In a new Activity Unit form with **no** gene product yet, open a row's
       **⋮** menu → **Search Annotations**.
2. [ ] A message tells you to **add a gene product first** (the picker does not open).
3. [ ] Fill in a gene product, then try again — the picker now opens.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 6.2 — Pick a term and its evidence

1. [ ] With a gene product set, open **⋮** → **Search Annotations** on a
       function / process / component row.
2. [ ] The picker lists terms already annotated for that gene product.
3. [ ] Select a term → an evidence table appears (on the right).
4. [ ] Tick one or more evidences (or use the select-all box).
5. [ ] **Done** is disabled until a term is selected; with a term selected, click **Done**.
6. [ ] Back in the form, the row is filled with the chosen term **and** all the
       evidences you ticked (not just the first one).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 6.3 — Cancel keeps your typing (no data loss)

1. [ ] Type something into the form first (e.g. a term on another row).
2. [ ] Open Search Annotations, then **Cancel** it (or press **Escape**, or click
       outside it).
3. [ ] The picker closes and the form still shows everything you had typed — nothing
       is lost.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 6.4 — The picker stacks on top of the form

1. [ ] Open Search Annotations — the form stays visible **underneath** the picker.
2. [ ] Pressing **Escape** or clicking the background closes **only the picker**,
       leaving the form open.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
