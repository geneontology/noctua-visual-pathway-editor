/** Selectable comment categories, used as a prefix on stored comments. */
export const COMMENT_CATEGORIES = [
  'General',
  'Not suitable for annotation',
  'Annotation dispute',
  'Other',
] as const

export type CommentCategory = (typeof COMMENT_CATEGORIES)[number]

export interface StructuredComment {
  option: string
  text: string
}

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
    if ((COMMENT_CATEGORIES as readonly string[]).includes(prefix)) {
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
