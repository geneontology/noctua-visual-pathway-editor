import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { ActionIcon, Button } from '@mantine/core'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { v4 as uuidv4 } from 'uuid'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import TermAutocomplete from '@/features/search/components/Autocomplete'
import { AutocompleteType } from '@/features/search/models/search'
import type { GOlrResponse } from '@/features/search/models/search'
import type { Aspect, Entity } from '../../models/cam'
import { RootTypes } from '../../models/cam'
import type { EvidenceForm } from '../../models/formModels'
import { createEvidenceForm, createAutoPopulatedEvidence } from '../../models/formModels'
import { ROOT_NODES } from '../../data/camConstants'
import { makeSelectModelTerms, selectModelEvidence } from '../../slices/camSlice'
import DatabaseField from './DatabaseField'
import type { AnnotationFormOnSubmit } from '../../hooks/useOpenAnnotationForm'
import SearchAnnotations from './SearchAnnotations'

interface AnnotationFormProps {
  showTerm: boolean
  termLabel?: string
  termRootTypes?: string[]
  initialTerm?: Entity | null
  initialEvidences?: EvidenceForm[]
  gpId?: string
  aspect?: Aspect | null
  onSubmit?: AnnotationFormOnSubmit
}

const SectionHeader: React.FC<{ title: React.ReactNode; right?: React.ReactNode }> = ({
  title,
  right,
}) => (
  <div className="flex h-9 shrink-0 items-center justify-between border-b border-primary-500/30 bg-white px-3">
    <div className="text-xs font-semibold text-primary-700">{title}</div>
    {right}
  </div>
)

const AnnotationForm: React.FC<AnnotationFormProps> = ({
  showTerm,
  termLabel = 'Term',
  termRootTypes = [],
  initialTerm = null,
  initialEvidences = [],
  gpId,
  aspect,
  onSubmit,
}) => {
  const dispatch = useAppDispatch()

  const [term, setTerm] = useState<Entity | null>(initialTerm)
  const [evidences, setEvidences] = useState<EvidenceForm[]>(() =>
    initialEvidences.length > 0 ? initialEvidences : [createEvidenceForm()]
  )
  const [pickerOpen, setPickerOpen] = useState(false)

  const selectTerms = useMemo(makeSelectModelTerms, [])
  const termInitialOptions = useAppSelector(state => selectTerms(state, termRootTypes))
  const evidenceInitialOptions = useAppSelector(selectModelEvidence)

  const addEvidence = useCallback(() => {
    setEvidences(prev => [...prev, createEvidenceForm()])
  }, [])

  const addISSEvidence = useCallback(() => {
    setEvidences(prev => [...prev, createAutoPopulatedEvidence('iss')])
  }, [])

  const removeEvidenceAt = useCallback((index: number) => {
    setEvidences(prev => prev.filter((_, i) => i !== index))
  }, [])

  const patchEvidence = useCallback(
    (uid: string, patch: Partial<EvidenceForm>) => {
      setEvidences(prev => prev.map(ev => (ev.uid === uid ? { ...ev, ...patch } : ev)))
    },
    []
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

  const handleFillISSEvidence = useCallback(() => {
    setEvidences([createAutoPopulatedEvidence('iss')])
  }, [])

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
            <SectionHeader
              title="Term"
              right={
                <div className="flex items-center gap-2">
                  {gpId && aspect && (
                    <Button size="compact-sm" variant="light" color="primary" onClick={handleSearchAnnotations}>
                      Search Annotations
                    </Button>
                  )}
                  {termRootTypes.length > 0 && (
                    <Button size="compact-sm" variant="light" color="primary" onClick={handleFillRootTerm}>
                      Fill with root term
                    </Button>
                  )}
                  <Button size="compact-sm" variant="light" color="primary" onClick={handleFillISSEvidence}>
                    Add ISS
                  </Button>
                </div>
              }
            />
            <div className="px-3 py-2">
              <TermAutocomplete
                label={termLabel}
                name="annotation-term"
                autocompleteType={AutocompleteType.TERM}
                rootTypeIds={termRootTypes}
                value={term}
                onChange={handleTermChange}
                variant="outlined"
                initialOptions={termInitialOptions}
              />
            </div>
          </section>
        )}

        <section className="flex min-h-0 flex-1 flex-col bg-white">
          <SectionHeader
            title={`Evidence (${evidences.length})`}
            right={
              <div className="flex items-center gap-1">
                <Button size="compact-xs" variant="subtle" leftSection={<FaPlus size={10} />} onClick={addEvidence}>
                  Add evidence
                </Button>
                <Button size="compact-xs" variant="subtle" leftSection={<FaPlus size={10} />} onClick={addISSEvidence}>
                  Add ISS
                </Button>
              </div>
            }
          />
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
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="md"
                  onClick={() => removeEvidenceAt(i)}
                  disabled={evidences.length === 1}
                  title="Remove evidence"
                >
                  <FaTrash size={12} />
                </ActionIcon>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saveDisabled} variant="filled">
          Save
        </Button>
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
    </div>
  )
}

export default AnnotationForm
