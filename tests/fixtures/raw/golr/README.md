# GOlr response fixtures

Raw JSON captured from the live GOlr endpoints. Used to exercise the
parsers in `src/features/search/services/lookupServices.ts` and the
`searchTerms` / `searchAnnotations` / `getChemicalParticipants` flows in
`src/features/search/slices/lookupApiSlice.ts`.

## Files

| File | Endpoint | Query | What it covers |
| --- | --- | --- | --- |
| `search-mf.json` | `noctua-golr.berkeleybop.org/select` | `isa_closure:GO:0003674` + `q=lipid transport*` | term search filtered to molecular_function |
| `search-bp.json` | same | `isa_closure:GO:0008150` + `q=cell division*` | term search filtered to biological_process |
| `search-cc.json` | same | `isa_closure:GO:0005575` + `q=peroxisome membrane*` | term search filtered to cellular_component |
| `search-evidence.json` | same | `isa_closure:ECO:0000352` | evidence-code term search |
| `search-chemical-with-exclude.json` | same | `isa_closure:"CHEBI:24431" OR NOT isa_closure:"CHEBI:33695"` + `q=glucose*` | chemical term search with the `OR NOT` exclusion that hides gene products — verifies the closure-exclusion clause |
| `annotations-mf.json` | `golr.geneontology.org/solr/select` | `bioentity:WB:WBGene00000099` + `aspect:F` | search-annotations (MF aspect) — captured with the same facet fields the app sends |
| `annotations-bp.json` | same | `bioentity:WB:WBGene00000099` + `aspect:P` | search-annotations (BP aspect) |
| `annotations-cc.json` | same | `bioentity:UniProtKB:Q06187` + `isa_partof_closure:GO:0005575` + `-isa_partof_closure:GO:0032991` | search-annotations (CC aspect with protein-complex exclusion — the special branch in `lookupApiSlice`) |
| `chemical-participants.json` | `noctua-golr.berkeleybop.org/select` | `q=GO:0004352` (glutamate dehydrogenase) | get-chemical-participants — contains the `neighborhood_graph_json` field the parser walks |

## How to refresh

Each file's URL is recorded in the table above (the query string maps
directly to the fixture). To refresh, hit the URL with `curl -sL --max-time 30 '<url>'`
and overwrite the fixture. Keep `rows` small (≤10) so fixtures stay
under ~150 KB; full responses can run >700 KB because of the embedded
`neighborhood_graph_json` field on each doc.

## What's intentionally not in here

- A **searchAnnotations response with a non-empty `annotation_class:` filter** — useful for verifying that filter is wired correctly. Capture from a real session if the parser needs deeper coverage.
- A **searchAnnotations response with `evidence:` filter set** — same reason.
- A **term-search response with zero hits** — useful for testing empty-state handling. Trivial to synthesize from any of the existing fixtures by trimming `docs` to `[]`.
- A **getChemicalParticipants response with no chemicals** — also trivial to synthesize.

## A note on `rows`

The app sends `rows=2000` to GOlr; the fixtures use `rows=10` (search-terms variants use `rows=3-10`). All other params match what the app sends. This keeps fixtures ≤150 KB while preserving the exact response shape — `responseHeader`, `response.numFound`, `response.docs[]`, and the `facet_counts` block are all present. Tests that assert on individual docs should slice the first few entries; tests that need a richer doc set should re-capture with a higher `rows`.
