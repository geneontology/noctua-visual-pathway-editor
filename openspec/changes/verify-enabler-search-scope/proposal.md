# Proposal

## Why

Inline-editing an existing gene-product enabler searched CHEBI chemicals instead of gene products, because the search used the node's full stored type set (#267). The fix is implemented and described in the `term-search` baseline ("Search scope for existing nodes", "Field search scope by category"); only a manual check in the browser remains.

## What Changes

- No code or requirement changes. This change tracks the remaining manual verification of the search scope when editing existing nodes.

Out of scope: changing any field's search category.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- None (verification only).
