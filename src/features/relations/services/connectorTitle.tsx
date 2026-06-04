import type { ReactNode } from 'react'
import { FaLongArrowAltRight } from 'react-icons/fa'
import type { Activity } from '@/features/gocam/models/cam'

export const CONNECTOR_TITLE_LABEL_MAX = 30

const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max).trimEnd()} ...` : s

// Causal relations connect activities by their root node — the molecular
// function (or molecule for molecule activities), never the gene product.
const rawLabelFor = (activity: Activity | null) => activity?.rootNode?.label ?? 'Unknown'

const labelFor = (activity: Activity | null) =>
  truncate(rawLabelFor(activity), CONNECTOR_TITLE_LABEL_MAX)

const titlePrefix = (isEdit: boolean) =>
  isEdit ? 'Edit Causal Relation' : 'Causal Relation Form'


export const formatConnectorDialogTitle = (
  source: Activity | null,
  target: Activity | null,
  isEdit: boolean
): string => {
  const prefix = titlePrefix(isEdit)
  if (!source || !target) return prefix
  return `${prefix}: Connect ${labelFor(source)} to ${labelFor(target)}`
}

const TITLE_NODE_CLASS =
  'flex min-w-0 h-12 flex-1 basis-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5  text-sm font-medium'

// Keep the line-clamp on a padding-free inner span: line-clamp's overflow:hidden
// clips at the padding box, so clamping the padded box lets a sliver of the next
// line peek into the bottom padding right after the ellipsis.
const TITLE_TEXT_CLASS = 'line-clamp-2 break-words'

export const renderConnectorDialogTitle = (
  source: Activity | null,
  target: Activity | null,
  isEdit: boolean
): ReactNode => {
  if (!source || !target) return titlePrefix(isEdit)
  const sourceLabel = rawLabelFor(source)
  const targetLabel = rawLabelFor(target)
  return (
    <span className="flex w-full items-center justify-center gap-3 align-middle">
      <span className="shrink-0 font-medium text-gray-500">Connect</span>
      <span className={TITLE_NODE_CLASS} title={sourceLabel}>
        <span className={TITLE_TEXT_CLASS}>{sourceLabel}</span>
      </span>
      <FaLongArrowAltRight className="shrink-0 text-gray-400" size={18} aria-label="to" />
      <span className={TITLE_NODE_CLASS} title={targetLabel}>
        <span className={TITLE_TEXT_CLASS}>{targetLabel}</span>
      </span>
    </span>
  )
}
