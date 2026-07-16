import { globalKnownRelations } from '@/@noctua.core/data/relations'
import SectionRow from './SectionRow'
import RadioPillGroup from './RadioPillGroup'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useUserContext } from '@/app/hooks/useUserContext'
import type { Activity } from '@/features/gocam/models/cam'
import { RootTypes } from '@/features/gocam/models/cam'
import { useEffect, useCallback, useState } from 'react'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import {
  EffectDirectionId,
  DirectnessId,
  definitions,
} from '../models/decisionTree'
import { reverseLookup } from '../services/decisionTree'
import { useRelationFormConfig } from '../hooks/useRelationFormConfig'
import {
  resetSelection,
  updateSelection,
  addConnectorEvidence,
  removeConnectorEvidence,
  updateConnectorEvidence,
  setConnectorEvidences,
} from '../slices/relationSlice'
import { useUpdateGraphModelMutation } from '@/features/gocam/slices/camApiSlice'
import {
  buildConnectorOperations,
  buildConnectorDeleteOperations,
  isReverseLinkConnector,
  getDefaultConnectorEvidence,
} from '../services/connectorServices'
import TermAutocomplete from '@/features/search/components/Autocomplete'
import { AutocompleteType } from '@/features/search/models/search'
import type { GOlrResponse } from '@/features/search/models/search'
import DatabaseField from '@/features/gocam/components/forms/DatabaseField'
import { ActionIcon, Button } from '@mantine/core'
import { FiPlus } from 'react-icons/fi'
import { FaTrash } from 'react-icons/fa'
import {
  selectRelationSelected,
  selectRelation,
  selectConnectorEvidences,
} from '../slices/relationSlice'
import { selectCamModel, selectModelEvidence } from '@/features/gocam/slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import SectionHeading from '@/@noctua.core/components/form/SectionHeading'

interface Props {
  sourceActivity: Activity
  targetActivity: Activity
  existingEdgeId?: string
  existingSourceUid?: string
  existingTargetUid?: string
  onClose?: () => void
  onSaved?: () => void
}

const relationLabelMap = new Map<string, string>()
globalKnownRelations.forEach(r => {
  relationLabelMap.set(r.id, r.label)
})

