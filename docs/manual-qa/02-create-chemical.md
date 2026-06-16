# 02 — Create a Chemical (Molecule)

**What this proves:** the Chemical form uses the right labels, only lets you search
for **chemicals** (not gene products), does not ask for evidence on the chemical
itself, and hides the menu items that do not apply to chemicals.

---

## TC 2.1 — Open the Chemical form

1. [ ] In the **left palette**, find the **CHEMICAL** shape and drag it onto the canvas.
2. [ ] A dialog opens with the title **"Chemical Form"**.
3. [ ] The first section is labelled **Chemical** (not "Gene Product").
4. [ ] The second section is labelled **Location (optional)**.
5. [ ] The **Chemical** row has **no Reference / With (evidence) columns** — chemicals
       do not take evidence.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 2.2 — Chemical search returns chemicals only (no gene products)

1. [ ] Click the **Chemical** term box and type a chemical name (for example
       `glucose` or `ATP`).
2. [ ] The suggestions are **chemical entities only** (ChEBI terms).
3. [ ] Now type a gene/protein name (for example `BRCA1`). It should **not** appear
       as a chemical suggestion.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 2.3 — The chemical row hides the inapplicable menu items

1. [ ] Pick a chemical so the row is filled.
2. [ ] Open the chemical row's **⋮** menu.
3. [ ] Confirm the menu does **not** offer **Search Annotations**, **Fill with root
       term**, or the **ISS / ISO / IC** evidence shortcuts. (These belong only to
       gene-product activities.)
4. [ ] The menu **does** still offer **Add Context** (used in the next test).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 2.4 — Add an optional Location, then leave it off

1. [ ] On the **Chemical** row, open **⋮** → **Add Context** → **located in**
       (Cellular Component).
2. [ ] A row appears in the **Location (optional)** section; type a location term
       and click a suggestion.
3. [ ] Remove it again using its row remove option (trash / X), or simply leave the
       Location empty — **Location is optional**, so Save must still be allowed.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 2.5 — Save the chemical

1. [ ] With just the **Chemical** term filled in (no Location, no evidence), the
       **Save** button is **active**.
2. [ ] Click **Save** — a chemical node (drawn as a **circle**) appears on the canvas.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
