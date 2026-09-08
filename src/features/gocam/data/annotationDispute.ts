/**
 * Comment → GitHub ticket helpers (#231, #289): a dispute or a pending ontology
 * term can be escalated straight to the tracker that triages it, pre-filled
 * with the model, the annotation in question, the curators behind it, and the
 * curator's own comment.
 */

import type { Contributor } from '@/features/users/models/contributor'
import {
  ANNOTATION_DISPUTE_CATEGORY,
  EVIDENCE_DISPUTE_CATEGORY,
  ONTOLOGY_TERM_PENDING_CATEGORY,
} from './commentCategories'

// GO annotation disputes are triaged as GitHub issues on this tracker.
const GO_ANNOTATION_NEW_ISSUE_URL = 'https://github.com/geneontology/go-annotation/issues/new'
// Terms that don't exist in the ontology yet are requested on this one (#289).
const GO_ONTOLOGY_NEW_ISSUE_URL = 'https://github.com/geneontology/go-ontology/issues/new'

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

// The curators behind the annotation, as one bullet — or nothing to add when we
// know of none.
function curatorLine(contributors: Contributor[]): string | null {
  const curators = contributors.map(formatCurator).filter(Boolean).join(', ')
  return curators || null
}

/**
 * A pre-filled "new issue" link: the bullets describe the annotation, and the
 * comment that prompted the ticket is pasted below them (#289).
 */
function buildIssueUrl(params: {
  baseUrl: string
  title: string
  bullets: (string | null)[]
  comment?: string
}): string {
  const { baseUrl, title, bullets, comment } = params
  const lines = bullets.filter(line => !!line).map(line => `* ${line}`)
  const text = comment?.trim()
  const body = [...lines, ...(text ? ['', text] : [])].join('\n')
  const query = new URLSearchParams({ title, body })
  return `${baseUrl}?${query.toString()}`
}

/**
 * A disputed GO term annotation, on geneontology/go-annotation: title carries
 * the model URL, body lists gene, disputed GO term, and the curator(s) who
 * contributed the disputed statement — not whoever is filing the dispute.
 */
export function buildAnnotationDisputeUrl(params: {
  modelUrl: string
  gene: string
  goTerm: string
  contributors: Contributor[]
  comment?: string
}): string {
  const { modelUrl, gene, goTerm, contributors, comment } = params
  return buildIssueUrl({
    baseUrl: GO_ANNOTATION_NEW_ISSUE_URL,
    title: `${ANNOTATION_DISPUTE_CATEGORY} ${modelUrl}`,
    bullets: [gene, goTerm, curatorLine(contributors)],
    comment,
  })
}

/**
 * Disputed evidence, also on geneontology/go-annotation (#289). An evidence
 * individual hangs off a statement rather than a term, so the body names the
 * statement it supports and the evidence itself (code · reference).
 */
export function buildEvidenceDisputeUrl(params: {
  modelUrl: string
  gene: string
  statement: string
  evidence: string
  contributors: Contributor[]
  comment?: string
}): string {
  const { modelUrl, gene, statement, evidence, contributors, comment } = params
  return buildIssueUrl({
    baseUrl: GO_ANNOTATION_NEW_ISSUE_URL,
    title: `${EVIDENCE_DISPUTE_CATEGORY} ${modelUrl}`,
    bullets: [gene, statement, evidence, curatorLine(contributors)],
    comment,
  })
}

/**
 * A term the annotation needs but the ontology doesn't have yet, on
 * geneontology/go-ontology (#289). Same shape as a dispute: the model in the
 * title, the annotation and its curators in the body.
 */
export function buildOntologyTermPendingUrl(params: {
  modelUrl: string
  gene: string
  goTerm: string
  contributors: Contributor[]
  comment?: string
}): string {
  const { modelUrl, gene, goTerm, contributors, comment } = params
  return buildIssueUrl({
    baseUrl: GO_ONTOLOGY_NEW_ISSUE_URL,
    title: `${ONTOLOGY_TERM_PENDING_CATEGORY} ${modelUrl}`,
    bullets: [gene, goTerm, curatorLine(contributors)],
    comment,
  })
}

/** Everything a ticket can say about the annotation a comment sits on. */
export interface CommentTicketContext {
  modelUrl: string
  /** The enabling gene product of the activity the comment sits in. */
  gene: string
  /** The individual being commented on, as "label (id)". */
  goTerm?: string
  /** For a reference comment: the statement the evidence supports, "relation → object". */
  statement?: string
  /** For a reference comment: the evidence itself, "IDA · PMID:25415977". */
  evidence?: string
  /** Curators who contributed the thing being commented on. */
  contributors: Contributor[]
  /** The comment text, pasted into the issue body. */
  comment?: string
}

/** The GitHub button a comment category earns: where it files, and how it reads. */
export interface CommentTicket {
  href: string
  /** Tooltip on the button. */
  label: string
  ariaLabel: string
  color: string
}

/**
 * The GitHub ticket a comment category escalates to, or null for a category
 * that doesn't get one. One source of truth, so the Comments panel and the
 * comment dialog can't offer different buttons for the same comment (#289).
 */
export function commentTicket(category: string, ctx: CommentTicketContext): CommentTicket | null {
  const { modelUrl, gene, goTerm, statement, evidence, contributors, comment } = ctx
  switch (category) {
    case ANNOTATION_DISPUTE_CATEGORY:
      return {
        href: buildAnnotationDisputeUrl({
          modelUrl,
          gene,
          goTerm: goTerm ?? '',
          contributors,
          comment,
        }),
        label: 'File this dispute on go-annotation',
        ariaLabel: 'File annotation dispute on GitHub',
        color: 'red',
      }
    case EVIDENCE_DISPUTE_CATEGORY:
      return {
        href: buildEvidenceDisputeUrl({
          modelUrl,
          gene,
          statement: statement ?? '',
          evidence: evidence ?? '',
          contributors,
          comment,
        }),
        label: 'File this evidence dispute on go-annotation',
        ariaLabel: 'File evidence dispute on GitHub',
        color: 'red',
      }
    case ONTOLOGY_TERM_PENDING_CATEGORY:
      return {
        href: buildOntologyTermPendingUrl({
          modelUrl,
          gene,
          goTerm: goTerm ?? '',
          contributors,
          comment,
        }),
        label: 'Request this term on go-ontology',
        ariaLabel: 'Request ontology term on GitHub',
        color: 'grape',
      }
    default:
      return null
  }
}
