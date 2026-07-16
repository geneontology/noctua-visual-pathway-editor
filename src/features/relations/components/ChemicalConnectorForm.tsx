import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActionIcon, Button, Checkbox, Loader } from '@mantine/core'
import { FiPlus } from 'react-icons/fi'
import { FaTrash } from 'react-icons/fa'
import { v4 as uuidv4 } from 'uuid'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useUserContext } from '@/app/hooks/useUserContext'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import { selectCamModel } from '@/features/gocam/slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import type { Activity, GraphNode } from '@/features/gocam/models/cam'
import { RootTypes } from '@/features/gocam/models/cam'
import type { EvidenceForm } from '@/features/gocam/models/formModels'
import { useLazyGetChemicalParticipantsQuery } from '@/features/search/slices/lookupApiSlice'
import { AutocompleteType } from '@/features/search/models/search'
import type { GOlrResponse } from '@/features/search/models/search'
import TermAutocomplete from '@/features/search/components/Autocomplete'
import DatabaseField from '@/features/gocam/components/forms/DatabaseField'
import { useUpdateGraphModelMutation } from '@/features/gocam/slices/camApiSlice'
import { buildChemicalParticipantOperations } from '../services/connectorServices'
import {
  categorizeParticipants,
  type ChemicalParticipant,
  type CategorizedParticipants,
} from '../services/chemicalConnectorUtils'
import SectionHeading from '@/@noctua.core/components/form/SectionHeading'

interface Props {
  sourceActivity: Activity
  targetActivity: Activity
  /** Called after a successful save to also close the parent connector dialog. */
  onSaved?: () => void
}

