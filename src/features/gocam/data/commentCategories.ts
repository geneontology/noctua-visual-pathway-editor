/** Selectable comment categories, used as a prefix on stored comments. */
export const COMMENT_CATEGORIES = [
  'General',
  'Not suitable for annotation',
  'Annotation dispute',
  'Other',
] as const

/** Categories for comments on an individual (GO term / input) — #231. */
export const INDIVIDUAL_COMMENT_CATEGORIES = [
  'Ontology term pending',
  'Annotation dispute',
  'General',
] as const

/** Categories for comments on a reference (evidence individual) — #231. */
export const REFERENCE_COMMENT_CATEGORIES = [
  'Figure/Table',
  'Evidence confidence',
  'Justification for evidence',
  'General',
] as const

/** Every known category across all scopes — used to detect a category prefix on parse. */
const ALL_COMMENT_CATEGORIES: readonly string[] = [
  ...COMMENT_CATEGORIES,
  ...INDIVIDUAL_COMMENT_CATEGORIES,
  ...REFERENCE_COMMENT_CATEGORIES,
]

export type CommentCategory = (typeof COMMENT_CATEGORIES)[number]

export interface StructuredComment {
  option: string
  text: string
}

/** Badge color classes per category, for quick visual scanning. */
const COMMENT_CATEGORY_BADGE_CLASSES: Record<string, string> = {
  General: 'bg-blue-100 text-blue-800',
  'Not suitable for annotation': 'bg-amber-100 text-amber-800',
  'Annotation dispute': 'bg-red-100 text-red-800',
  Other: 'bg-gray-200 text-gray-700',
  'Ontology term pending': 'bg-purple-100 text-purple-800',
  'Figure/Table': 'bg-teal-100 text-teal-800',
  'Evidence confidence': 'bg-indigo-100 text-indigo-800',
  'Justification for evidence': 'bg-green-100 text-green-800',
}

export const getCommentCategoryBadgeClass = (option: string): string =>
  COMMENT_CATEGORY_BADGE_CLASSES[option] ?? 'bg-slate-200 text-slate-700'

const SEPARATOR = ': '

/**
 * Parse a stored comment string into an option + text.
 * If the prefix before the first `": "` is a known category, it becomes the
 * option; otherwise the option is left blank and the full string is kept as-is.
 */
export const parseComment = (comment: string): StructuredComment => {
  const idx = comment.indexOf(SEPARATOR)
  if (idx > 0) {
    const prefix = comment.slice(0, idx)
    if (ALL_COMMENT_CATEGORIES.includes(prefix)) {
      return { option: prefix, text: comment.slice(idx + SEPARATOR.length) }
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