const RelationForm: React.FC<Props> = ({
  sourceActivity,
  targetActivity,
  existingEdgeId,
  existingSourceUid,
  existingTargetUid,
  onClose,
  onSaved,
}) => {
  const dispatch = useAppDispatch()
  const selected = useAppSelector(selectRelationSelected)
  const relation = useAppSelector(selectRelation)
  const connectorEvidences = useAppSelector(selectConnectorEvidences)
  const model = useAppSelector(selectCamModel)
  const evidenceInitialOptions = useAppSelector(selectModelEvidence)
  const isLoggedIn = !!useAppSelector(selectAuthUser)
  const userContext = useUserContext()
  const [updateGraphModel, { isLoading: isSaving }] = useUpdateGraphModelMutation()

  const {
    relationshipOptions,
    definitionMap,
    shouldShowDirection,
    shouldShowDirectness,
    shouldShowChemicalIntermediate,
  } = useRelationFormConfig(sourceActivity.type, targetActivity.type, selected)

  useEffect(() => {
    dispatch(
      resetSelection({
        sourceType: sourceActivity.type,
        targetType: targetActivity.type,
      })
    )

    if (existingEdgeId) {
      const lookup = reverseLookup(existingEdgeId)
      if (lookup) {
        dispatch(
          updateSelection({
            relationshipId: lookup.relationshipId,
            directionId: lookup.directionId,
            directnessId: lookup.directnessId,
          })
        )
      }

      if (existingSourceUid && existingTargetUid) {
        const existingConn = model?.activityConnections.find(
          c => c.sourceId === existingSourceUid && c.targetId === existingTargetUid
        )
        if (existingConn?.evidence && existingConn.evidence.length > 0) {
          const evForms = existingConn.evidence.map(ev => ({
            uid: ev.uid,
            evidenceCode: ev.evidenceCode
              ? { id: ev.evidenceCode.id, label: ev.evidenceCode.label }
              : { id: '', label: '' },
            reference: ev.reference || '',
            withFrom: ev.with || '',
          }))
          dispatch(setConnectorEvidences(evForms))
        }
      }
    } else {
      // New connection: seed the evidence box from the upstream activity's
      // enabled_by edge. When it has none, keep the empty row from
      // resetSelection so the user can still add evidence with [+].
      const seedForms = getDefaultConnectorEvidence(
        sourceActivity,
        targetActivity,
        model?.edges ?? []
      )
      if (seedForms.length > 0) {
        dispatch(setConnectorEvidences(seedForms))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, sourceActivity.type, targetActivity.type, existingEdgeId, existingSourceUid, existingTargetUid])

  const handleOpenChemicalConnector = useCallback(() => {
    dispatch(
      openDialog({
        component: DialogComponent.CHEMICAL_CONNECTOR_FORM,
        title: 'Connect via Chemical Intermediate',
        size: 'lg',
        customProps: {
          sourceActivity,
          targetActivity,
          // Once the chemical intermediate is saved, close this relationship
          // form too rather than revealing it again behind the chemical dialog.
          onSaved: onSaved ?? onClose,
        },
      })
    )
  }, [dispatch, sourceActivity, targetActivity, onSaved, onClose])

  const onRadioChange =
    (field: 'relationshipId' | 'directionId' | 'directnessId') => (value: string) => {
      dispatch(updateSelection({ [field]: value }))
    }

  const resolvedLabel = relation
    ? isReverseLinkConnector(relation, sourceActivity)
      ? 'input of'
      : relationLabelMap.get(relation) || relation
    : null

  const handleSave = useCallback(async () => {
    if (!relation || !model?.id) return

    const modelId = model.id

    // If editing existing connector: delete old, add new
    if (existingEdgeId && existingSourceUid && existingTargetUid) {
      const deleteOps = buildConnectorDeleteOperations(
        existingSourceUid,
        existingTargetUid,
        existingEdgeId,
        modelId
      )
      await updateGraphModel(deleteOps).unwrap()
    }

    const ops = buildConnectorOperations(
      sourceActivity,
      targetActivity,
      relation,
      connectorEvidences,
      modelId,
      userContext
    )

    await updateGraphModel(ops).unwrap()
    dispatch(showToast({ message: 'Causal relation successfully created.' }))
    onSaved?.()
    onClose?.()
  }, [
    relation,
    model,
    sourceActivity,
    targetActivity,
    connectorEvidences,
    existingEdgeId,
    existingSourceUid,
    existingTargetUid,
    updateGraphModel,
    userContext,
    onSaved,
    onClose,
    dispatch,
  ])

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const requestDelete = useCallback(() => {
    if (!existingEdgeId) return
    setDeleteConfirmOpen(true)
  }, [existingEdgeId])

  const handleDelete = useCallback(async () => {
    if (!existingEdgeId || !existingSourceUid || !existingTargetUid || !model?.id) return

    setDeleteConfirmOpen(false)
    const ops = buildConnectorDeleteOperations(
      existingSourceUid,
      existingTargetUid,
      existingEdgeId,
      model.id
    )
    await updateGraphModel(ops).unwrap()
    onSaved?.()
    onClose?.()
  }, [
    existingEdgeId,
    existingSourceUid,
    existingTargetUid,
    model,
    updateGraphModel,
    onSaved,
    onClose,
  ])

  const handleEvidenceFieldChange = useCallback(
    (
      evidenceIndex: number,
      field: 'evidenceCode' | 'reference' | 'withFrom',
      value: GOlrResponse | string | null
    ) => {
      if (value === null) return
      const normalized =
        field === 'evidenceCode' && typeof value === 'object'
          ? { id: value.id, label: value.label }
          : value
      dispatch(
        updateConnectorEvidence({
          evidenceIndex,
          field,
          value: normalized as GOlrResponse | string,
        })
      )
    },
    [dispatch]
  )

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {/* Scrollable body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Relationship section */}
        <SectionRow label="Relationship">
          <RadioPillGroup
            name="relationship"
            value={selected.relationshipId}
            options={relationshipOptions.map(key => {
              const def = definitionMap[key]
              return { value: key, label: def.label, description: def.description }
            })}
            onChange={onRadioChange('relationshipId')}
          />
        </SectionRow>

        {/* Effect Direction */}
        {shouldShowDirection && (
          <SectionRow label="Effect Direction">
            <div className="flex items-center gap-3">
              <RadioPillGroup
                name="effectDirection"
                value={selected.directionId || ''}
                options={Object.values(EffectDirectionId).map(dir => ({
                  value: dir,
                  label: definitions.effectDirection[dir].label,
                }))}
                onChange={onRadioChange('directionId')}
              />
              <p className="grow text-sm text-neutral-500">
                The mechanism regulation should be known, so it should be possible to pick the
                direction of the regulation.
              </p>
            </div>
          </SectionRow>
        )}

        {/* Directness */}
        {shouldShowDirectness && (
          <SectionRow label="Directness">
            <RadioPillGroup
              name="directness"
              value={selected.directnessId || ''}
              options={Object.values(DirectnessId).map(dir => ({
                value: dir,
                label: definitions.directness[dir].label,
                description: definitions.directness[dir].description,
              }))}
              onChange={onRadioChange('directnessId')}
            />
          </SectionRow>
        )}

        {/* Suggested Causal Relation */}
        <SectionHeading className="mt-2">Suggested Causal Relation</SectionHeading>
        <div className="mb-4 py-2">
          <span className="pl-[10px] text-sm">
            {resolvedLabel ?? 'No valid relation'}
          </span>
        </div>

        {/* Chemical Intermediate section — opens its own save path, so hide it
            entirely when not logged in (#278) */}
        {isLoggedIn && shouldShowChemicalIntermediate && (
          <div
            className="flex items-center gap-3 border-b border-blue-800/70 px-4 py-3"
          >
            <span className="w-25 shrink-0 text-sm font-medium text-blue-800">
              Chemical Intermediate
            </span>
            <Button
              variant="filled"
              size="sm"
              onClick={handleOpenChemicalConnector}
              className="!bg-green-700 hover:!bg-green-800 !normal-case"
            >
              Connect via Chemical Intermediate
            </Button>
          </div>
        )}

        {/* Evidence section */}
        <SectionHeading>Evidence</SectionHeading>
        <div className="px-2 py-2">
          {connectorEvidences.map((ev, index) => (
            <div key={ev.uid} className="flex w-full flex-row items-stretch justify-start">
              <div className="grow p-1">
                <TermAutocomplete
                  label="Evidence"
                  name={`conn-evidence-${index}`}
                  rootTypeIds={[RootTypes.EVIDENCE]}
                  autocompleteType={AutocompleteType.EVIDENCE_CODE}
                  value={ev.evidenceCode?.id ? ev.evidenceCode : null}
                  onChange={value => handleEvidenceFieldChange(index, 'evidenceCode', value)}
                  variant="outlined"
                  initialOptions={evidenceInitialOptions}
                />
              </div>
              <div className="w-1/4 lg:w-[30%] max-w-[180px] p-1">
                <DatabaseField
                  type="reference"
                  value={ev.reference || ''}
                  onChange={value => handleEvidenceFieldChange(index, 'reference', value)}
                />
              </div>
              <div className="w-1/4 lg:w-[30%] max-w-[180px] p-1">
                <DatabaseField
                  type="with"
                  value={ev.withFrom || ''}
                  onChange={value => handleEvidenceFieldChange(index, 'withFrom', value)}
                />
              </div>
              <div className="flex shrink-0 items-center justify-center px-2">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="md"
                  onClick={() => dispatch(removeConnectorEvidence(index))}
                  className="!text-gray-400 hover:!text-red-500"
                >
                  <FaTrash size={12} />
                </ActionIcon>
              </div>
            </div>
          ))}
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<FiPlus />}
            onClick={() => dispatch(addConnectorEvidence())}
            className="!normal-case"
          >
            Add Evidence
          </Button>
        </div>
      </div>

      {/* Footer — hidden when not logged in so the form is view-only (#278) */}
      {isLoggedIn && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-gray-100 px-4 py-3 shadow-md">
          <div>
            {!relation && (
              <Button variant="subtle" color="yellow" size="sm">
                Why is the &quot;Save&quot; button disabled?
              </Button>
            )}
            {existingEdgeId && (
              <Button
                variant="outline"
                size="sm"
                color="red"
                onClick={requestDelete}
                disabled={isSaving}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button
              variant="filled"
              size="sm"
              disabled={!relation || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Causal Relation"
        message="Are you sure you want to delete this causal relation? This cannot be undone."
        busy={isSaving}
      />
    </div>
  )
}

export default RelationForm