const ChemicalConnectorForm: React.FC<Props> = ({ sourceActivity, targetActivity, onSaved }) => {
  const dispatch = useAppDispatch()
  const model = useAppSelector(selectCamModel)
  const isLoggedIn = !!useAppSelector(selectAuthUser)
  const userContext = useUserContext()
  const [updateGraphModel, { isLoading: isSaving }] = useUpdateGraphModelMutation()

  // Fetch chemical participants for both activities' MF nodes
  const [fetchSubjectParticipants, subjectQuery] = useLazyGetChemicalParticipantsQuery()
  const [fetchObjectParticipants, objectQuery] = useLazyGetChemicalParticipantsQuery()

  const [categorized, setCategorized] = useState<CategorizedParticipants | null>(null)
  const [evidences, setEvidences] = useState<EvidenceForm[]>([])

  // Trigger fetches on mount
  useEffect(() => {
    const subjectMfId = sourceActivity.molecularFunction?.id
    const objectMfId = targetActivity.molecularFunction?.id

    if (subjectMfId) fetchSubjectParticipants(subjectMfId)
    if (objectMfId) fetchObjectParticipants(objectMfId)
  }, [sourceActivity, targetActivity, fetchSubjectParticipants, fetchObjectParticipants])

  // Categorize once both fetches complete
  useEffect(() => {
    if (subjectQuery.isUninitialized || objectQuery.isUninitialized) return
    if (subjectQuery.isLoading || objectQuery.isLoading) return

    const subjectData = subjectQuery.data ?? []
    const objectData = objectQuery.data ?? []

    setCategorized(categorizeParticipants(subjectData, objectData))
  }, [
    subjectQuery.data,
    subjectQuery.isLoading,
    subjectQuery.isUninitialized,
    objectQuery.data,
    objectQuery.isLoading,
    objectQuery.isUninitialized,
  ])

  const isLoading = subjectQuery.isLoading || objectQuery.isLoading

  const allItems = useMemo(() => {
    if (!categorized) return []
    return [...categorized.common, ...categorized.subjectOnly, ...categorized.objectOnly]
  }, [categorized])

  const selectedItems = useMemo(() => allItems.filter(item => item.selected), [allItems])

  const toggleItem = useCallback(
    (id: string) => {
      if (!categorized) return
      const toggle = (items: ChemicalParticipant[]) =>
        items.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
      setCategorized({
        common: toggle(categorized.common),
        subjectOnly: toggle(categorized.subjectOnly),
        objectOnly: toggle(categorized.objectOnly),
      })
    },
    [categorized]
  )

  // Evidence management
  const addEvidence = useCallback(() => {
    setEvidences(prev => [
      ...prev,
      { uid: uuidv4(), evidenceCode: { id: '', label: '' }, reference: '', withFrom: '' },
    ])
  }, [])

  const removeEvidence = useCallback((uid: string) => {
    setEvidences(prev => prev.filter(ev => ev.uid !== uid))
  }, [])

  const updateEvidence = useCallback(
    (
      uid: string,
      field: 'evidenceCode' | 'reference' | 'withFrom',
      value: GOlrResponse | string | null
    ) => {
      if (value === null) return
      setEvidences(prev =>
        prev.map(ev => {
          if (ev.uid !== uid) return ev
          if (field === 'evidenceCode') {
            const v = value as GOlrResponse
            return { ...ev, evidenceCode: { id: v.id, label: v.label } }
          }
          return { ...ev, [field]: value as string }
        })
      )
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (!model?.id || selectedItems.length === 0) return

    const subjectMfNode: GraphNode | undefined = sourceActivity.rootNode
    const objectMfNode: GraphNode | undefined = targetActivity.rootNode

    if (!subjectMfNode || !objectMfNode) return

    const ops = buildChemicalParticipantOperations(
      subjectMfNode,
      objectMfNode,
      selectedItems.map(item => ({ id: item.id, label: item.label })),
      model.id,
      userContext
    )

    await updateGraphModel(ops).unwrap()
    dispatch(showToast({ message: 'Chemical Reactions created.' }))
    dispatch(closeDialog())
    onSaved?.()
  }, [
    model,
    sourceActivity,
    targetActivity,
    selectedItems,
    userContext,
    updateGraphModel,
    dispatch,
    onSaved,
  ])

  // Render helpers
  const renderSection = (title: string, items: ChemicalParticipant[]) => {
    if (items.length === 0) return null
    const selectedCount = items.filter(item => item.selected).length
    return (
      <div className="flex w-full flex-col items-stretch justify-start">
        <SectionHeading
          right={
            selectedCount > 0 ? (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                {selectedCount} selected
              </span>
            ) : null
          }
        >
          {title}
        </SectionHeading>
        <div className="flex flex-col items-stretch justify-start py-1">
          {items.map(item => (
            <Checkbox
              key={item.id}
              checked={item.selected}
              onChange={() => toggleItem(item.id)}
              size="sm"
              className="cursor-pointer border-b border-gray-100 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-gray-50"
              label={
                <span className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-800">{item.label}</span>
                  <span className="text-xs text-gray-400">{item.id}</span>
                </span>
              }
            />
          ))}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader size={24} />
        <span className="ml-2 text-sm text-gray-500">Loading chemical participants...</span>
      </div>
    )
  }

  const hasNoParticipants =
    categorized &&
    categorized.common.length === 0 &&
    categorized.subjectOnly.length === 0 &&
    categorized.objectOnly.length === 0

  return (
    <div className="flex flex-col">
      {/* Body */}
      <div className="flex flex-col items-stretch justify-start">
        {hasNoParticipants ? (
          <div className="px-2.5 py-8 text-center text-sm italic text-gray-400">
            No chemical participants found for these molecular functions.
          </div>
        ) : (
          <>
            {categorized &&
              renderSection(
                'Participants common to upstream and downstream activities',
                categorized.common
              )}
            {categorized &&
              renderSection('Participants in upstream activity only', categorized.subjectOnly)}
            {categorized &&
              renderSection('Participants in downstream activity only', categorized.objectOnly)}

            {/* Info messages for missing sides */}
            {categorized &&
              categorized.subjectOnly.length === 0 &&
              categorized.objectOnly.length > 0 && (
                <div className="px-4 py-2 text-sm italic text-gray-400">
                  No participants found for upstream activity
                </div>
              )}
            {categorized &&
              categorized.objectOnly.length === 0 &&
              categorized.subjectOnly.length > 0 && (
                <div className="px-4 py-2 text-sm italic text-gray-400">
                  No participants found for downstream activity
                </div>
              )}

            {/* Evidence section */}
            <SectionHeading className="mt-2">Evidence</SectionHeading>
            <div className="px-4 py-2">
              {evidences.map(ev => (
                <div key={ev.uid} className="mb-2 flex items-center gap-2">
                  <div className="w-[55%] p-4">
                    <TermAutocomplete
                      label="Evidence"
                      name={`chem-ev-${ev.uid}`}
                      rootTypeIds={[RootTypes.EVIDENCE]}
                      autocompleteType={AutocompleteType.EVIDENCE_CODE}
                      value={ev.evidenceCode?.id ? ev.evidenceCode : null}
                      onChange={value => updateEvidence(ev.uid, 'evidenceCode', value)}
                    />
                  </div>
                  <div className="w-1/4 p-4">
                    <DatabaseField type="reference"
                      value={ev.reference}
                      onChange={value => updateEvidence(ev.uid, 'reference', value)}
                    />
                  </div>
                  <div className="w-[20%] p-4">
                    <DatabaseField type="with"
                      value={ev.withFrom}
                      onChange={value => updateEvidence(ev.uid, 'withFrom', value)}
                    />
                  </div>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="md"
                    onClick={() => removeEvidence(ev.uid)}
                    className="!text-gray-400 hover:!text-red-500"
                  >
                    <FaTrash size={12} />
                  </ActionIcon>
                </div>
              ))}
              <Button
                variant="subtle"
                size="compact-sm"
                leftSection={<FiPlus />}
                onClick={addEvidence}
                className="!normal-case"
              >
                Add Evidence
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {isLoggedIn && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-100 px-4 py-3">
          <Button
            variant="filled"
            size="sm"
            disabled={selectedItems.length === 0 || isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ChemicalConnectorForm
