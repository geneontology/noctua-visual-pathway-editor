# 07 — Connect activities (causal relations)

**What this proves:** you can draw an arrow (a causal relation) between two
activities, the form guides you through the right choices, Save is blocked until a
valid relation is chosen, and you can edit or delete an arrow. Also covers connecting
two activities through a chemical intermediate.

> Setup: have at least **two activities** on the canvas.

---

## TC 7.1 — Draw an arrow between two activities

1. [ ] Hover over the edge of one activity until a connection point appears.
2. [ ] **Drag** from that activity to a second activity and release on top of it.
3. [ ] A **connector form** opens, naming the source and target activities in its header.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.2 — The form guides the relationship choice

1. [ ] Choose a **relationship** — the options depend on what you are connecting
       (e.g. *Regulation*, *Provides input for*, *Removes input for*,
       *Constitutively upstream*, *Undetermined*).
2. [ ] If you chose a regulation, an **Effect direction** choice appears:
       **Positive** / **Negative**.
3. [ ] For a regulation, a **Directness** choice appears: **Direct** / **Indirect**.
4. [ ] The form shows a **suggested causal relation** label (e.g. "directly positively
       regulates") that updates as you make choices.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.3 — Save is blocked until a valid relation is chosen

1. [ ] Before you have made enough choices, **Save** is greyed out.
2. [ ] A **"Why is the Save button disabled?"** explanation is available.
3. [ ] Once a complete, valid relation is chosen, **Save** becomes active.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.4 — Evidence on the connector (optional)

1. [ ] Add an evidence to the connector (code + `PMID:12345`) — same as on activity rows.
2. [ ] You can also save a connector **without** evidence.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.5 — Save creates the arrow

1. [ ] Click **Save** → a success message appears: **"Causal relation successfully
       created."**
2. [ ] The dialog closes and a labelled arrow appears between the two activities on
       the canvas.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.6 — Edit an existing arrow

1. [ ] **Double-click** an existing arrow → the connector form re-opens showing its
       current values.
2. [ ] Change the relationship and **Save** → the arrow updates on the canvas.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.7 — Delete an arrow

1. [ ] In the connector form for an existing arrow, click **Delete**.
2. [ ] A confirmation appears; confirm → the arrow is removed from the canvas.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.8 — Connect via a chemical intermediate

1. [ ] Draw or open a connector and choose **Provides input for**.
2. [ ] A **Connect via Chemical Intermediate** button appears; click it.
3. [ ] A chemical connector form opens listing candidate molecules, grouped
       (e.g. shared by both activities / only the first / only the second).
4. [ ] **Save** is blocked with nothing selected; tick at least one molecule, then
       **Save**.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.9 — You cannot connect an activity to itself

1. [ ] Try to drag a connection from an activity back onto **the same** activity.
2. [ ] The connection is **not** allowed — no connector form opens.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 7.10 — You cannot draw two arrows between the same pair

1. [ ] With one arrow already between activity A and activity B, try to draw a
       **second** arrow from A to B.
2. [ ] A second arrow is **not** created (only one connection is allowed between the
       same two activities). To change the relation, edit the existing arrow (TC 7.6).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
