# 09 — Comments

**What this proves:** you can add, edit, and remove comments on the model, blank
comments are dropped, removing a written comment asks for confirmation, and the
comment-count badge reflects the number of comments.

> These comments are for the **whole model**, reached from the comment icon in the
> top toolbar.

---

## TC 9.1 — Open the Comments dialog

1. [ ] In the top model toolbar, click the **comment** icon.
2. [ ] A **Comments** dialog opens.
3. [ ] When there are none yet, it shows **"No comments yet"**.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 9.2 — Add comments

1. [ ] Click **Add Comment** → a text box appears.
2. [ ] Type a comment. The button now reads **Add Another Comment**; click it to add
       a second box, and type a second comment.
3. [ ] Click **Save** → the dialog closes.
4. [ ] The comment icon now shows a small **count badge** (e.g. "2").

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 9.3 — Blank comments are not saved

1. [ ] Open Comments, add a box but leave it empty (or type only spaces).
2. [ ] Click **Save** → the blank comment is dropped; the count does not include it.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 9.4 — Removing a written comment asks for confirmation

1. [ ] Open Comments and click the **trash** icon next to a comment that has text.
2. [ ] A confirmation appears: **"Remove this comment? This cannot be undone."**
3. [ ] Confirm → the comment is removed.
4. [ ] Removing an **empty** comment box removes it immediately, with **no** confirmation.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________

---

## TC 9.5 — Comments persist

1. [ ] After saving comments, reopen the Comments dialog (or reload the model) →
       your comments are still there.

**Result:**  ☐ Pass   ☐ Fail   **Notes:** ______________________________________
