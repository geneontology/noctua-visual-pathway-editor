import { useEffect, useState } from 'react'
import type React from 'react'
import { Checkbox } from '@mantine/core'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import RegionPreview from './RegionPreview'
import type { RegionClipboardPayload } from '@/features/gocam/services/regionClipboard'

interface PasteRegionDialogProps {
  open: boolean
  payload: RegionClipboardPayload | null
  busy?: boolean
  onCancel: () => void
  onConfirm: (includeEvidence: boolean) => void
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

/**
 * Confirmation for pasting copied nodes.
 *
 * The write itself is the same `updateGraphModel` call the Activity Form makes
 * on save — the difference is only that there's no form to review first. So the
 * dialog's job is to show what is about to be added.
 */
const PasteRegionDialog: React.FC<PasteRegionDialogProps> = ({
  open,
  payload,
  busy = false,
  onCancel,
  onConfirm,
}) => {
  // On by default — a pasted activity keeps the evidence it was copied with
  // unless the curator opts out.
  const [includeEvidence, setIncludeEvidence] = useState(true)

  // Reset the checkbox between pastes so one opt-out doesn't silently persist.
  useEffect(() => {
    if (open) setIncludeEvidence(true)
  }, [open])

  if (!payload) return null

  const nodeCount = payload.activities.length
  const hasRelations = payload.connections.length > 0

  return (
    <ConfirmDialog
      open={open}
      onClose={onCancel}
      onConfirm={() => onConfirm(includeEvidence)}
      title="Paste copied nodes"
      size="sm"
      confirmLabel={busy ? 'Pasting…' : 'Paste'}
      confirmColor="primary"
      busy={busy}
      message={
        <div className="flex flex-col gap-3">
          <p>
            Paste {plural(nodeCount, 'node', 'nodes')}
            {hasRelations && ' and their relations'}?
          </p>

          <RegionPreview payload={payload} />
          <Checkbox
            checked={includeEvidence}
            onChange={e => setIncludeEvidence(e.target.checked)}
            size="sm"
            label="Include evidence"
            description="Copy evidence and references from the source nodes"
          />
        </div>
      }
    />
  )
}

export default PasteRegionDialog
