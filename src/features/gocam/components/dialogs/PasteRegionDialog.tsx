import { useEffect, useState } from 'react'
import type React from 'react'
import { Checkbox } from '@mantine/core'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import type { RegionClipboardPayload } from '@/features/gocam/services/regionClipboard'

interface PasteRegionDialogProps {
  open: boolean
  payload: RegionClipboardPayload | null
  /** Model being pasted into, so the dialog can say whether it's the same one. */
  currentModelId: string | null
  busy?: boolean
  onCancel: () => void
  onConfirm: (includeEvidence: boolean) => void
}

/** "just now" / "4 minutes ago" / "2 days ago" — enough to spot a stale paste. */
export function describeAge(copiedAt: string, now: number = Date.now()): string {
  const then = Date.parse(copiedAt)
  if (Number.isNaN(then)) return 'at an unknown time'

  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 45) return 'just now'

  const units: [number, string][] = [
    [60, 'minute'],
    [60, 'hour'],
    [24, 'day'],
  ]
  let value = seconds / 60
  let label = 'minute'
  for (let i = 1; i < units.length; i++) {
    if (value < units[i][0]) break
    value /= units[i][0]
    label = units[i][1]
  }

  const rounded = Math.max(1, Math.round(value))
  return `${rounded} ${label}${rounded === 1 ? '' : 's'} ago`
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

/**
 * Confirmation for pasting a copied region.
 *
 * The write itself is the same `updateGraphModel` call the Activity Form makes
 * on save — the difference is only that there's no form to review first. So the
 * dialog's job is to state what and how old, since the region may have been
 * copied a while ago or in another model.
 */
const PasteRegionDialog: React.FC<PasteRegionDialogProps> = ({
  open,
  payload,
  currentModelId,
  busy = false,
  onCancel,
  onConfirm,
}) => {
  // Matches CopyModelDialog's "Include evidence", which also defaults to off.
  const [includeEvidence, setIncludeEvidence] = useState(false)

  // Reset the checkbox between pastes so one opt-in doesn't silently persist.
  useEffect(() => {
    if (open) setIncludeEvidence(false)
  }, [open])

  if (!payload) return null

  const activityCount = payload.activities.length
  const connectionCount = payload.connections.length
  const fromAnotherModel =
    !!payload.sourceModelId && payload.sourceModelId !== currentModelId

  return (
    <ConfirmDialog
      open={open}
      onClose={onCancel}
      onConfirm={() => onConfirm(includeEvidence)}
      title="Paste copied region"
      confirmLabel={busy ? 'Pasting…' : 'Paste'}
      confirmColor="blue"
      busy={busy}
      message={
        <div className="flex flex-col gap-3">
          <p>
            Paste {plural(activityCount, 'activity', 'activities')}
            {connectionCount > 0 && (
              <> and {plural(connectionCount, 'relation', 'relations')}</>
            )}{' '}
            into this model?
          </p>
          <p className="text-xs text-gray-500">
            Copied {fromAnotherModel ? 'from another model' : 'from this model'}{' '}
            {describeAge(payload.copiedAt)}. They are added straight away — there is no form to
            review first.
          </p>
          <Checkbox
            checked={includeEvidence}
            onChange={e => setIncludeEvidence(e.target.checked)}
            size="sm"
            label="Include evidence"
            description="Copy evidence and references from the source activities"
          />
        </div>
      }
    />
  )
}

export default PasteRegionDialog
