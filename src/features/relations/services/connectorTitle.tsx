import type { ReactNode } from 'react'
import type { Activity } from '@/features/gocam/models/cam'

export const CONNECTOR_TITLE_LABEL_MAX = 30

const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max).trimEnd()} ...` : s

const labelFor = (activity: Activity | null) =>
  truncate(
    activity?.enabledBy?.label ?? activity?.rootNode?.label ?? 'Unknown',
    CONNECTOR_TITLE_LABEL_MAX
  )

const titlePrefix = (isEdit: boolean) =>
  isEdit ? 'Edit Causal Relation' : 'Causal Relation Form'

/**
 * Plain-string SimpleDialog title for the connector form. Kept for callers
 * that need a string (logs, headless tests, fallbacks).
 *
 * - "Causal Relation Form: Connect <src> to <tgt>" when creating
 * - "Edit Causal Relation: Connect <src> to <tgt>" when editing
 * Labels longer than CONNECTOR_TITLE_LABEL_MAX collapse to a leading slice +
 * " ..." so the header doesn't blow out on long gene-product names.
 */
export const formatConnectorDialogTitle = (
  source: Activity | null,
  target: Activity | null,
  isEdit: boolean
): string => {
  const prefix = titlePrefix(isEdit)
  if (!source || !target) return prefix
  return `${prefix}: Connect ${labelFor(source)} to ${labelFor(target)}`
}

/**
 * Same content as formatConnectorDialogTitle, but emitted as JSX so the
 * gene-product labels can be set apart from the surrounding header text.
 * The wrapping text inherits the standard DialogHeader styling; only the
 * labels get an accent (italic + text-blue-700) so the variable part reads
 * at a glance.
 */
export const renderConnectorDialogTitle = (
  source: Activity | null,
  target: Activity | null,
  isEdit: boolean
): ReactNode => {
  const prefix = titlePrefix(isEdit)
  if (!source || !target) return prefix
  return (
    <span>
      {prefix}: Connect{' '}
      <span className="italic text-blue-700">{labelFor(source)}</span> to{' '}
      <span className="italic text-blue-700">{labelFor(target)}</span>
    </span>
  )
}
