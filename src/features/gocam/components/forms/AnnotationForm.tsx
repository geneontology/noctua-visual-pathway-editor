import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { ActionIcon, Button, Menu } from '@mantine/core'
import { FaEllipsisV, FaPlus } from 'react-icons/fa'
import { v4 as uuidv4 } from 'uuid'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import TermAutocomplete from '@/features/search/components/Autocomplete'
import { AutocompleteType } from '@/features/search/models/search'
import type { GOlrResponse } from '@/features/search/models/search'
import type { ActivityType, Aspect, Entity } from '../../models/cam'
import { RootTypes } from '../../models/cam'
import type { EvidenceForm } from '../../models/formModels'
import { createEvidenceForm, createAutoPopulatedEvidence } from '../../models/formModels'
import { ROOT_NODES } from '../../data/camConstants'
import { getSearchClosures } from '../../data/nodeCategories'
import { makeSelectModelTerms, selectModelEvidence } from '../../slices/camSlice'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { canAddISSEvidence } from '../../services/annotationRules'
import DatabaseField from './DatabaseField'
import type { AnnotationFormOnSubmit } from '../../hooks/useOpenAnnotationForm'
import SearchAnnotations from './SearchAnnotations'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import SectionHeading from '@/@noctua.core/components/form/SectionHeading'

interface AnnotationFormProps {
  showTerm: boolean
  termLabel?: string
  termRootTypes?: string[]
  initialTerm?: Entity | null
  initialEvidences?: EvidenceForm[]
  gpId?: string
  aspect?: Aspect | null
  activityType?: ActivityType | null
  onSubmit?: AnnotationFormOnSubmit
}

