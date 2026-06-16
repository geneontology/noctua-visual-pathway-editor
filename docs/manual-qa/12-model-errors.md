# 12 — Model errors panel

**What this proves:** when a model has problems, the editor shows an error count and
a panel listing those problems — and the count reflects what is actually listed.

> Errors come from the **model's data**, not from the forms you fill in. If your model
> is error-free, the error chip simply will not appear — that is the expected "clean"
> result. To exercise this checklist you need a model that already has some issues.
>
> Several of these items are areas the developers are actively investigating
> (#260, #241, #242, #243), so **noting anything confusing or wrong here is the whole
> point** — it is expected that some of this may not be perfect yet.

---

## TC 12.1 — The error chip appears only when there are errors

1. [ ] If the model has problems, a red **"N Errors Found"** chip is shown in the top
       toolbar, near the title.
2. [ ] If the model has no problems, **no** error chip is shown.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 12.2 — Opening the error panel

1. [ ] Click the **"N Errors Found"** chip.
2. [ ] The right drawer opens showing a **"Validation Errors"** panel.
3. [ ] At the top are three count boxes: **Data model violation errors (ShEx)** (red),
       **Activity Units / Chemicals errors** (blue), and **Relations errors** (amber).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 12.3 — The count matches what is listed

1. [ ] Compare the **"N Errors Found"** number on the toolbar chip with the number of
       problems actually shown in the panel.
2. [ ] Note any **mismatch** (this is a known sore point — the count being wrong or
       referring to things not in the model is exactly what #260 / #242 are about).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 12.4 — Each listed error is understandable

1. [ ] Each red **ShEx violation** card shows a number and a plain-English message,
       and (for relation / cardinality problems) a small diagram of the
       subject → relation → object involved.
2. [ ] Note any message that is confusing, refers to something **not** in your model,
       or does not give enough detail to act on. (#241, #242, #243)

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 12.5 — Activity and relation problem lists

1. [ ] The **Activity Units / Chemicals errors** section may list **"Node not shown"**
       items and **"Node/relation combination not allowed"** items.
2. [ ] The **Relations errors** section lists the specific edges
       (source —— relation ——> target) that are not allowed.
3. [ ] For each listed item, check it really matches something wrong in your model.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 12.6 — Closing the panel

1. [ ] Click **Close** (top-right of the panel) → the drawer closes.
2. [ ] The error chip is still on the toolbar (closing the panel does not clear errors).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
