/** Model-level comment categories, used as a prefix on stored comments — #231. */
export const COMMENT_CATEGORIES = [
  'General',
  'Feedback to curator',
  'Comment to reviewer',
] as const

/**
 * The individual-comment category that lets a curator escalate a disputed GO
 * term annotation to a GitHub ticket on geneontology/go-annotation (#231).
 */
export const ANNOTATION_DISPUTE_CATEGORY = 'GO term annotation dispute' as const

/**
 * What the GO term dispute category was called before #289. The category is
 * stored as a prefix inside the comment itself, so models saved earlier still
 * carry this label — it stays parseable and is shown under the new name.
 */
export const LEGACY_ANNOTATION_DISPUTE_CATEGORY = 'Annotation dispute' as const

/**
 * The individual-comment category for a term that doesn't exist in the ontology
 * yet; escalates to a GitHub ticket on geneontology/go-ontology (#289).
 */
export const ONTOLOGY_TERM_PENDING_CATEGORY = 'Ontology term pending' as const

/**
 * The reference-comment category for disputed evidence; escalates to a GitHub
 * ticket on geneontology/go-annotation, like the GO term dispute (#289).
 */
export const EVIDENCE_DISPUTE_CATEGORY = 'Evidence dispute' as const

/** Categories for comments on an individual (GO term / input) — #231. */
export const INDIVIDUAL_COMMENT_CATEGORIES = [
  ONTOLOGY_TERM_PENDING_CATEGORY,
  ANNOTATION_DISPUTE_CATEGORY,
  'General',
] as const

/** Categories for comments on a reference (evidence individual) — #231, #289. */
export const REFERENCE_COMMENT_CATEGORIES = [
  'Figure/Table',
  'Evidence confidence',
  'Justification for evidence',
  EVIDENCE_DISPUTE_CATEGORY,
  'General',
] as const

/** Every known category across all scopes — used to detect a category prefix on parse. */
const ALL_COMMENT_CATEGORIES: readonly string[] = [
  ...COMMENT_CATEGORIES,
  ...INDIVIDUAL_COMMENT_CATEGORIES,
  ...REFERENCE_COMMENT_CATEGORIES,
  LEGACY_ANNOTATION_DISPUTE_CATEGORY,
]

/** Renamed categories, mapped from their stored label to the current one (#289). */
const CATEGORY_ALIASES: Record<string, string> = {
  [LEGACY_ANNOTATION_DISPUTE_CATEGORY]: ANNOTATION_DISPUTE_CATEGORY,
}

export type CommentCategory = (typeof COMMENT_CATEGORIES)[number]

export interface StructuredComment {
  option: string
  text: string
}

/** Badge color classes per category, for quick visual scanning. */
const COMMENT_CATEGORY_BADGE_CLASSES: Record<string, string> = {
  General: 'bg-blue-100 text-blue-800',
  'Feedback to curator': 'bg-amber-100 text-amber-800',
  'Comment to reviewer': 'bg-cyan-100 text-cyan-800',
  [ANNOTATION_DISPUTE_CATEGORY]: 'bg-red-100 text-red-800',
  [ONTOLOGY_TERM_PENDING_CATEGORY]: 'bg-purple-100 text-purple-800',
  'Figure/Table': 'bg-teal-100 text-teal-800',
  'Evidence confidence': 'bg-indigo-100 text-indigo-800',
  'Justification for evidence': 'bg-green-100 text-green-800',
  [EVIDENCE_DISPUTE_CATEGORY]: 'bg-rose-100 text-rose-800',
}

export const getCommentCategoryBadgeClass = (option: string): string =>
  COMMENT_CATEGORY_BADGE_CLASSES[option] ?? 'bg-slate-200 text-slate-700'

const SEPARATOR = ': '

/**
 * Parse a stored comment string into an option + text.
 * If the prefix before the first `": "` is a known category, it becomes the
 * option; otherwise the option is left blank and the full string is kept as-is.
 * A renamed category resolves to its current label, so a comment saved under
 * the old name reads (and re-saves) as the new one.
 */
export const parseComment = (comment: string): StructuredComment => {
  const idx = comment.indexOf(SEPARATOR)
  if (idx > 0) {
    const prefix = comment.slice(0, idx)
    if (ALL_COMMENT_CATEGORIES.includes(prefix)) {
      return {
        option: CATEGORY_ALIASES[prefix] ?? prefix,
        text: comment.slice(idx + SEPARATOR.length),
      }
    }
  }
  return { option: '', text: comment }
}

/**
 * Format an option + text back into a stored comment string.
 * A blank option leaves the text unchanged (no prefix prepended).
 */
export const formatComment = ({ option, text }: StructuredComment): string =>
  option ? `${option}${SEPARATOR}${text}` : text