const AnnotationForm: React.FC<AnnotationFormProps> = ({
  showTerm,
  termLabel = 'Term',
  termRootTypes = [],
  initialTerm = null,
  initialEvidences = [],
  gpId,
  aspect,
  activityType,
  onSubmit,
}) => {
  const canAddISS = canAddISSEvidence(aspect, activityType)
  const dispatch = useAppDispatch()

  const [term, setTerm] = useState<Entity | null>(initialTerm)
  const [evidences, setEvidences] = useState<EvidenceForm[]>(() =>
    initialEvidences.length > 0 ? initialEvidences : [createEvidenceForm()]
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null)

  // Scope the term search to the node's primary category (include + exclude), not its
  // raw root-type set, so an enabler search returns gene products rather than chemicals
  // and a Chemical/CC search still hides gene products / protein-containing complex. (#267)
  const { closureIds: searchRootTypes, excludeClosureIds: termExcludeRootTypes } = useMemo(
    () => getSearchClosures(termRootTypes),
    [termRootTypes]
  )

  const selectTerms = useMemo(makeSelectModelTerms, [])
  const termInitialOptions = useAppSelector(state =>
    selectTerms(state, searchRootTypes, termExcludeRootTypes)
  )
  const evidenceInitialOptions = useAppSelector(selectModelEvidence)
  const isLoggedIn = !!useAppSelector(selectAuthUser)

  const addEvidence = useCallback(() => {
    setEvidences(prev => [...prev, createEvidenceForm()])
  }, [])

  const removeEvidenceAt = useCallback((index: number) => {
    setEvidences(prev => prev.filter((_, i) => i !== index))
  }, [])

  const requestRemoveEvidenceAt = useCallback(
    (index: number) => {
      const ev = evidences[index]
      const rowHasContent = !!ev?.evidenceCode?.id || !!ev?.reference || !!ev?.withFrom
      if (!rowHasContent) {
        // Empty row — no data to lose, remove immediately
        removeEvidenceAt(index)
        return
      }
      setPendingRemoveIndex(index)
    },
    [evidences, removeEvidenceAt]
  )

  const confirmRemoveEvidenceAt = useCallback(() => {
    if (pendingRemoveIndex === null) return
    removeEvidenceAt(pendingRemoveIndex)
    setPendingRemoveIndex(null)
  }, [pendingRemoveIndex, removeEvidenceAt])

  const patchEvidence = useCallback(
    (uid: string, patch: Partial<EvidenceForm>) => {
      setEvidences(prev => prev.map(ev => (ev.uid === uid ? { ...ev, ...patch } : ev)))
    },
    []
  )

  const fillRow = useCallback(
    (uid: string, variant: 'iss' | 'iso' | 'ic') => {
      const { evidenceCode, reference, withFrom } = createAutoPopulatedEvidence(variant)
      patchEvidence(uid, { evidenceCode, reference, withFrom })
    },
    [patchEvidence]
  )

  const clearRow = useCallback(
    (uid: string) => {
      patchEvidence(uid, { evidenceCode: { id: '', label: '' }, reference: '', withFrom: '' })
    },
    [patchEvidence]
  )

  const handleTermChange = useCallback((value: GOlrResponse | null | string) => {
    if (typeof value === 'object' && value) {
      setTerm({ id: value.id, label: value.label })
    }
  }, [])

  const handleSearchAnnotations = useCallback(() => {
    if (!gpId || !aspect) return
    setPickerOpen(true)
  }, [gpId, aspect])

  const handlePickerApply = useCallback(
    ({
      term: pickedTerm,
      evidences: pickedEvidences,
    }: {
      term: Entity
      evidences: Array<{ evidenceCode: Entity; reference?: string; with?: string }>
    }) => {
      setTerm({ id: pickedTerm.id, label: pickedTerm.label })
      const nextEvidences: EvidenceForm[] =
        pickedEvidences.length > 0
          ? pickedEvidences.map(ev => ({
            uid: uuidv4(),
            evidenceCode: { id: ev.evidenceCode.id, label: ev.evidenceCode.label },
            reference: ev.reference || '',
            withFrom: ev.with || '',
          }))
          : [createEvidenceForm()]
      setEvidences(nextEvidences)
    },
    []
  )

  const handleFillRootTerm = useCallback(() => {
    const matchedRoot = termRootTypes.find(rt => ROOT_NODES[rt])
    if (!matchedRoot) return
    const { id, label } = ROOT_NODES[matchedRoot]
    setTerm({ id, label })
    setEvidences([createAutoPopulatedEvidence('nd')])
  }, [termRootTypes])

  const handleCancel = useCallback(() => {
    dispatch(closeDialog())
  }, [dispatch])

  const handleSave = useCallback(async () => {
    if (showTerm && !term) return
    const validEvidences = evidences.filter(ev => ev.evidenceCode?.id || ev.reference || ev.withFrom)
    await onSubmit?.({ term: showTerm ? term : null, evidences: validEvidences })
    dispatch(closeDialog())
  }, [showTerm, term, evidences, onSubmit, dispatch])

  const saveDisabled = showTerm && !term

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showTerm && (
          <section className="flex shrink-0 flex-col bg-white">
            <SectionHeading
              right={
                <div className="flex items-center gap-2">
                  {gpId && aspect && (
                    <Button size="compact-sm" variant="light" color="primary" onClick={handleSearchAnnotations}>
                      Search Annotations
                    </Button>
                  )}
                  {termRootTypes.length > 0 && canAddISS && (
                    <Button size="compact-sm" variant="light" color="primary" onClick={handleFillRootTerm}>
                      Fill with root term
                    </Button>
                  )}

                </div>
              }
            >
              Term
            </SectionHeading>
            <div className="px-3 py-2">
              <TermAutocomplete
                label={termLabel}
                name="annotation-term"
                autocompleteType={AutocompleteType.TERM}
                rootTypeIds={searchRootTypes}
                excludeRootTypeIds={termExcludeRootTypes}
                value={term}
                onChange={handleTermChange}
                variant="outlined"
                initialOptions={termInitialOptions}
              />
            </div>
          </section>
        )}

        <section className="flex min-h-0 flex-1 flex-col bg-white">
          <SectionHeading>Evidence</SectionHeading>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
            {evidences.map((ev, i) => (
              <div
                key={ev.uid}
                className="mb-2 flex w-full flex-row items-start gap-2 rounded border border-gray-200 bg-gray-50 p-2"
              >
                <div className="w-1/2 min-w-0">
                  <TermAutocomplete
                    label="Evidence"
                    name={`annotation-evidence-${ev.uid}`}
                    autocompleteType={AutocompleteType.EVIDENCE_CODE}
                    rootTypeIds={[RootTypes.EVIDENCE]}
                    value={
                      ev.evidenceCode?.id
                        ? ({ id: ev.evidenceCode.id, label: ev.evidenceCode.label } as GOlrResponse)
                        : null
                    }
                    onChange={value => {
                      if (typeof value === 'object' && value) {
                        patchEvidence(ev.uid, {
                          evidenceCode: { id: value.id, label: value.label },
                        })
                      }
                    }}
                    variant="outlined"
                    initialOptions={evidenceInitialOptions}
                  />
                </div>
                <div className="w-1/4 min-w-0">
                  <DatabaseField
                    type="reference"
                    value={ev.reference}
                    onChange={value => patchEvidence(ev.uid, { reference: value })}
                  />
                </div>
                <div className="w-1/4 min-w-0">
                  <DatabaseField
                    type="with"
                    value={ev.withFrom}
                    onChange={value => patchEvidence(ev.uid, { withFrom: value })}
                  />
                </div>
                <Menu shadow="md" position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="light" color="primary" radius="xl" size="md">
                      <FaEllipsisV size={12} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {canAddISS && <Menu.Item onClick={() => fillRow(ev.uid, 'iss')}>ISS</Menu.Item>}
                    {canAddISS && <Menu.Item onClick={() => fillRow(ev.uid, 'iso')}>ISO</Menu.Item>}
                    {canAddISS && <Menu.Item onClick={() => fillRow(ev.uid, 'ic')}>IC</Menu.Item>}
                    <Menu.Item onClick={() => clearRow(ev.uid)}>Clear Values</Menu.Item>
                    <Menu.Item
                      color="red"
                      disabled={evidences.length === 1}
                      onClick={() => requestRemoveEvidenceAt(i)}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>
            ))}
          </div>
          <div className="shrink-0 border-t border-gray-200 px-3 py-2">
            <Button
              size="compact-sm"
              variant="light"
              color="primary"
              leftSection={<FaPlus size={10} />}
              onClick={addEvidence}
            >
              {evidences.length === 0 ? 'Add evidence' : 'Add another evidence'}
            </Button>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          {isLoggedIn ? 'Cancel' : 'Close'}
        </Button>
        {isLoggedIn && (
          <Button onClick={handleSave} disabled={saveDisabled} variant="filled" size="sm">
            Save
          </Button>
        )}
      </div>

      {/* Locally-rendered picker — stacks on top of this dialog, doesn't evict it */}
      {gpId && aspect && (
        <SearchAnnotations
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onApply={handlePickerApply}
          gpId={gpId}
          aspect={aspect}
        />
      )}

      <ConfirmDialog
        open={pendingRemoveIndex !== null}
        onClose={() => setPendingRemoveIndex(null)}
        onConfirm={confirmRemoveEvidenceAt}
        title="Remove Evidence"
        message="Remove this evidence row? You'll lose what you've typed."
        confirmLabel="Remove"
      />
    </div>
  )
}

export default AnnotationForm
