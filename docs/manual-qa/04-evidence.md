# 04 — Evidence

**What this proves:** you can add and edit evidence on any row that needs it —
choosing an evidence code, writing a properly-formatted reference and with/from,
using the ISS / ISO / IC shortcuts, and copying ("cloning") evidence from elsewhere
in the activity.

> Most evidence work happens in a form you already know — the **Activity Unit form**
> (file 01). To set up: open a new Activity Unit, fill in a function + gene product,
> then add a **part of (Biological Process)** context row. That row needs evidence —
> use it for the tests below.

---

## TC 4.1 — Add an evidence row

1. [ ] On a context row (e.g. the Biological Process), open the **⋮** menu →
       **Evidence** → **Add evidence**.
2. [ ] A new, empty evidence appears with three parts: an **evidence code** box, a
       **Reference** box, and a **With** box.
3. [ ] Add a second evidence the same way — the row now lists two evidences.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 4.2 — Pick an evidence code (type-ahead)

1. [ ] Click the **evidence code** box and type a few letters (e.g. `direct assay`).
2. [ ] A dropdown of matching evidence codes appears.
3. [ ] Click one — its label fills the box.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 4.3 — A reference must be `DB:accession`, allowed databases only

1. [ ] Click the **Reference** box — a small editor opens with a **database**
       dropdown and an **accession** field.
2. [ ] The database choices are **PMID**, **DOI**, **GO_REF**.
3. [ ] Choose **PMID** and type a real article id — a short **article preview**
       (title) may appear.
4. [ ] Confirm the reference shows as `PMID:<number>`.
5. [ ] A bare number with no database, or a made-up prefix like `FOO:1`, is **not**
       accepted (Save stays blocked — see file 01, TC 1.6).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 4.4 — With/From (optional)

1. [ ] Click the **With** box → an editor opens letting you choose a database and
       type an accession (e.g. `UniProtKB` + an id).
2. [ ] If you enter a value, it must be in `DB:accession` form (contain a colon),
       otherwise Save is blocked.
3. [ ] Leaving **With** empty is fine — it is optional.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 4.5 — ISS / ISO / IC shortcuts auto-fill an evidence

1. [ ] On a row's **⋮** menu → **Evidence**, choose **ISS**.
2. [ ] An evidence is filled in automatically — an evidence code plus a `GO_REF:`
       reference. (ISS = code `ECO:0000250`, reference `GO_REF:0000024`.)
3. [ ] Try **ISO** (code `ECO:0000266`, ref `GO_REF:0000024`) and **IC**
       (code `ECO:0000305`, ref `GO_REF:0000036`) — each fills its own standard values.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 4.7 — Remove evidence

1. [ ] On a row that has evidence, use **⋮** → **Evidence** → **Remove Evidence**
       (or the **trash** icon next to the evidence).
2. [ ] The evidence is removed from the row.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 4.8 — The evidence row menu when editing an existing activity

*Setup: save an activity, single-click it to open the right-side table, then use a
row's **Add Evidence** to open the evidence dialog (see file 08 for the table).*

1. [ ] Each evidence row has its own **⋮** menu with: **Add evidence**, **ISS**,
       **ISO**, **IC**, **Clear Values**, **Delete**.
2. [ ] **Clear Values** empties that row's fields but keeps the row.
3. [ ] **Delete** removes the row — but it is **disabled when only one row remains**.
4. [ ] Choosing **ISS / ISO / IC** here **replaces** the current row's values with
       the standard ones.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 4.9 — See which databases are allowed

1. [ ] In the form, find the small **ℹ️ info** icons next to the **Reference** and
       **With** column headers.
2. [ ] Click the **Reference** info icon → a popover lists the **Allowed Reference
       Databases** (PMID, DOI, GO_REF).
3. [ ] Click the **With** info icon → a popover lists the **Allowed With/From
       Databases** (a longer list).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

### Spot checks (areas still being worked on — note what you see)

- [ ] References/with should not keep stray **spaces, tabs, or newlines**. Try typing
      a reference with a leading/trailing space and note whether it is cleaned up or
      rejected.
