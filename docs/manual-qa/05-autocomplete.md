# 05 — Autocomplete (term search)

**What this proves:** the term-search boxes used throughout the editor behave
correctly — they search as you type, show suggestions, let you pick one, and offer
only the *right kind* of term for each box.

> Any box where you "pick a term" uses this same search: Molecular Function, Gene
> Product, Biological Process, Cellular Component, Chemical, Protein Complex, and
> Evidence Code.

---

## TC 5.1 — Typing searches; clicking picks

1. [ ] In any term box (e.g. **Molecular Function** in a new Activity Unit), type
       two or three letters.
2. [ ] After a short pause, a dropdown of matching terms appears.
3. [ ] Each suggestion shows the term name (and usually its id).
4. [ ] **Click** a suggestion → the box fills with that term and the dropdown closes.
5. [ ] Typing text **without clicking** a suggestion does **not** select a term.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 5.2 — Too few characters shows nothing; clearing hides results

1. [ ] Type a **single** character → no dropdown appears (search needs a minimum
       number of letters).
2. [ ] Type enough to get results, then delete back to empty → the suggestions
       disappear.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 5.3 — Terms already used in the model appear before you type

1. [ ] In a model that already has some activities, click into a term box **without
       typing**.
2. [ ] A short list of terms already used in this model is offered as quick picks.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 5.4 — Each box offers only the correct kind of term

1. [ ] **Molecular Function** box → only molecular-function terms.
2. [ ] **Cellular Component / Location** box → only cellular-component terms, and
       **not** protein complexes.
3. [ ] **Chemical** box (Chemical form) → only chemicals (ChEBI); **no** gene products.
4. [ ] **Protein Complex** box → only GO complex terms.
5. [ ] **Evidence Code** box → only evidence codes.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 5.5 — Reference accession suggestions + article preview

1. [ ] Open a **Reference** editor (on any evidence) and choose **PMID**.
2. [ ] As you type an accession, a short article preview (title) and/or suggestions
       may appear.
3. [ ] Switching the database to **DOI** or **GO_REF** changes what is accepted.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 5.6 — No-results state

1. [ ] Type a nonsense string (e.g. `zzzqqq`) into a term box.
2. [ ] The dropdown shows **no matches** (an empty / "no results" state) — not an error.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

### Spot check (may be in progress)

- [ ] If a gene has a "canonical" entry, note whether it appears **at or near the top**
      of the suggestions.
