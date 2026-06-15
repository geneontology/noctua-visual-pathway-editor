# 08 — Edit, duplicate, and delete activities

**What this proves:** you can edit an existing activity (via the form and via the
right-side table), duplicate one as a fresh copy, and delete one with a confirmation.
Also checks the chemical edit screen uses the right labels.

> Setup: a model with at least one saved activity.

---

## TC 8.1 — Edit via the pencil / double-click

1. [ ] Hover an activity node → an **edit (pencil)** icon appears on its right edge.
2. [ ] Click it (or **double-click** the node) → the activity form opens titled
       **"Edit Activity Unit"** (or "Edit Chemical" / "Edit Protein Complex").
3. [ ] Change a term or add context, then **Save** → the node updates on the canvas.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 8.2 — Edit via the right-side table

1. [ ] **Single-click** an activity node → the right drawer opens on the
       **Activity Table** tab, showing the activity's rows.
2. [ ] Click a term cell → a small inline editor opens to change just that field.
3. [ ] On a row, use **Add Context** to add a new child, or **Add Evidence** to open
       the evidence dialog.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 8.3 — Duplicate an activity

1. [ ] Hover an activity node → a **duplicate** icon appears (between edit and delete).
2. [ ] Click it → the activity form opens **prefilled with a copy** of that activity's
       terms and evidence.
3. [ ] The dialog is a **new** activity form (its title is *not* "Edit").
4. [ ] **Save** → a brand-new activity appears on the canvas; the original is unchanged.
5. [ ] The original's arrows/connectors are **not** copied to the duplicate.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 8.4 — Delete an activity

1. [ ] Hover an activity node → a **delete (trash)** icon appears.
2. [ ] Click it → a confirmation dialog warns the delete **cannot be undone**.
3. [ ] Confirm → the node and any arrows attached to it disappear from the canvas.
4. [ ] (Optional) Re-try and **Cancel** the confirmation instead → nothing is deleted.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 8.5 — Editing a chemical shows chemical labels

1. [ ] Edit a **chemical** activity (single-click it, or use the edit pencil).
2. [ ] The header reads **"Chemical"** (e.g. "Edit Chemical" / "Chemical Form").
3. [ ] It shows a **Chemical** section and a **Location (optional)** section — not a
       generic "Activity / Function Description".
4. [ ] No evidence column and no "no evidence present" text appears for the chemical row.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
