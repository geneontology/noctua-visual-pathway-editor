import type React from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectFormType, selectFormMode } from '../../slices/activityFormSlice'
import { ActivityType } from '../../models/cam'
import { FormMode } from '../../models/formModels'
import SimpleDialog from '@/@noctua.core/components/dialog/SimpleDialog'

interface ActivityFormDialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

function getDialogTitle(
  mode: FormMode | null,
  activityType: string | null
): string {
  const typeLabel =
    activityType === ActivityType.MOLECULE
      ? 'Chemical'
      : activityType === ActivityType.PROTEIN_COMPLEX
        ? 'Protein Complex'
        : 'Activity Unit'

  return mode === FormMode.EDIT ? `Edit ${typeLabel}` : `${typeLabel} Form`
}

const ActivityFormDialog: React.FC<ActivityFormDialogProps> = ({ open, onClose, children }) => {
  const activityType = useAppSelector(selectFormType)
  const mode = useAppSelector(selectFormMode)
  const title = getDialogTitle(mode, activityType)

  return (
    <SimpleDialog open={open} onClose={onClose} title={title} size="md" tall bodyScroll="none">
      {children}
    </SimpleDialog>
  )
}

export default ActivityFormDialog
