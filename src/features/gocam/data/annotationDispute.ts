/**
 * Annotation-dispute helpers (#231): a "Annotation dispute" comment can be
 * escalated to a pre-filled GitHub issue on geneontology/go-annotation.
 */

import type { Contributor } from '@/features/users/models/contributor'

// GO annotation disputes are triaged as GitHub issues on this tracker.
const GO_ANNOTATION_NEW_ISSUE_URL = 'https://github.com/geneontology/go-annotation/issues/new'

// Pull the bare ORCID id (e.g. "0000-0002-1825-0097") out of an ORCID URI.
export function orcidId(uri: string): string {
  const match = uri.match(/\d{4}-\d{4}-\d{4}-[\dX]{4}/)
  return match ? match[0] : uri
}

/**
 * Name a curator on the ticket as "Name (ORCID)". The ORCID is what makes them
 * identifiable — names aren't unique — so fall back to it alone when we have no
 * name, and to the name alone when we have no URI.
 */
export function formatCurator(contributor: Contributor): string {
  const id = contributor.uri ? orcidId(contributor.uri) : ''
  const name = contributor.name?.trim() ?? ''
  if (name && id) return `${name} (${id})`
  return id || name
}

/**
 * A pre-filled "new issue" link on geneontology/go-annotation for a disputed
 * annotation: title carries the model URL, body lists gene, disputed GO term,
 * and the curator(s) who contributed the disputed statement — not whoever is
 * filing the dispute.
 */
export function buildAnnotationDisputeUrl(params: {
  modelUrl: string
  gene: string
  goTerm: string
  contributors: Contributor[]
}): string {
  const { modelUrl, gene, goTerm, contributors } = params
  const curators = contributors.map(formatCurator).filter(Boolean).join(', ')
  const body = [`* ${gene}`, `* ${goTerm}`, curators ? `* ${curators}` : null]
    .filter(line => line !== null)
    .join('\n')
  const query = new URLSearchParams({ title: `Annotation dispute ${modelUrl}`, body })
  return `${GO_ANNOTATION_NEW_ISSUE_URL}?${query.toString()}`
}
