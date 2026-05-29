import type React from 'react'
import RelationForm from './RelationForm'
import type { Activity } from '@/features/gocam/models/cam'

interface ConnectorFormProps {
  sourceActivity: Activity
  targetActivity: Activity
  existingEdgeId?: string
  existingSourceUid?: string
  existingTargetUid?: string
  onClose: () => void
  onSaved?: () => void
}

const ConnectorForm: React.FC<ConnectorFormProps> = ({
  sourceActivity,
  targetActivity,
  existingEdgeId,
  existingSourceUid,
  existingTargetUid,
  onClose,
  onSaved,
}) => {
  return (
    <RelationForm
      sourceActivity={sourceActivity}
      targetActivity={targetActivity}
      existingEdgeId={existingEdgeId}
      existingSourceUid={existingSourceUid}
      existingTargetUid={existingTargetUid}
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

export default ConnectorForm
