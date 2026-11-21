# Tasks

## 1. Browser check (#305)

Log in and open a model where two activity units (A and B) each link only to the same chemical X by "has output", a pair of activity units (C and D) joined by a causal relation such as "directly positively regulates", and an activity unit E with no relations at all.

- [ ] 1.1 Click toolbar **Select** and check the "Quality" group. Expect: "Without evidence", "With comments", "Unconnected nodes", "No causal relations", in that order.
- [ ] 1.2 Select a node such as C, then click **Select → No causal relations**. Expect: A, B and E are selected; C, D and X are not, so the earlier selection of C is gone.
- [ ] 1.3 Click **Select → Unconnected nodes**. Expect: only E is selected; A and B are not (they link to X), confirming the two checks differ.
- [ ] 1.4 Drag from X to E, choose **Substrate** and click **Save**. Expect: a line from X to E labelled "input of". Run **Select → No causal relations** again. Expect: none of A, B or E is selected (A → X → E counts as causal).
- [ ] 1.5 In a model where every activity unit has a causal relation, select any node and run **Select → No causal relations**. Expect: the selection is cleared and a warning reads "No activities without causal relations in this model".
