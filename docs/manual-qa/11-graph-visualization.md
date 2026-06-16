# 11 — Graph visualization

**What this proves:** the canvas draws activities, chemicals, complexes, and
connector arrows correctly, and the layout / zoom / detail controls work.

> Setup: a model with several activities and at least one connector arrow.

---

## TC 11.1 — Activities are drawn with their details

1. [ ] An activity node shows its **gene product** and its **molecular function**.
2. [ ] A **chemical** is drawn as a **circle**.
3. [ ] A **protein complex** shows its **subunits**.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 11.2 — Connector arrows show the relation

1. [ ] An arrow between two activities shows the **relation** (e.g. "positively regulates").
2. [ ] Positive vs negative relations look different (e.g. arrowhead shape / colour).

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 11.3 — Hover shows the node actions

1. [ ] Hover an activity node → **edit**, **duplicate**, and **delete** icons appear
       on its edge.
2. [ ] Move the mouse away → the icons hide again.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 11.4 — Auto Layout

1. [ ] Drag a couple of nodes into a messy arrangement.
2. [ ] Click **Auto Layout** (top layout bar) → the activities rearrange into a tidy layout.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 11.5 — Detail menu

1. [ ] Open the **Detail** menu → it offers **Default**, **Simple View**, **Preview**.
2. [ ] Switch between them → the nodes show more or less detail accordingly.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 11.6 — Spacing menu

1. [ ] Open the **Spacing** menu → it offers **Compact View** and **Expanded View**.
2. [ ] Switch between them → the gap between activities changes.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 11.7 — Zoom

1. [ ] Use the **zoom in** / **zoom out** buttons (top-right of the layout bar) →
       the canvas scales up / down.
2. [ ] Click **reset zoom** → the view returns to the default scale.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 11.8 — Moving a node sticks

1. [ ] Drag a node to a new spot and release.
2. [ ] Its new position stays — e.g. after reloading the model, the node is where you
       left it.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 11.9 — A protein complex's parts are visible

1. [ ] For a protein complex, its gene-product subunits (its **has part** links) are
       visible on the graph and in the right-side table.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
