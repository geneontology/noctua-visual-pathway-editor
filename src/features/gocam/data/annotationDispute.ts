/**
 * Annotation-dispute helpers (#231): a "Annotation dispute" comment can be
 * escalated to a pre-filled GitHub issue on geneontology/go-annotation.
 */

// GO annotation disputes are triaged as GitHub issues on this tracker.
const GO_ANNOTATION_NEW_ISSUE_URL = 'https://github.com/geneontology/go-annotation/issues/new'

// Pull the bare ORCID id (e.g. "0000-0002-1825-0097") out of an ORCID URI.
export function orcidId(uri: string): string {
  const match = uri.match(/\d{4}-\d{4}-\d{4}-[\dX]{4}/)
  return match ? match[0] : uri
}

/**
 * A pre-filled "new issue" link on geneontology/go-annotation for a disputed
 * annotation: title carries the model URL, body lists gene, disputed GO term,
 * and (if resolvable) the curator.
 */
export function buildAnnotationDisputeUrl(params: {
  modelUrl: string
  gene: string
  goTerm: string
  curator: string
}): string {
  const { modelUrl, gene, goTerm, curator } = params
  const body = [`* ${gene}`, `* ${goTerm}`, curator ? `* ${curator}` : null]
    .filter(line => line !== null)
    .join('\n')
  const query = new URLSearchParams({ title: `Annotation dispute ${modelUrl}`, body })
  return `${GO_ANNOTATION_NEW_ISSUE_URL}?${query.toString()}`
}
